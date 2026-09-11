import { AppIcon } from "../../../components/ui/icons";
import { PillButton } from "../../../components/ui/primitives";
import { SkeletonList } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import type { Conversation } from "../../../api";

function timeLabel(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ConversationList({
  conversations,
  loading,
  activeId,
  onSelect,
  onNewChat,
}: {
  conversations: Conversation[];
  loading: boolean;
  activeId?: string;
  onSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-parchment-dark px-4 py-3.5">
        <h2 className="font-display text-lg font-bold text-ink">Messages</h2>
        <PillButton variant="ghost" onClick={onNewChat}>
          + New
        </PillButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3">
            <SkeletonList rows={5} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="message"
              title="No conversations yet"
              description="Start a conversation with your stylist, tailor, or client."
            />
          </div>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`flex w-full items-center gap-3 border-b border-parchment-dark/70 px-4 py-3 text-left transition-colors ${
                  active
                    ? "bg-parchment font-medium"
                    : "bg-transparent hover:bg-parchment/60"
                }`}
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest font-display font-bold text-white shadow-xs">
                  {c.participant?.avatarUrl ? (
                    <img
                      src={c.participant.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    c.participant?.name[0]?.toUpperCase() ?? (
                      <AppIcon name="user" size={16} />
                    )
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-body text-sm font-semibold text-ink">
                      {c.participant?.name ?? "Unknown"}
                    </span>
                    <span className="flex-shrink-0 font-data text-[9px] text-ink-subtle">
                      {timeLabel(c.lastMessageAt)}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-body text-xs text-ink-muted">
                      {c.lastMessagePreview || "No messages yet"}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-seal px-1 font-data text-[9px] font-bold text-white">
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
