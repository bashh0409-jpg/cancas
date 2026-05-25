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

const DEFAULTS = {
  claude: "claude-sonnet-4-20250514",
  openai: "gpt-5.2",
  openaiImages: "gpt-image-1.5",
  gemini: "gemini-2.5-flash",
  nanoBanana: "gemini-2.5-flash-image-preview",
  stability: "stable-image-core",
  replicate: "black-forest-labs/flux-schnell",
  seedance: "bytedance/seedance-2.0",
  topazGigapixel: "Low Resolution V2",
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
    case "gemini":
      return runGemini(request, false);
    case "nano-banana":
      return runGemini(request, true);
    case "stability":
      return runStability(request);
    case "replicate":
      return runReplicate(request, DEFAULTS.replicate);
    case "seedance":
      return runReplicate(request, DEFAULTS.seedance);
    case "topaz-gigapixel":
      return runTopazGigapixel(request);
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

async function runGemini(
  request: AiRunRequest,
  imageMode: boolean
): Promise<AiRunResponse> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const defaultModel = imageMode ? DEFAULTS.nanoBanana : DEFAULTS.gemini;
  const envModel = imageMode
    ? process.env.GEMINI_IMAGE_MODEL
    : process.env.GEMINI_TEXT_MODEL;
  const model = request.options?.model ?? envModel ?? defaultModel;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: request.prompt }] }],
        generationConfig: imageMode
          ? { responseModalities: ["TEXT", "IMAGE"] }
          : undefined,
      }),
    }
  );

  await assertOk(response, imageMode ? "Nano Banana/Gemini Image" : "Gemini");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    text: extractGeminiText(payload),
    images: extractGeminiImages(payload),
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

async function runReplicate(
  request: AiRunRequest,
  defaultModel: string
): Promise<AiRunResponse> {
  const apiKey = requireEnv("REPLICATE_API_TOKEN");
  const model = request.options?.model ?? defaultModel;
  const endpoint = request.options?.replicateVersion
    ? "https://api.replicate.com/v1/predictions"
    : `https://api.replicate.com/v1/models/${model}/predictions`;
  const body = request.options?.replicateVersion
    ? { version: request.options.replicateVersion, input: buildReplicateInput(request) }
    : { input: buildReplicateInput(request) };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      prefer: "wait=10",
    },
    body: JSON.stringify(body),
  });

  await assertOk(response, "Replicate");
  const payload = await readJson(response);

  return {
    provider: request.provider,
    task: request.task,
    model,
    images: extractReplicateUrls(payload, "image"),
    videos: extractReplicateUrls(payload, "video"),
    jobId: isRecord(payload) ? getString(payload, "id") : undefined,
    raw: asJsonValue(payload),
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

function buildReplicateInput(request: AiRunRequest) {
  if (request.provider === "seedance") {
    return {
      prompt: request.prompt,
      image: request.options?.imageUrl,
      aspect_ratio: request.options?.aspectRatio,
    };
  }

  return {
    prompt: request.prompt,
    image: request.options?.imageUrl,
    aspect_ratio: request.options?.aspectRatio,
  };
}

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

function extractGeminiText(payload: unknown) {
  return extractGeminiParts(payload, "text").join("\n") || undefined;
}

function extractGeminiImages(payload: unknown) {
  return extractGeminiParts(payload, "inlineData")
    .map((part) => {
      if (!isRecord(part)) {
        return undefined;
      }

      const mimeType = getString(part, "mimeType") ?? "image/png";
      const data = getString(part, "data");

      return data ? `data:${mimeType};base64,${data}` : undefined;
    })
    .filter((entry): entry is string => Boolean(entry));
}

function extractGeminiParts(payload: unknown, key: "text" | "inlineData") {
  if (!isRecord(payload)) {
    return [];
  }

  const candidates = getArray(payload, "candidates") ?? [];

  return candidates.flatMap((candidate) => {
    if (!isRecord(candidate) || !isRecord(candidate.content)) {
      return [];
    }

    const parts = getArray(candidate.content, "parts") ?? [];

    return parts
      .map((part) => (isRecord(part) ? part[key] : undefined))
      .filter((entry): entry is string | Record<string, unknown> =>
        Boolean(entry)
      );
  });
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

function extractReplicateUrls(payload: unknown, kind: "image" | "video") {
  if (!isRecord(payload)) {
    return [];
  }

  const output = payload.output;
  const values = Array.isArray(output) ? output : output ? [output] : [];
  const extensions =
    kind === "image"
      ? [".png", ".jpg", ".jpeg", ".webp"]
      : [".mp4", ".mov", ".webm"];

  return values
    .filter((entry): entry is string => typeof entry === "string")
    .filter((entry) =>
      extensions.some((extension) => entry.toLowerCase().includes(extension))
    );
}
