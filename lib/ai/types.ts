export type AiProvider =
  | "claude"
  | "openai"
  | "openai-images"
  | "gemini"
  | "nano-banana"
  | "stability"
  | "replicate"
  | "seedance"
  | "topaz-gigapixel";

export type AiTask =
  | "text"
  | "image-generate"
  | "image-edit"
  | "video-generate"
  | "upscale";

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
  jobId?: string;
  eta?: string;
  raw?: JsonValue;
};
