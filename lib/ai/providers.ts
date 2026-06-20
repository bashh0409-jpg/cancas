import { AiProviderError, requireEnv } from "./errors";
import {
  asJsonValue,
  assertOk,
  getArray,
  getNumber,
  getString,
  isRecord,
  readJson,
} from "./json";
import type { AiRunRequest, AiRunResponse } from "./types";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const DEFAULTS = {
  claude: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  openaiImages: "dall-e-3",
  nanoBanana: "gemini-2.5-flash-image-preview",
  stability: "stable-image-core",
  topazGigapixel: "Low Resolution V2",
  falFlux: "fal-ai/flux-pro/v1.1",
  falInpainting: "fal-ai/flux/dev/inpainting",
  falUpscale: "fal-ai/real-esrgan",
  openaiEmbeddings: "text-embedding-3-large",
  runway: "runway/gen-4",
  kling: "kling/v2",
  elevenlabs: "eleven_multilingual_v2",
  deepgram: "nova-2",
  openaiTTS: "tts-1",
} as const;

export async function runAiProvider(
  request: AiRunRequest
): Promise<AiRunResponse> {
  switch (request.provider) {
    case "claude":
      return runClaude(request);
    case "openai":
      return runOpenAIText(request);
    case "openai-images":
      return runOpenAIImage(request);
    case "nano-banana":
      return runNanoBanana(request);
    case "stability":
      return runStability(request);
    case "topaz-gigapixel":
      return runTopazGigapixel(request);
    case "fal-ai":
      return runFalAI(request, DEFAULTS.falFlux, "image-generate");
    case "fal-ai-inpainting":
      return runFalAI(request, DEFAULTS.falInpainting, "image-edit");
    case "fal-ai-upscale":
      return runFalAI(request, DEFAULTS.falUpscale, "upscale");
    case "openai-vision":
      return runOpenAIVision(request);
    case "claude-vision":
      return runClaudeVision(request);
    case "openai-embeddings":
      return runOpenAIEmbeddings(request);
    case "runway":
      return runRunway(request);
    case "kling":
      return runKling(request);
    case "amazon-tts":
      return runAmazonTTS(request);
    case "elevenlabs":
      return runElevenLabs(request);
    case "openai-stt":
      return runOpenAIStt(request);
    case "deepgram":
      return runDeepgram(request);
  }
}

async function runClaude(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const model =
    request.options?.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULTS.claude;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1600,
      system: request.system,
      messages: [{ role: "user", content: request.prompt }],
    }),
  });

  await assertOk(response, "Claude");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    text: extractClaudeText(payload),
    raw: asJsonValue(payload),
  };
}

async function runOpenAIText(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model =
    request.options?.model ?? process.env.OPENAI_TEXT_MODEL ?? DEFAULTS.openai;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: request.system,
      input: request.prompt,
    }),
  });

  await assertOk(response, "OpenAI");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    text: extractOpenAIText(payload),
    raw: asJsonValue(payload),
  };
}

async function runOpenAIImage(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model =
    request.options?.model ??
    process.env.OPENAI_IMAGE_MODEL ??
    DEFAULTS.openaiImages;

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: request.prompt,
      n: 1,
      size: request.options?.size ?? "1024x1024",
      quality: request.options?.quality,
    }),
  });

  await assertOk(response, "OpenAI Images");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    images: extractImageOutputs(payload),
    raw: asJsonValue(payload),
  };
}

/**
 * Nano Banana — uses GPT-4o Image Generation endpoint.
 * This is the provider for GPT-4o Image Generation / GPT-4o Vision.
 */
async function runNanoBanana(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model =
    request.options?.model ?? process.env.OPENAI_IMAGE_MODEL ?? "gpt-4o-image";

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: request.prompt,
      n: 1,
      size: request.options?.size ?? "1024x1024",
    }),
  });

  await assertOk(response, "Nano Banana / GPT-4o Image");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    images: extractImageOutputs(payload),
    raw: asJsonValue(payload),
  };
}

async function runStability(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("STABILITY_API_KEY");
  const model =
    request.options?.model ?? process.env.STABILITY_MODEL ?? DEFAULTS.stability;
  const outputFormat = request.options?.outputFormat ?? "png";
  const formData = new FormData();

  formData.set("prompt", request.prompt);
  formData.set("output_format", outputFormat);

  if (request.options?.aspectRatio) {
    formData.set("aspect_ratio", request.options.aspectRatio);
  }

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    {
      method: "POST",
      headers: {
        accept: "image/*",
        authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    }
  );

  await assertOk(response, "Stability AI");
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    provider: request.provider,
    task: request.task,
    model,
    images: [`data:image/${outputFormat};base64,${buffer.toString("base64")}`],
  };
}

