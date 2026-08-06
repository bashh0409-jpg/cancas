import { NextRequest, NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { runAiProvider } from "@/lib/ai/providers";
import type { AiProvider, AiRunRequest, AiTask } from "@/lib/ai/types";

export const runtime = "nodejs";

const PROVIDERS = new Set<AiProvider>([
  "claude",
  "openai",
  "openai-images",
  "nano-banana",
  "stability",
  "topaz-gigapixel",
  "fal-ai",
  "fal-ai-inpainting",
  "fal-ai-upscale",
  "openai-vision",
  "claude-vision",
  "openai-embeddings",
  "runway",
  "kling",
  "amazon-tts",
  "elevenlabs",
  "openai-stt",
  "deepgram",
]);

const TASKS = new Set<AiTask>([
  "text",
  "image-generate",
  "image-edit",
  "video-generate",
  "upscale",
  "vision",
  "embeddings",
  "text-to-speech",
  "speech-to-text",
]);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const aiRequest = parseAiRunRequest(payload);
    const result = await runAiProvider(aiRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI Route Error]", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");

    if (error instanceof AiProviderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to run AI provider";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

function parseAiRunRequest(payload: unknown): AiRunRequest {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new AiProviderError("Request body must be an object", 400);
  }

  const record = payload as Record<string, unknown>;
  const provider = record.provider;
  const task = record.task;
  const prompt = record.prompt;
  const system = record.system;
  const options = record.options;

  if (typeof provider !== "string" || !PROVIDERS.has(provider as AiProvider)) {
    throw new AiProviderError("Unsupported AI provider", 400);
  }

  if (typeof task !== "string" || !TASKS.has(task as AiTask)) {
    throw new AiProviderError("Unsupported AI task", 400);
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new AiProviderError("Prompt is required", 400);
  }

  if (system !== undefined && typeof system !== "string") {
    throw new AiProviderError("System prompt must be a string", 400);
  }

  if (
    options !== undefined &&
    (typeof options !== "object" || options === null || Array.isArray(options))
  ) {
    throw new AiProviderError("Options must be an object", 400);
  }

  return {
    provider: provider as AiProvider,
    task: task as AiTask,
    prompt,
    system,
    options,
  } as AiRunRequest;
}
