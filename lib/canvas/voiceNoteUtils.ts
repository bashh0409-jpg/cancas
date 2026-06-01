export function formatVoiceDuration(durationMs: number) {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getVoiceWaveformHeights() {
  return [28, 48, 36, 62, 44, 30, 70, 54, 38, 66, 42, 58, 34, 64, 46, 32, 60, 40];
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read audio blob."));
    reader.readAsDataURL(blob);
  });
}

export function formatVoiceNoteTitle(durationMs: number) {
  return `Voice note ${formatVoiceDuration(durationMs)}`;
}
