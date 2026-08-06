import { Clipboard, MessageCircle, Sparkles, Trash } from "lucide-react";

export type VoiceNoteMenuAction =
  | "delete"
  | "transcribe"
  | "summarize"
  | "ask-ai";

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
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Voice note options"
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full ml-1 text-[10px] tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <span className="relative ">•••</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[300] mt-1 w-[180px] overflow-hidden rounded border border-white/10 bg-[#212126]  shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => onAction("delete")}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Trash className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
            Delete
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => onAction("transcribe")}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Clipboard className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
            Transcribe
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => onAction("summarize")}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
            Summarize with AI
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => onAction("ask-ai")}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
            Ask AI
          </button>
        </div>
      )}
    </div>
  );
}
