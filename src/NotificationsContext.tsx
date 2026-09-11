import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { api, type AppNotification } from "./api";
import { getSocket, disconnectSocket } from "./socket";

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
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(false);
  const userId = user?.id;

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
    };
    const onMessage = () => {
      refreshUnreadMessages();
    };

    socket.on("notification:new", onNotification);
    socket.on("message:new", onMessage);
    socket.on("message:deleted", onMessage);

    return () => {
      socket.off("notification:new", onNotification);
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
