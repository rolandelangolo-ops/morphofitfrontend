import { useRef, useState } from "react";
import { AppIcon } from "../../../components/ui/icons";
import type { ChatMessage } from "../../../api";

const REACTION_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(totalSec: number) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Inline voice-note player — real recording */
function AudioPlayer({
  url,
  durationSec,
  tone,
}: {
  url: string;
  durationSec?: number;
  tone: "mine" | "theirs";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${
          tone === "mine"
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-parchment text-forest hover:bg-parchment-dark/50"
        }`}
      >
        <AppIcon name={playing ? "pause" : "play"} size={14} />
      </button>
      <div
        className={`h-1 w-24 flex-shrink-0 rounded-full sm:w-32 ${
          tone === "mine" ? "bg-white/30" : "bg-parchment-dark"
        }`}
      >
        <div
          className={`h-1 rounded-full transition-all ${
            tone === "mine" ? "bg-white" : "bg-forest"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span
        className={`flex-shrink-0 font-data text-[10px] ${
          tone === "mine" ? "text-white/80" : "text-ink-subtle"
        }`}
      >
        {durationSec ? formatDuration(durationSec) : "0:00"}
      </span>
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          if (audio.duration) setProgress(audio.currentTime / audio.duration);
        }}
        className="hidden"
      />
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  showMeta,
  readByCounterpart,
  onDelete,
  onReact,
  onImageClick,
}: {
  message: ChatMessage;
  isMine: boolean;
  showMeta: boolean;
  readByCounterpart: boolean;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onImageClick: (url: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tone: "mine" | "theirs" = isMine ? "mine" : "theirs";
  const reactionCounts = message.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`group flex ${isMine ? "justify-end" : "justify-start"} px-1`}>
      <div className={`relative max-w-[78%] sm:max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`relative rounded-2xl px-3.5 py-2.5 ${
            message.deleted
              ? "border border-dashed border-parchment-dark bg-transparent"
              : isMine
              ? "bg-forest text-white shadow-xs"
              : "border border-parchment-dark bg-surface text-ink shadow-xs"
          }`}
        >
          {message.deleted ? (
            <span className="font-body text-xs italic text-ink-subtle">Message deleted</span>
          ) : message.type === "image" && message.attachmentUrl ? (
            <button onClick={() => onImageClick(message.attachmentUrl!)} className="block cursor-pointer">
              <img src={message.attachmentUrl} alt="" className="max-h-64 max-w-full rounded-xl object-cover hover:opacity-95" />
            </button>
          ) : message.type === "voice" && message.attachmentUrl ? (
            <AudioPlayer url={message.attachmentUrl} durationSec={message.attachmentDurationSec} tone={tone} />
          ) : (
            <p className="whitespace-pre-wrap break-words font-body text-sm">
              {message.text}
            </p>
          )}

          {!message.deleted && (
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Message actions"
              className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-parchment text-ink-subtle opacity-0 transition-opacity hover:text-ink group-hover:opacity-100 ${
                isMine ? "-left-8" : "-right-8"
              }`}
            >
              <AppIcon name="chevronDown" size={12} />
            </button>
          )}

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className={`absolute top-8 z-20 flex items-center gap-1 rounded-full border border-parchment-dark bg-surface p-1.5 shadow-lg ${
                  isMine ? "right-0" : "left-0"
                }`}
              >
                {REACTION_EMOJI.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      setMenuOpen(false);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-parchment"
                  >
                    {emoji}
                  </button>
                ))}
                {isMine && (
                  <button
                    onClick={() => {
                      onDelete();
                      setMenuOpen(false);
                    }}
                    aria-label="Delete message"
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[var(--status-error-text)] hover:bg-parchment"
                  >
                    <AppIcon name="close" size={13} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {Object.keys(reactionCounts).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span
                key={emoji}
                className="flex items-center gap-0.5 rounded-full border border-parchment-dark bg-surface px-1.5 py-0.5 font-data text-[10px] text-ink"
              >
                {emoji} {count > 1 && count}
              </span>
            ))}
          </div>
        )}

        {showMeta && (
          <div className="mt-1 flex items-center gap-1 px-1">
            <span className="font-data text-[9px] text-ink-subtle">{timeLabel(message.createdAt)}</span>
            {isMine && (
              <AppIcon
                name={readByCounterpart ? "checkCircle" : "check"}
                size={11}
                className={readByCounterpart ? "text-forest" : "text-ink-subtle"}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
