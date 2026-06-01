export type VoiceNoteMenuAction = "delete" | "transcribe" | "ask-ai";

type VoiceNoteOptionsMenuProps = {
  isOpen: boolean;
  onAction: (action: VoiceNoteMenuAction) => void;
  onToggle: () => void;
};

export function VoiceNoteOptionsMenu({
  isOpen,
  onAction,
  onToggle,
}: VoiceNoteOptionsMenuProps) {
  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Voice note options"
        className="pixel rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] tracking-tight text-white opacity-0 transition group-hover:opacity-100 hover:bg-white/20"
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        •••
      </button>

      {isOpen ? (
        <div
          className="absolute right-3 top-9 z-20 w-32 rounded-md border border-white/20 bg-zinc-950/95 p-1 shadow-lg"
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            className="pixel block w-full rounded px-2 py-1 text-left text-[11px] tracking-tight text-white transition hover:bg-white/10"
            role="menuitem"
            type="button"
            onClick={() => onAction("delete")}
          >
            Delete
          </button>
          <button
            className="pixel mt-0.5 block w-full rounded px-2 py-1 text-left text-[11px] tracking-tight text-white transition hover:bg-white/10"
            role="menuitem"
            type="button"
            onClick={() => onAction("transcribe")}
          >
            Transcribe
          </button>
          <button
            className="pixel mt-0.5 block w-full rounded px-2 py-1 text-left text-[11px] tracking-tight text-white transition hover:bg-white/10"
            role="menuitem"
            type="button"
            onClick={() => onAction("ask-ai")}
          >
            Ask AI
          </button>
        </div>
      ) : null}
    </>
  );
}
