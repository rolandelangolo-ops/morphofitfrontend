import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api, type AppNotification, type Conversation, type UserPublic } from "../../api";
import { useNotifications } from "../../NotificationsContext";
import { getSocket } from "../../socket";
import { Card } from "../../components/ui/primitives";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConversationList } from "./messaging/ConversationList";
import { ChatPane } from "./messaging/ChatPane";
import { NewChatModal } from "./messaging/NewChatModal";

export default function Messaging() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { refreshUnreadMessages } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const reload = useCallback(() => {
    api.messaging.conversations().then(setConversations).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const socket = getSocket();
    const onActivity = () => {
      reload();
      refreshUnreadMessages();
    };
    // `message:new`/`message:deleted` only reach this socket for a
    // conversation whose room it has joined (i.e. its ChatPane is/was open)
    // — sitting on the plain list never joins any room, so relying on these
    // alone leaves the list stale until a manual reload. `notification:new`
    // is always delivered (pushed to this user's own room, joined
    // automatically on connect), so it's the reliable trigger here.
    const onNotification = (n: AppNotification) => {
      if (n.type === "message_received") onActivity();
    };
    socket.on("message:new", onActivity);
    socket.on("message:deleted", onActivity);
    socket.on("notification:new", onNotification);
    return () => {
      socket.off("message:new", onActivity);
      socket.off("message:deleted", onActivity);
      socket.off("notification:new", onNotification);
    };
  }, [reload, refreshUnreadMessages]);

  const active = conversations.find((c) => c.id === conversationId);

  const startConversation = async (person: UserPublic) => {
    setNewChatOpen(false);
    try {
      const conversation = await api.messaging.createConversation(person.id);
      reload();
      navigate(`/dashboard/messages/${conversation.id}`);
    } catch {
      // NewChatModal's search only surfaces reachable counterparts, so a
      // failure here is rare (e.g. they were deactivated mid-search) — the
      // list simply won't navigate, which is a safe no-op.
    }
  };

  return (
    <div className="h-[calc(100dvh-180px)] min-h-[500px] lg:h-[calc(100dvh-140px)]">
      <Card className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-[340px_1fr]">
        <div className={`${conversationId ? "hidden lg:block" : "block"} h-full border-r border-parchment-dark bg-surface`}>
          <ConversationList
            conversations={conversations}
            loading={loading}
            activeId={conversationId}
            onSelect={(c) => navigate(`/dashboard/messages/${c.id}`)}
            onNewChat={() => setNewChatOpen(true)}
          />
        </div>
        <div className={`${conversationId ? "block" : "hidden lg:block"} h-full bg-surface`}>
          {active ? (
            <ChatPane conversation={active} onBack={() => navigate("/dashboard/messages")} onActivity={reload} />
          ) : (
            <div className="flex h-full items-center justify-center p-8 bg-parchment/30">
              <EmptyState icon="message" title="Select a conversation" description="Choose someone from the list, or start a new conversation." />
            </div>
          )}
        </div>
      </Card>

      <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} onSelect={startConversation} />
    </div>
  );
}
