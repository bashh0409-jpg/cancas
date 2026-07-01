const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

export class IdempotencyKeyError extends Error {
  constructor() {
    super("A valid idempotency key is required");
    this.name = "IdempotencyKeyError";
  }
}

export function normalizeIdempotencyKey(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const key = value.trim();

  if (key.length === 0 || key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    return null;
  }

  return key;
}

export function requireIdempotencyKey(value: unknown): string {
  const key = normalizeIdempotencyKey(value);

  if (!key) {
    throw new IdempotencyKeyError();
  }

  return key;
}

export function userScopedIdempotencyKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}
