import { AiProviderError } from "./errors";
import type { JsonValue } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(asJsonValue);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, asJsonValue(entry)])
    );
  }

  return null;
}

export async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AiProviderError(
      "Provider returned invalid JSON",
      response.status || 502
    );
  }
}

export function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export function getNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
}

export function getArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value : undefined;
}

export async function assertOk(response: Response, providerName: string) {
  if (response.ok) {
    return;
  }

  // Read raw response text so we can include helpful debugging information
  const text = await response.text().catch(() => "");
  let message: string | undefined;

  if (text) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      message = isRecord(parsed)
        ? getString(parsed, "error") ?? getString(parsed, "message")
        : undefined;
    } catch {
      // Not JSON — include a truncated raw text snippet for diagnostics
      message = text.length > 200 ? `${text.slice(0, 200)}...` : text;
    }
  }

  throw new AiProviderError(
    `${providerName} request failed${message ? `: ${message}` : ""} (status: ${response.status})`,
    response.status || 502
  );
}
