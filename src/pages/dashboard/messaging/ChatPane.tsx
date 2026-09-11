import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../../AuthContext";
import { useNotifications } from "../../../NotificationsContext";
import { useCall } from "../../../components/shell/CallProvider";
import { getSocket } from "../../../socket";
import { api, type ChatMessage, type Conversation } from "../../../api";
import { AppIcon } from "../../../components/ui/icons";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { LightboxModal } from "./LightboxModal";

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function ChatPane({
  conversation,
  onBack,
  onActivity,
}: {
  conversation: Conversation;
  onBack: () => void;
  onActivity: () => void;
}) {
  const { user } = useAuth();
  const { refreshUnreadMessages } = useNotifications();
  const { startCall } = useCall();
  const { show } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const participant = conversation.participant;

  useEffect(() => {
    let cancelled = false;

    const loadMessages = () => {
      api.messaging
        .messages(conversation.id)
        .then((list) => {
          if (!cancelled) setMessages(list);
        })
        .finally(() => !cancelled && setLoading(false));
    };

    setLoading(true);
    setMessages([]);
    loadMessages();

    api.messaging.markRead(conversation.id).then(refreshUnreadMessages).catch(() => {});

    const socket = getSocket();
    socket.emit("conversation:join", conversation.id);

    // Socket.IO's own reconnect logic restores the underlying connection
    // (and the server re-adds it to the user's personal room automatically —
    // see sockets/index.js), but a custom room like this one is only joined
    // when we explicitly ask, and that ask doesn't survive a reconnect. Left
    // unhandled, a dropped connection (network blip, backend restart, a
    // mobile tab suspended and resumed) leaves the chat silently un-subscribed
    // — the socket looks "connected" again but stops receiving this
    // conversation's events until the page is reloaded. Re-joining plus a
    // fresh fetch on every `connect` (which Socket.IO fires on reconnects
    // too, not just the first connection) closes that gap and catches up on
    // anything sent while disconnected.
    const onConnect = () => {
      socket.emit("conversation:join", conversation.id);
      loadMessages();
    };
    socket.on("connect", onConnect);

    const onNew = (payload: ChatMessage) => {
      if (payload.conversationId !== conversation.id) return;
      setMessages((list) => (list.some((m) => m.id === payload.id) ? list : [...list, payload]));
      if (payload.senderId !== user?.id) {
        api.messaging.markRead(conversation.id).then(refreshUnreadMessages).catch(() => {});
      }
      onActivity();
    };
    const onUpdated = (payload: ChatMessage) => {
      if (payload.conversationId !== conversation.id) return;
      setMessages((list) => list.map((m) => (m.id === payload.id ? payload : m)));
    };
    const onRead = ({ conversationId, readerId }: { conversationId: string; readerId: string }) => {
      if (conversationId !== conversation.id) return;
      setMessages((list) =>
        list.map((m) => (!m.readBy.includes(readerId) ? { ...m, readBy: [...m.readBy, readerId] } : m))
      );
    };
    const onTypingStart = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== conversation.id) return;
      setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 4000);
    };
    const onTypingStop = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== conversation.id) return;
      setTyping(false);
    };

    socket.on("message:new", onNew);
    socket.on("message:deleted", onUpdated);
    socket.on("message:reaction", onUpdated);
    socket.on("message:read", onRead);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      cancelled = true;
      socket.emit("conversation:leave", conversation.id);
      socket.off("connect", onConnect);
      socket.off("message:new", onNew);
      socket.off("message:deleted", onUpdated);
      socket.off("message:reaction", onUpdated);
      socket.off("message:read", onRead);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  const setTypingState = (isTyping: boolean) => {
    getSocket().emit(isTyping ? "typing:start" : "typing:stop", { conversationId: conversation.id });
  };

  const sendText = async (text: string) => {
    try {
      const message = await api.messaging.sendMessage(conversation.id, { text });
      setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message]));
      onActivity();
    } catch (err) {
      show({ title: "Message not sent", description: err instanceof Error ? err.message : undefined, tone: "error" });
    }
  };

  const sendImage = async (file: File) => {
    try {
      const message = await api.messaging.sendMessage(conversation.id, { file });
      setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message]));
      onActivity();
    } catch (err) {
      show({ title: "Photo not sent", description: err instanceof Error ? err.message : undefined, tone: "error" });
    }
  };

  const sendVoice = async (blob: Blob, durationSec: number) => {
    try {
      const file = new File([blob], `voice-note.${blob.type.includes("webm") ? "webm" : "m4a"}`, { type: blob.type });
      const message = await api.messaging.sendMessage(conversation.id, { file, durationSec });
      setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message]));
      onActivity();
    } catch (err) {
      show({ title: "Voice note not sent", description: err instanceof Error ? err.message : undefined, tone: "error" });
    }
  };

  const react = async (messageId: string, emoji: string) => {
    try {
      const updated = await api.messaging.react(conversation.id, messageId, emoji);
      setMessages((list) => list.map((m) => (m.id === updated.id ? updated : m)));
    } catch {
      // Reaction is a low-stakes action
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const updated = await api.messaging.deleteMessage(conversation.id, messageId);
      setMessages((list) => list.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      show({ title: "Couldn't delete message", description: err instanceof Error ? err.message : undefined, tone: "error" });
    }
  };

  let lastDay = "";

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-3 border-b border-parchment-dark px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-parchment lg:hidden"
        >
          <AppIcon name="chevronLeft" size={16} />
        </button>
        {(() => {
          const headerInner = (
            <>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest font-display font-bold text-white shadow-xs">
                {participant?.avatarUrl ? (
                  <img src={participant.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  participant?.name[0]?.toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-body text-sm font-semibold text-ink">
                  {participant?.name ?? "Deactivated account"}
                </span>
                {typing && (
                  <span className="block font-data text-[10px] uppercase tracking-wide text-forest animate-pulse">
                    typing…
                  </span>
                )}
              </span>
            </>
          );
          return participant ? (
            <Link to={`/dashboard/users/${participant.id}`} className="flex min-w-0 flex-1 items-center gap-2.5 no-underline">
              {headerInner}
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">{headerInner}</div>
          );
        })()}
        {participant && (
          <button
            onClick={() => startCall(participant, conversation.id)}
            aria-label="Call"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-forest transition-colors hover:bg-parchment"
          >
            <AppIcon name="phone" size={16} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <SkeletonList rows={4} />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const day = dayLabel(m.createdAt);
              const showDivider = day !== lastDay;
              lastDay = day;
              return (
                <div key={m.id}>
                  {showDivider && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-parchment px-3 py-1 font-data text-[9px] uppercase tracking-wide text-ink-subtle border border-parchment-dark/50">
                        {day}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={m}
                    isMine={m.senderId === user?.id}
                    showMeta
                    readByCounterpart={Boolean(participant && m.readBy.includes(participant.id))}
                    onDelete={() => deleteMessage(m.id)}
                    onReact={(emoji) => react(m.id, emoji)}
                    onImageClick={setLightboxUrl}
                  />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <Composer
        onSendText={sendText}
        onSendImage={sendImage}
        onSendVoice={sendVoice}
        onTypingChange={setTypingState}
      />

      <LightboxModal url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
