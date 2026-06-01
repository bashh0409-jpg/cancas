export const VOICE_NOTE_RECORDED_EVENT = "canvasai:voice-note-recorded";

export type VoiceNoteRecordedDetail = {
  id: string;
  blob: Blob;
  durationMs: number;
};
