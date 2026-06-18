"use client";

import { Globe, ImageIcon, Layers3, Cloud, AudioLines, StickyNote } from "lucide-react";

type CanvasObjectKind = "image" | "website" | "voice" | "text" | "cloud";

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

const KIND_CONFIG: Record<
  CanvasObjectKind,
  {
    label: string;
    icon: React.ReactNode;
  }
> = {
  image: {
    label: "Image",
    icon: <ImageIcon className="h-3.5 w-3.5" />,
  },
  website: {
    label: "Web",
    icon: <Globe className="h-3.5 w-3.5" />,
  },
  voice: {
    label: "Voice",
    icon: <AudioLines className="h-3.5 w-3.5" />,
  },
  text: {
    label: "Note",
    icon: <StickyNote className="h-3.5 w-3.5" />,
  },
  cloud: {
    label: "Cloud",
    icon: <Cloud className="h-3.5 w-3.5" />,
  }
};

export function CanvasContentsPanel({
  isOpen,
  items,
  onFocusItem,
  onToggleOpen,
}: CanvasContentsPanelProps) {
  return (
    <div
      className="absolute bottom-6 right-4 z-40"
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-end gap-1.5">
        <aside
          aria-hidden={!isOpen}
          className={[
            "absolute bottom-full right-0 mb-2 w-[260px] overflow-hidden",
            "border border-black/10 bg-white/95",
            "shadow-[0_16px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl",
            "transition-all duration-200 ease-out",
            "rounded-xl", // less rounded
            isOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0",
          ].join(" ")}
        >
          <div className="scrollbar-hide max-h-72 overflow-y-auto p-1">
            {items.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-black/45">
                <Layers3 className="h-3.5 w-3.5" />
                <span>Your canvas is still empty, add some elements!</span>
              </div>
            ) : (
              items.map((item) => {
                const config = KIND_CONFIG[item.kind];

                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => onFocusItem(item)}
                    className="flex w-full items-center gap-1 rounded-md px-2 py-2 text-left text-[11px] transition hover:bg-black/[0.04]"
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded-md bg-black/[0.04] text-black/55">
                      {config.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate  font-medium text-black/75">
                        {item.label}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-black/40">
                        {config.label}
                      </div>
                    </div>
                    <Cloud className="h-3.5 w-3.5 text-black" />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* trigger sits directly under panel, not offset left */}
        <button
          aria-expanded={isOpen}
          aria-label="Canvas contents"
          type="button"
          onClick={onToggleOpen}
          className={[
            "flex h-9 items-center gap-2 rounded-xl border border-black/10",
            "bg-white/95 px-3 text-black",
            "shadow-[0_10px_28px_rgba(0,0,0,0.10)] backdrop-blur-xl",
            "transition",
            isOpen ? "ring-2 ring-[#0d99ff]/15" : "",
          ].join(" ")}
        >
          <Layers3 className="h- w-4 text-black/60" />
          <span className="text-[11px] text-black/75">
            Layers
          </span>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-black/[0.05] px-1.5 text-[10px] font-semibold text-black/55">
            {items.length}
          </span>
        </button>
      </div>
    </div>
  );
}
