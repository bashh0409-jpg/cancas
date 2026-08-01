"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Brain, FileText, Trash2 } from "lucide-react";

type TranscriptionMenuAction = "delete" | "ask-ai" | "summarize";

type TranscriptionContextMenuProps = {
  x: number;
  y: number;
  onAction: (action: TranscriptionMenuAction) => void;
  onClose: () => void;
};

export function TranscriptionContextMenu({
  x,
  y,
  onAction,
  onClose,
}: TranscriptionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const id = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);
    document.addEventListener("keydown", handleEscape);

    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 220);

  const items: {
    action: TranscriptionMenuAction;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      action: "summarize",
      label: "Summarize",
      icon: <FileText className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      action: "ask-ai",
      label: "Ask AI",
      icon: <Brain className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      action: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[300] w-[180px] rounded border border-white/10 bg-[#212126] shadow-2xl py-1"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item) => (
        <button
          key={item.action}
          type="button"
          onClick={() => {
            onAction(item.action);
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[11px] mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
