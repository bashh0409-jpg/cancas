"use client";

import { AudioLines, Mic, Square, StickyNote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { activateCanvasTextTool } from "@/lib/canvas/textToolEvents";
import {
  VOICE_NOTE_RECORDED_EVENT,
  type VoiceNoteRecordedDetail,
} from "@/lib/canvas/voiceNotes";

function ToolboxButton({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      type="button"
      onClick={onClick}
      className={[
        "flex h-8 w-8 items-center justify-center rounded border transition",
        active
          ? "border-red-500/30 bg-red-500 text-white shadow-[0_0_0_4px_rgba(239,68,68,0.14)]"
          : "border-black/10 bg-white text-black hover:bg-zinc-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function FloatingToolbox() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function handleToggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      startedAtRef.current = Date.now();
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const detail: VoiceNoteRecordedDetail = {
          id: crypto.randomUUID(),
          blob,
          durationMs: Math.max(1, Date.now() - startedAtRef.current),
        };

        window.dispatchEvent(
          new CustomEvent<VoiceNoteRecordedDetail>(VOICE_NOTE_RECORDED_EVENT, {
            detail,
          }),
        );

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }

  return (
    <div
      aria-label="Canvas toolbox"
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded border border-black/10 bg-white/90 p-0.5 shadow-[0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur-xl"
      role="toolbar"
    >
      <ToolboxButton label="Add sticky note" onClick={activateCanvasTextTool}>
        <StickyNote className="h-5 w-5 rotate-90" strokeWidth={1.5} />
      </ToolboxButton>

      <ToolboxButton
        active={isRecording}
        label={isRecording ? "Stop recording voice note" : "Record voice note"}
        onClick={handleToggleRecording}
      >
        {isRecording ? (
          <Square className="h-4 w-4 fill-current" strokeWidth={1.5} />
        ) : (
          <AudioLines className="h-5 w-5" strokeWidth={1.5} />
        )}
      </ToolboxButton>
    </div>
  );
}
