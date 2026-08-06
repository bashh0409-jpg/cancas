type VoiceNotePlayPauseButtonProps = {
  isPlaying: boolean;
  onClick: () => void;
};

export function VoiceNotePlayPauseButton({
  isPlaying,
  onClick,
}: VoiceNotePlayPauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
      className="mono inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.04] text-white transition hover:bg-white/20"
    >
      {isPlaying ? (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect height="12" rx="1" width="3.5" x="6.5" y="6" />
          <rect height="12" rx="1" width="3.5" x="14" y="6" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 translate-x-[0.5px]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5.5v13l10-6.5-10-6.5z" />
        </svg>
      )}
    </button>
  );
}
