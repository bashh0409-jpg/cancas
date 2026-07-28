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
        className="rounded px-1.5 py-0.5 text-[10px] tracking-tight text-black/70 opacity-100 transition group-hover:opacity-100 hover:bg-white/20"
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
          className="absolute right-3 top-9 z-20 w-42 rounded border-2 border-white/10 bg-[#212126] p-1 shadow-lg"
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            className="mono block uppercase tracking-tight w-full rounded px-2 py-1 text-left text-xs tracking-tight text-white transition hover:bg-white/10"
            role="menuitem"
            type="button"
            onClick={() => onAction("delete")}
          >
            Delete
          </button>
          <button
            className="mono mt-0.5 block w-full uppercase tracking-tight rounded px-2 py-1 text-left text-xs tracking-tight text-white   transition hover:bg-white/10"
            role="menuitem"
            type="button"
            onClick={() => onAction("transcribe")}
          >
            Transcribe
          </button>
          <button
            className="mono mt-0.5 block w-full uppercase tracking-tight rounded px-2 py-1 text-left text-xs tracking-tight text-white   transition hover:bg-white/10"
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
