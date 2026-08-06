import { getVoiceWaveformHeights } from "@/lib/canvas/voiceNoteUtils";

type VoiceNoteWaveformProps = {
  durationMs: number;
  playbackMs: number;
  isPlaying: boolean;
  levels?: number[];
};

const BAR_COUNT = 90;

function resampleWaveform(values: number[], count: number): number[] {
  if (!values.length) return [];

  if (values.length === count) return values;

  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index / count) * values.length);
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) / count) * values.length),
    );

    const chunk = values.slice(start, end);

    // Preserve peaks so loud parts of the recording remain visually prominent.
    return Math.max(...chunk);
  });
}

export function VoiceNoteWaveform({
  durationMs,
  playbackMs,
  isPlaying,
  levels,
}: VoiceNoteWaveformProps) {
  const sourceBars =
    isPlaying && levels?.length ? levels : getVoiceWaveformHeights();

  const bars = resampleWaveform(sourceBars, BAR_COUNT);

  const progressRatio =
    durationMs > 0 ? Math.min(1, Math.max(0, playbackMs / durationMs)) : 0;

  const progressedBars = Math.floor(progressRatio * bars.length);

  return (
    <div className="flex h-6 min-w-0 flex-1 items-center overflow-hidden rounded-full ] px-2">
      <div className="flex h-full w-full items-center gap-px">
        {bars.map((level, index) => {
          const active = index < progressedBars;

          return (
            <span
              key={index}
              className={[
                "w-px shrink-0 rounded-full transition-colors duration-150",
                active ? "bg-white" : "bg-white/20",
              ].join(" ")}
              style={{
                height: `${Math.max(12, Math.min(85, level))}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
