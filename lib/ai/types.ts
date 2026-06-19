export type AiProvider =
  | "claude"
  | "openai"
  | "openai-images"
  | "nano-banana"
  | "stability"
  | "topaz-gigapixel"
  | "fal-ai"
  | "fal-ai-inpainting"
  | "fal-ai-upscale"
  | "openai-vision"
  | "claude-vision"
  | "openai-embeddings"
  | "runway"
  | "kling"
  | "amazon-tts"
  | "elevenlabs"
  | "openai-stt"
  | "deepgram";

export type AiTask =
  | "text"
  | "image-generate"
  | "image-edit"
  | "video-generate"
  | "upscale"
  | "vision"
  | "embeddings"
  | "text-to-speech"
  | "speech-to-text";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AiRunOptions = {
  model?: string;
  size?: string;
  quality?: string;
  aspectRatio?: string;
  outputFormat?: "jpeg" | "png" | "webp";
  imageUrl?: string;
  imageBase64?: string;
  replicateVersion?: string;
  upscaleFactor?: string;
  width?: number;
  height?: number;
  /** For TTS: voice ID or name */
  voice?: string;
  /** For TTS/STT: language code */
  language?: string;
  /** For embeddings: number of dimensions */
  dimensions?: number;
  /** For video: duration in seconds */
  duration?: number;
  /** For fal.ai: endpoint override */
  falEndpoint?: string;
};

export type AiRunRequest = {
  provider: AiProvider;
  task: AiTask;
  prompt: string;
  system?: string;
  options?: AiRunOptions;
};

export type AiRunResponse = {
  provider: AiProvider;
  task: AiTask;
  model: string;
  text?: string;
  images?: string[];
  videos?: string[];
  audio?: string;
  embeddings?: number[];
  jobId?: string;
  eta?: string;
  raw?: JsonValue;
};