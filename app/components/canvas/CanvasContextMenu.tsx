"use client";

import { useEffect, useRef } from "react";
import { StickyNote, ImageIcon, FileText, Import, X, Search, Brain } from "lucide-react";
import { activateCanvasTextTool } from "@/lib/canvas/textToolEvents";
import { CANVAS_AI_CHAT_TOOL_EVENT } from "@/lib/canvas/aiChatToolEvents";

type CanvasContextMenuProps = {
  x: number;
  y: number;
  onClose: () => void;
  onImportClick: () => void;
};

export function CanvasContextMenu({
  x,
  y,
  onClose,
  onImportClick,
}: CanvasContextMenuProps) {
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

    // Use a microtask delay to prevent the contextmenu event itself from closing the menu
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

  // Keep menu within viewport bounds
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] w-[200px] rounded border border-white/10 bg-[#212126] shadow-2xl py-1"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Sticky note */}
      <div className="px-1 mb-0.5">
        <div className=" w-full  gap-2 px-1 flex bg-white/10 items-center rounded-xs border border-white/20  text-white">
          <Search className="w-5 h-5" strokeWidth={1.5} />{" "}
          <input
            type="text"
            placeholder="Search files, layers..."
            className=" w-full   h-full py-1 text-xs uppercase text-white mono tracking-tight placeholder-white/40 focus:outline-none focus:border-none focus:ring-0 focus:ring-white/0"
          />
        </div>
      </div>
      <div className="h-px w-full bg-white/10 " />
      <button
        type="button"
        onClick={() => {
          activateCanvasTextTool();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-2 py-1 text-[11px] mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <StickyNote className="h-4 w-4 rotate-90" strokeWidth={1.5} />
        Add Sticky Note
      </button>
      <div className="h-px w-full bg-white/10 " />
      {/* AI Chat */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent(CANVAS_AI_CHAT_TOOL_EVENT));
          onClose();
        }}
        className="flex w-full items-center gap-2 px-2 py-1 text-[11px] mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <Brain className="w-4 h-4" /> New AI Chat
      </button>

      <div className="h-px w-full bg-white/10 " />

      {/* Import */}
      <button
        type="button"
        onClick={() => {
          onImportClick();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-2 py-1 text-[11px] mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
              <Import className="w-4 h-4"/>
        Import File
      </button>
    </div>
  );
}