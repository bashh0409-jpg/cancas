import { getVoiceWaveformHeights } from "@/lib/canvas/voiceNoteUtils";

type VoiceNoteWaveformProps = {
  durationMs: number;
  playbackMs: number;
  isPlaying: boolean;
  levels?: number[];
};

export function VoiceNoteWaveform({
  durationMs,
  playbackMs,
  isPlaying,
  levels,
}: VoiceNoteWaveformProps) {
  const bars = isPlaying && levels ? levels : getVoiceWaveformHeights();

  const progressRatio =
    durationMs > 0 ? Math.min(1, playbackMs / durationMs) : 0;

  const progressedBars = Math.floor(progressRatio * bars.length);

  return (
    <div className="flex h-7 flex-1 items-center gap-[2px] rounded-md border border-white/10 bg-white/5 px-1.5">
      {bars.map((h, i) => {
        const active = i <= progressedBars;

        return (
          <span
            key={i}
            className={[
              "w-[2px] rounded-full transition-all",
              active ? "bg-white/80" : "bg-white/20",
            ].join(" ")}
            style={{
              height: `${Math.max(20, h)}%`,
              transform: isPlaying ? `scaleY(${1 + (i % 2) * 0.05})` : "none",
            }}
          />
        );
      })}
    </div>
  );
}