async function runTopazGigapixel(
  request: AiRunRequest
): Promise<AiRunResponse> {
  const apiKey = requireEnv("TOPAZ_API_KEY");
  const model =
    request.options?.model ??
    process.env.TOPAZ_IMAGE_MODEL ??
    DEFAULTS.topazGigapixel;

  if (!request.options?.imageUrl) {
    throw new AiProviderError("Topaz Gigapixel requires options.imageUrl", 400);
  }

  const formData = new FormData();
  formData.set("source_url", request.options.imageUrl);
  formData.set("model", model);
  formData.set("output_format", request.options.outputFormat ?? "png");

  if (request.options.width) {
    formData.set("output_width", String(request.options.width));
  }

  if (request.options.height) {
    formData.set("output_height", String(request.options.height));
  }

  const response = await fetch(
    "https://api.topazlabs.com/image/v1/enhance/async",
    {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: formData,
    }
  );

  await assertOk(response, "Topaz Labs");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    jobId: isRecord(payload) ? getString(payload, "process_id") : undefined,
    eta: isRecord(payload)
      ? String(getNumber(payload, "eta") ?? getString(payload, "eta") ?? "")
      : undefined,
    raw: asJsonValue(payload),
  };
}

/**
 * fal.ai provider — supports image generation (Flux 1.1 Pro),
 * inpainting (Flux Inpainting), and upscaling (Real-ESRGAN).
 */
