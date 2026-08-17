export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Runs a request with an AbortSignal and rejects when it exceeds `ms`.
 * Requests that forward the signal are cancelled; SDK calls that do not still
 * time out so their queue slot is released and the upload can be retried.
 */
export function withTimeout<T>(
  makeRequestOrPromise: ((signal: AbortSignal) => Promise<T>) | Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  const controller = new AbortController();

  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      controller.abort(new Error(message));
      reject(new DOMException(message, "TimeoutError"));
    }, ms);

    try {
      const request =
        typeof makeRequestOrPromise === "function"
          ? makeRequestOrPromise(controller.signal)
          : makeRequestOrPromise;

      void request.then(resolve, reject).finally(() => {
        window.clearTimeout(timer);
      });
    } catch (error) {
      window.clearTimeout(timer);
      reject(error);
    }
  });
}
