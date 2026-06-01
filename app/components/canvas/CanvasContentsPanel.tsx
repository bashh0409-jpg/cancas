type CanvasObjectKind = "image" | "text" | "website" | "voice";

export type CanvasContentsItem = {
  id: string;
  kind: CanvasObjectKind;
  label: string;
};

type CanvasContentsPanelProps = {
  isOpen: boolean;
  items: CanvasContentsItem[];
  onFocusItem: (item: CanvasContentsItem) => void;
  onToggleOpen: () => void;
};

const KIND_LABELS: Record<CanvasObjectKind, string> = {
  image: "Image",
  text: "Text",
  website: "Web",
  voice: "Voice",
};

export function CanvasContentsPanel({
  isOpen,
  items,
  onFocusItem,
  onToggleOpen,
}: CanvasContentsPanelProps) {
  return (
    <div
      className="absolute bottom-20 right-4 z-40 text-white"
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <button
        aria-expanded={isOpen}
        aria-label="Canvas contents"
        className={[
          "flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-xs font-semibold shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur transition",
          isOpen
            ? "border-white/25 bg-white/20 text-white"
            : "border-white/15 bg-white/10 text-white/75 hover:bg-white/15 hover:text-white",
        ].join(" ")}
        type="button"
        onClick={onToggleOpen}
      >
        Layers
        <span className="ml-2 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] text-white/70">
          {items.length}
        </span>
      </button>

      <aside
        aria-hidden={!isOpen}
        className={[
          "absolute bottom-12 right-0 w-72 overflow-hidden rounded-lg border border-white/15 bg-zinc-950/95 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur transition",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        ].join(" ")}
      >
        <div className="border-b border-white/10 px-3 py-2">
          <p className="text-xs font-semibold text-white">Canvas contents</p>
        </div>
        <div className="scrollbar-hide max-h-72 overflow-y-auto p-1">
          {items.length === 0 ? (
            <p className="px-2 py-3 text-xs text-white/50">Nothing on canvas yet.</p>
          ) : (
            items.map((item) => (
              <button
                key={`${item.kind}-${item.id}`}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-white/75 transition hover:bg-white/10 hover:text-white"
                type="button"
                onClick={() => onFocusItem(item)}
              >
                <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                  {KIND_LABELS[item.kind]}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