async function runFalAI(
  request: AiRunRequest,
  defaultModel: string,
  expectedTask: string
): Promise<AiRunResponse> {
  const apiKey = requireEnv("FAL_API_KEY");
  const model = request.options?.model ?? defaultModel;

  const endpoint =
    request.options?.falEndpoint ??
    `https://fal.run/${model}`;

  const body: Record<string, unknown> = {
    prompt: request.prompt,
  };

  if (request.options?.imageUrl) {
    body.image_url = request.options.imageUrl;
  }

  if (request.options?.imageBase64) {
    body.image = request.options.imageBase64;
  }

  if (request.options?.size) {
    body.image_size = request.options.size;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Key ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await assertOk(response, "fal.ai");
  const payload = await readJson(response);

  const images: string[] = [];
  const outputImages = isRecord(payload) ? payload.images ?? payload.image : null;

  if (Array.isArray(outputImages)) {
    for (const img of outputImages) {
      if (typeof img === "string") {
        images.push(img);
      } else if (isRecord(img) && typeof img.url === "string") {
        images.push(img.url);
      }
    }
  } else if (typeof outputImages === "string") {
    images.push(outputImages);
  }

  return {
    provider: request.provider,
    task: request.task,
    model,
    images: images.length > 0 ? images : undefined,
    raw: asJsonValue(payload),
  };
}

/**
 * GPT-4o Vision — send an image URL and get a text description.
 * Uses the OpenAI chat completions endpoint with image input.
 */
async function runOpenAIVision(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = request.options?.model ?? "gpt-4o";

  const content: unknown[] = [{ type: "text", text: request.prompt }];

  if (request.options?.imageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: request.options.imageUrl },
    });
  }

  if (request.options?.imageBase64) {
    const mimeType = request.options.imageBase64.includes("image/")
      ? request.options.imageBase64.split(";")[0].replace("data:", "")
      : "image/png";

    content.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${request.options.imageBase64}` },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: request.system ?? "You are a helpful assistant." },
        { role: "user", content },
      ],
      max_tokens: 1600,
    }),
  });

  await assertOk(response, "OpenAI Vision");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    text: extractChatCompletionText(payload),
    raw: asJsonValue(payload),
  };
}

/**
 * Claude Vision — send an image URL and get a text description.
 * Uses the Anthropic messages endpoint with image content.
 */
async function runClaudeVision(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const model = request.options?.model ?? "claude-sonnet-4-20250514";

  const content: unknown[] = [{ type: "text", text: request.prompt }];

  if (request.options?.imageUrl) {
    // Fetch the image and convert to base64
    const imageResponse = await fetch(request.options.imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const mimeType = imageResponse.headers.get("content-type") ?? "image/png";
    const base64 = imageBuffer.toString("base64");

    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: base64,
      },
    });
  }

  if (request.options?.imageBase64) {
    const mimeType = request.options.imageBase64.includes("image/")
      ? request.options.imageBase64.split(";")[0].replace("data:", "")
      : "image/png";

    const base64Data = request.options.imageBase64.includes(",")
      ? request.options.imageBase64.split(",")[1]
      : request.options.imageBase64;

    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: base64Data,
      },
    });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1600,
      system: request.system,
      messages: [{ role: "user", content }],
    }),
  });

  await assertOk(response, "Claude Vision");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    text: extractClaudeText(payload),
    raw: asJsonValue(payload),
  };
}

/**
 * OpenAI Embeddings — generates vector embeddings for text.
 * Uses text-embedding-3-large by default.
 */
async function runOpenAIEmbeddings(
  request: AiRunRequest
): Promise<AiRunResponse> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model =
    request.options?.model ??
    process.env.OPENAI_EMBEDDINGS_MODEL ??
    DEFAULTS.openaiEmbeddings;

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: request.prompt,
      dimensions: request.options?.dimensions,
    }),
  });

  await assertOk(response, "OpenAI Embeddings");
  const payload = await readJson(response);

  if (!isRecord(payload)) {
    return {
      provider: request.provider,
      task: request.task,
      model,
      raw: asJsonValue(payload),
    };
  }

  const data = getArray(payload, "data");
  const firstEmbedding = isRecord(data?.[0])
    ? (data[0] as Record<string, unknown>).embedding
    : undefined;

  return {
    provider: request.provider,
    task: request.task,
    model,
    embeddings: Array.isArray(firstEmbedding)
      ? (firstEmbedding as number[])
      : undefined,
    raw: asJsonValue(payload),
  };
}

/**
 * Runway Gen-4 — video generation.
 */
async function runRunway(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("RUNWAY_API_KEY");
  const model = request.options?.model ?? DEFAULTS.runway;

  const response = await fetch("https://api.runwayml.com/v1/video/generate", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: request.prompt,
      image_url: request.options?.imageUrl,
      duration: request.options?.duration ?? 5,
    }),
  });

  await assertOk(response, "Runway");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    videos: isRecord(payload) ? extractUrls(payload, "url") : undefined,
    jobId: isRecord(payload) ? getString(payload, "id") : undefined,
    raw: asJsonValue(payload),
  };
}

/**
 * Kling — video generation.
 */
async function runKling(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("KLING_API_KEY");
  const model = request.options?.model ?? DEFAULTS.kling;

  const response = await fetch("https://api.klingai.com/v1/videos/generate", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: request.prompt,
      image_url: request.options?.imageUrl,
      duration: request.options?.duration ?? 5,
    }),
  });

  await assertOk(response, "Kling");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    videos: isRecord(payload) ? extractUrls(payload, "url") : undefined,
    jobId: isRecord(payload) ? getString(payload, "request_id") : undefined,
    raw: asJsonValue(payload),
  };
}

/**
 * Amazon Polly — free tier text-to-speech.
 * Uses the AWS SDK v3.
 */
async function runAmazonTTS(request: AiRunRequest): Promise<AiRunResponse> {
  requireEnv("AWS_ACCESS_KEY_ID");
  requireEnv("AWS_SECRET_ACCESS_KEY");
  requireEnv("AWS_REGION");

  const engine = request.options?.model ?? "neural";
  const voiceId = request.options?.voice ?? "Joanna";

  const client = new PollyClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new SynthesizeSpeechCommand({
    Engine: engine as "standard" | "neural" | "long-form",
    OutputFormat: "mp3",
    Text: request.prompt,
    VoiceId: voiceId as any,
  });

  const response = await client.send(command);

  if (!response.AudioStream) {
    throw new AiProviderError("Amazon Polly returned no audio stream", 502);
  }

  // Collect chunks from the streaming response
  const chunks: Uint8Array[] = [];

  for await (const chunk of response.AudioStream as any) {
    chunks.push(chunk as Uint8Array);
  }

  const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

  return {
    provider: request.provider,
    task: request.task,
    model: `${engine}/${voiceId}`,
    audio: `data:audio/mpeg;base64,${buffer.toString("base64")}`,
  };
}

/**
 * Eleven Labs — premium text-to-speech.
 */
async function runElevenLabs(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const voice = request.options?.voice ?? "JBFqnCBsd6RMkjVDRZzb"; // Rachel (default)
  const model = request.options?.model ?? DEFAULTS.elevenlabs;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: request.prompt,
        model_id: model,
        output_format: "mp3_44100_128",
      }),
    }
  );

  await assertOk(response, "Eleven Labs");
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    provider: request.provider,
    task: request.task,
    model: `${model}/${voice}`,
    audio: `data:audio/mpeg;base64,${buffer.toString("base64")}`,
  };
}

/**
 * OpenAI Whisper — speech-to-text via the transcription API.
 */
async function runOpenAIStt(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = request.options?.model ?? DEFAULTS.openaiTTS;
  const language = request.options?.language;

  if (!request.options?.imageBase64) {
    throw new AiProviderError(
      "OpenAI STT requires options.imageBase64 (base64 audio)",
      400
    );
  }

  // Decode base64 audio and create a FormData with the audio file
  const audioBuffer = Buffer.from(request.options.imageBase64, "base64");
  const blob = new Blob([audioBuffer], { type: "audio/webm" });
  const formData = new FormData();
  formData.set("file", blob, "audio.webm");
  formData.set("model", model);

  if (language) {
    formData.set("language", language);
  }

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    }
  );

  await assertOk(response, "OpenAI STT");
  const payload = await readJson(response);

  if (!isRecord(payload)) {
    return {
      provider: request.provider,
      task: request.task,
      model,
      raw: asJsonValue(payload),
    };
  }

  return {
    provider: request.provider,
    task: request.task,
    model,
    text: getString(payload, "text"),
    raw: asJsonValue(payload),
  };
}

/**
 * Deepgram — speech-to-text.
 */
async function runDeepgram(request: AiRunRequest): Promise<AiRunResponse> {
  const apiKey = requireEnv("DEEPGRAM_API_KEY");
  const model = request.options?.model ?? DEFAULTS.deepgram;
  const language = request.options?.language ?? "en";

  if (!request.options?.imageBase64) {
    throw new AiProviderError(
      "Deepgram requires options.imageBase64 (base64 audio)",
      400
    );
  }

  // Decode base64 audio
  const audioBuffer = Buffer.from(request.options.imageBase64, "base64");

  const response = await fetch(
    `https://api.deepgram.com/v1/listen?model=${model}&language=${language}&smart_format=true`,
    {
      method: "POST",
      headers: {
        authorization: `Token ${apiKey}`,
        "content-type": "audio/webm",
      },
      body: audioBuffer,
    }
  );

  await assertOk(response, "Deepgram");
  const payload = await readJson(response);

  // Navigate the Deepgram response structure
  let text: string | undefined;

  if (isRecord(payload)) {
    const results = payload.results;
    const channels = isRecord(results)
      ? getArray(results as Record<string, unknown>, "channels")
      : undefined;
    const alternatives = isRecord(channels?.[0])
      ? getArray(channels[0] as Record<string, unknown>, "alternatives")
      : undefined;

    if (alternatives?.[0] && isRecord(alternatives[0])) {
      text = getString(alternatives[0] as Record<string, unknown>, "transcript");
    }
  }

  return {
    provider: request.provider,
    task: request.task,
    model,
    text,
    raw: asJsonValue(payload),
  };
}

