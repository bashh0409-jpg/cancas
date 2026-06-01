import { getVoiceWaveformHeights } from "@/lib/canvas/voiceNoteUtils";

type VoiceNoteWaveformProps = {
  durationMs: number;
  playbackMs: number;
  isPlaying: boolean;
};

export function VoiceNoteWaveform({
  durationMs,
  playbackMs,
  isPlaying,
}: VoiceNoteWaveformProps) {
  const bars = getVoiceWaveformHeights();
  const progressRatio =
    durationMs > 0 ? Math.min(1, playbackMs / durationMs) : 0;
  const progressedBars = Math.floor(progressRatio * bars.length);

  return (
    <div className="relative flex h-8 flex-1 items-center gap-0.5 rounded-md border border-white/20 bg-black/20 px-1.5 py-1">
      {bars.map((height, index) => {
        const isActive = isPlaying && index <= progressedBars;

        return (
          <span
            key={`voice-bar-${index}`}
            aria-hidden
            className={[
              "w-1 flex-1 rounded-full transition-all duration-200",
              isActive
                ? "bg-gradient-to-t from-[#0d99ff]/70 via-[#2bb7ff] to-[#8edcff]"
                : "bg-white/25",
            ].join(" ")}
            style={{
              height: `${Math.max(22, height)}%`,
              opacity: isActive ? 1 : 0.75,
              transform: isPlaying
                ? `scaleY(${1 + ((index % 3) * 0.08)})`
                : "scaleY(1)",
            }}
          />
        );
      })}
    </div>
  );
}
