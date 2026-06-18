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
      aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
      className="mono inline-flex h-8 w-8 items-center justify-center rounded border border-black/20 bg-black/10 text-black transition hover:bg-white/20"
      type="button"
      onClick={onClick}
    >
      {isPlaying ? (
        <svg
          aria-hidden
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect height="14" rx="1" width="4.5" x="6" y="5" />
          <rect height="14" rx="1" width="4.5" x="13.5" y="5" />
        </svg>
      ) : (
        <svg
          aria-hidden
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5.5v13l10-6.5-10-6.5z" />
        </svg>
      )}
    </button>
  );
}
