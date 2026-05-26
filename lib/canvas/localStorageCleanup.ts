export function clearAllCanvasLocalData() {
  if (typeof window === "undefined") {
    return 0;
  }

  let removed = 0;

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith("canvasai:")) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }

  return removed;
}
