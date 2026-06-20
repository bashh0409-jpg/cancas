import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AiSettings = {
  ttsProvider: "elevenlabs" | "amazon-tts";
  ttsVoice: string;
  speechRate: number;
  defaultAction: "ask" | "summarize" | "describe";
  autoSummarize: boolean;
};

type AiSettingsStore = AiSettings & {
  setTtsProvider: (provider: AiSettings["ttsProvider"]) => void;
  setTtsVoice: (voice: string) => void;
  setSpeechRate: (rate: number) => void;
  setDefaultAction: (action: AiSettings["defaultAction"]) => void;
  setAutoSummarize: (enabled: boolean) => void;
};

export const useAiSettingsStore = create<AiSettingsStore>()(
  persist(
    (set) => ({
      ttsProvider: "elevenlabs",
      ttsVoice: "JBFqnCBsd6RMkjVDRZzb", // Rachel
      speechRate: 0.9,
      defaultAction: "ask",
      autoSummarize: false,

      setTtsProvider: (ttsProvider) => set({ ttsProvider }),
      setTtsVoice: (ttsVoice) => set({ ttsVoice }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setDefaultAction: (defaultAction) => set({ defaultAction }),
      setAutoSummarize: (autoSummarize) => set({ autoSummarize }),
    }),
    { name: "canvasai:ai-settings" },
  ),
);

/** Map friendly voice names to ElevenLabs voice IDs. */
export const ELEVENLABS_VOICES: Record<string, string> = {
  Rachel: "JBFqnCBsd6RMkjVDRZzb",
  Antoni: "ErXwobaYiN019PkySvjV",
  Domi: "AZnzlk1XvdvUeBnXmlld",
  Bella: "EXAVITQu4vr2nSDKeFsu",
  Elli: "MF3mGyEYCl7XYWbV9V6O",
  Josh: "TxGEqnHWrfWFTfGW9XjX",
  Arnold: "VR6AewLTigWG4xSOukaG",
  Adam: "pNInz6obpgDQGcFmaJgB",
  Sam: "yoZ06aMxZJJ28mfd3POQ",
};