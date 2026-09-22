import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { api, ApiRequestError, type AppNotification } from "./api";
import { getSocket, disconnectSocket } from "./socket";
import { useToast } from "./components/ui/Toast";
import { router } from "./app/routes";

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  unreadMessages: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshUnreadMessages: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsState | null>(null);

/** Drives the notification bell, the Messages nav badge, and the
 * NotificationsDrawer from one place — mounted once in App.tsx alongside
 * AuthProvider. Connects the socket (src/socket.ts) as soon as a user is
 * signed in and tears it down on logout; `notification:new` and
 * `message:new` socket events keep counts live without polling. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, updateUser, logout } = useAuth();
  const { show } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(false);
  const userId = user?.id;
  const userRef = useRef(user);
  userRef.current = user;

  const refreshUnreadMessages = useCallback(async () => {
    try {
      const conversations = await api.messaging.conversations();
      setUnreadMessages(conversations.reduce((sum, c) => sum + c.unreadCount, 0));
    } catch {
      // Messaging may be briefly unavailable (e.g. backend restart) — the
      // badge just keeps its last known value rather than throwing.
    }
  }, []);

  const loadedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      setNotifications([]);
      setUnreadCount(0);
      setUnreadMessages(0);
      loadedRef.current = false;
      return;
    }

    if (!loadedRef.current) {
      loadedRef.current = true;
      setLoading(true);
      Promise.all([
        api.notifications.list().then(setNotifications).catch(() => {}),
        api.notifications.unreadCount().then((r) => setUnreadCount(r.count)).catch(() => {}),
        refreshUnreadMessages(),
      ]).finally(() => setLoading(false));
    }

    const signOut = (reason: string) => {
      show({ title: "Signed out", description: reason, tone: "error" });
      logout();
      // The manual sign-out buttons navigate too; without it the dashboard
      // stays mounted on a blank screen because route guards only run on navigation.
      router.navigate("/signin");
    };

    // Re-reads the account and applies it only if something actually changed
    // (a no-op patch would hand every page a new `user` object and make them
    // all refetch). A 401 means the session or account is gone.
    const syncAccount = () => {
      api.auth
        .me()
        .then((fresh) => {
          const cur = userRef.current;
          if (cur && (fresh.role !== cur.role || fresh.name !== cur.name || fresh.email !== cur.email)) updateUser(fresh);
        })
        .catch((err) => {
          if (err instanceof ApiRequestError && err.status === 401) signOut("Your session has ended. Please sign in again.");
        });
    };

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onNotification = (n: AppNotification) => {
      setNotifications((list) => [n, ...list]);
      setUnreadCount((c) => c + 1);
      // `message:new`/`message:deleted` below only reach us for a
      // conversation whose room this socket has actually joined (an open
      // ChatPane) — a user just sitting on the conversation list never
      // joins any room, so the badge would go stale until a manual reload.
      // `notification:new` always reaches us (it's pushed to this user's own
      // room, joined automatically on every connection), so it's the
      // reliable trigger for keeping the unread-messages count live.
      if (n.type === "message_received") refreshUnreadMessages();

      // An administrator changed this very account while the user is signed
      // in: reflect it now (new role/nav/name) instead of on the next login,
      // and end the session immediately if the account was deactivated.
      if (n.type === "account_deactivated_by_admin") signOut("An administrator deactivated your account.");
      else if (n.type === "role_changed_by_admin" || n.type === "account_updated_by_admin") syncAccount();
    };
    const onMessage = () => {
      refreshUnreadMessages();
    };

    socket.on("notification:new", onNotification);
    // Events sent while the socket was down (or not yet connected) are lost,
    // so every (re)connect re-syncs the account instead of trusting the push.
    socket.on("connect", syncAccount);
    // A deactivated account can no longer complete the socket handshake; ask
    // the API why, so the session ends instead of retrying forever.
    const onConnectError = (err: Error) => {
      if (err.message === "Unauthorized") syncAccount();
    };
    socket.on("connect_error", onConnectError);
    socket.on("message:new", onMessage);
    socket.on("message:deleted", onMessage);

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("connect", syncAccount);
      socket.off("connect_error", onConnectError);
      socket.off("message:new", onMessage);
      socket.off("message:deleted", onMessage);
    };
  }, [userId, refreshUnreadMessages]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.notifications.markRead(id);
    } catch {
      // Optimistic update stands even if the request fails — a stale read
      // flag self-corrects on the next full list load.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.notifications.markAllRead();
    } catch {
      // See markRead — same optimistic-update tradeoff.
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, unreadMessages, loading, markRead, markAllRead, refreshUnreadMessages }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
