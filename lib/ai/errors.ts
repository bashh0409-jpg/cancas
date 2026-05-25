export class AiProviderError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new AiProviderError(
      `Missing required environment variable: ${name}`,
      500
    );
  }

  return value;
}
