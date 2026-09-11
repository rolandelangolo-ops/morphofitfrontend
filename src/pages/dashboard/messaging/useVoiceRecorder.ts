import { useCallback, useRef, useState } from "react";

interface RecordedVoiceNote {
  blob: Blob;
  durationSec: number;
}

/** Thin wrapper around MediaRecorder — real mic capture (not a mock),
 * uploaded as a message attachment (see api.messaging.sendMessage). */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setRecording(true);
    } catch {
      setError("Microphone access was denied.");
    }
  }, []);

  const stop = useCallback((): Promise<RecordedVoiceNote | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        setRecording(false);
        resolve(blob.size > 0 ? { blob, durationSec } : null);
      };
      recorder.stop();
    });
  }, []);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.onstop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      setRecording(false);
    };
    recorder.stop();
  }, []);

  return { recording, error, start, stop, cancel };
}