// ─── Utility Helpers ────────────────────────────────────────────────────────

function extractClaudeText(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  const content = getArray(payload, "content");

  return content
    ?.map((entry) => (isRecord(entry) ? getString(entry, "text") : undefined))
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");
}

function extractOpenAIText(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  const outputText = getString(payload, "output_text");

  if (outputText) {
    return outputText;
  }

  const output = getArray(payload, "output");

  return output
    ?.flatMap((entry) => (isRecord(entry) ? getArray(entry, "content") ?? [] : []))
    .map((entry) => (isRecord(entry) ? getString(entry, "text") : undefined))
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");
}

function extractChatCompletionText(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  const choices = getArray(payload, "choices");
  const firstChoice = isRecord(choices?.[0]) ? choices[0] : undefined;
  const message = firstChoice
    ? isRecord(firstChoice as Record<string, unknown>)
      ? (firstChoice as Record<string, unknown>).message
      : undefined
    : undefined;

  if (isRecord(message as Record<string, unknown>)) {
    return getString(message as Record<string, unknown>, "content");
  }

  return undefined;
}

function extractImageOutputs(payload: unknown) {
  if (!isRecord(payload)) {
    return [];
  }

  const data = getArray(payload, "data") ?? [];

  return data
    .map((entry) => {
      if (!isRecord(entry)) {
        return undefined;
      }

      const base64 = getString(entry, "b64_json");

      return base64 ? `data:image/png;base64,${base64}` : getString(entry, "url");
    })
    .filter((entry): entry is string => Boolean(entry));
}

function extractUrls(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }

  return undefined;
}