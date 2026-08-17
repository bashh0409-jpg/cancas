export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Runs `makeRequest` with an AbortSignal that fires after `ms` milliseconds.
 * Unlike a plain Promise.race timeout, this actually cancels the underlying
 * request when it times out (the signal is passed into `makeRequest`, which
 * must forward it to the actual fetch/upload call) — so a timed-out request
 * releases its network connection immediately instead of continuing to run
 * in the background and silently eating into the browser's per-origin
 * connection limit.
 */
export function withTimeout<T>(
  makeRequestOrPromise: ((signal: AbortSignal) => Promise<T>) | Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort(new Error(message));
  }, ms);

  try {
    if (typeof makeRequestOrPromise === "function") {
      return makeRequestOrPromise(controller.signal).finally(() => {
        window.clearTimeout(timer);
      });
    }

    // If a Promise was passed directly (older/incorrect callsite), handle
    // it gracefully by returning the promise and ensuring the timeout is
    // cleared when it settles. Note: we cannot abort the underlying
    // operation in this case because we don't have a signal wired up.
    return (makeRequestOrPromise as Promise<T>).finally(() => {
      window.clearTimeout(timer);
    });
  } catch (err) {
    window.clearTimeout(timer);
    return Promise.reject(err);
  }
}