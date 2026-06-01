"use client";

import { useEffect, useRef, useState } from "react";
import {
  VOICE_NOTE_RECORDED_EVENT,
  type VoiceNoteRecordedDetail,
} from "@/lib/canvas/voiceNotes";
import { ToolbarButton } from "./ToolbarButton";

export function VoiceNoteToolButton() {
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
          })
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
    <ToolbarButton
      active={isRecording}
      icon="mic"
      label={isRecording ? "Stop recording voice note" : "Record voice note"}
      onClick={handleToggleRecording}
    />
  );
}
