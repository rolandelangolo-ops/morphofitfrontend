import { useRef, useState } from "react";
import { AppIcon } from "../../../components/ui/icons";
import { useVoiceRecorder } from "./useVoiceRecorder";

export function Composer({
  onSendText,
  onSendImage,
  onSendVoice,
  onTypingChange,
  disabled,
}: {
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  onSendVoice: (blob: Blob, durationSec: number) => void;
  onTypingChange: (typing: boolean) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorder = useVoiceRecorder();

  const handleChange = (value: string) => {
    setText(value);
    onTypingChange(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingChange(false), 1800);
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText("");
    onTypingChange(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSendImage(file);
  };

  const finishRecording = async () => {
    const note = await recorder.stop();
    if (note) onSendVoice(note.blob, note.durationSec);
  };

  if (recorder.recording) {
    return (
      <div className="flex items-center gap-3 border-t border-parchment-dark bg-surface px-4 py-3">
        <span className="h-2.5 w-2.5 flex-shrink-0 animate-pulse rounded-full bg-[var(--status-error-text)]" />
        <span className="flex-1 font-body text-sm text-ink">Recording voice note…</span>
        <button
          onClick={recorder.cancel}
          className="rounded-full bg-parchment px-3 py-1.5 font-body text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
        <button
          onClick={finishRecording}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-white shadow-xs transition-transform active:scale-95"
          aria-label="Send voice note"
        >
          <AppIcon name="check" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-end gap-2 border-t border-parchment-dark bg-surface px-3 py-3">
      <button
        onClick={() => fileInputRef.current?.click()}
        aria-label="Attach image"
        disabled={disabled}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-parchment hover:text-ink disabled:opacity-50"
      >
        <AppIcon name="camera" size={17} />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Message…"
        rows={1}
        disabled={disabled}
        className="max-h-28 flex-1 resize-none rounded-2xl border border-parchment-dark bg-parchment/60 px-3.5 py-2 font-body text-sm text-ink outline-none transition-colors focus:border-forest focus:bg-surface focus:ring-1 focus:ring-forest/20"
      />

      {text.trim() ? (
        <button
          onClick={send}
          aria-label="Send"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-forest text-white shadow-xs transition-transform active:scale-95"
        >
          <AppIcon name="send" size={16} />
        </button>
      ) : (
        <button
          onClick={recorder.start}
          aria-label="Record voice note"
          disabled={disabled}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-parchment hover:text-ink disabled:opacity-50"
        >
          <AppIcon name="mic" size={17} />
        </button>
      )}
      {recorder.error && (
        <span className="absolute -top-6 left-3 font-body text-[10px] text-[var(--status-error-text)]">
          {recorder.error}
        </span>
      )}
    </div>
  );
}
