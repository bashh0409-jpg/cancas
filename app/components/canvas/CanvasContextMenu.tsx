"use client";

import { useEffect, useRef } from "react";
import { StickyNote, ImageIcon, FileText, Import, X } from "lucide-react";
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
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Delay adding the listener so the right-click event itself doesn't close it
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    document.addEventListener("keydown", handleEscape);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Keep menu within viewport bounds
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] w-[180px] rounded border border-white/10 bg-[#212126] shadow-2xl py-1"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Sticky note */}
      <button
        type="button"
        onClick={() => {
          activateCanvasTextTool();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <StickyNote className="w-3.5 h-3.5 stroke-[1.5]" />
        Add Sticky Note
      </button>

      {/* AI Chat */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent(CANVAS_AI_CHAT_TOOL_EVENT),
          );
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 30 30"
          className="w-3.5 h-3.5"
        >
          <path d="M27.02,14.981l-1.824-1.812l0.856-2.424c0.435-1.227,0.209-2.566-0.603-3.583c-0.812-1.018-2.069-1.531-3.358-1.384	l-2.554,0.296l-1.36-2.182C17.488,2.79,16.301,2.13,15,2.13s-2.488,0.659-3.177,1.763l-1.36,2.182L7.909,5.778	C6.622,5.632,5.362,6.146,4.551,7.163c-0.812,1.017-1.037,2.356-0.603,3.583l0.856,2.424L2.98,14.981	C2.058,15.897,1.68,17.202,1.97,18.47c0.289,1.269,1.196,2.279,2.425,2.705l2.43,0.841l0.279,2.557	c0.142,1.293,0.926,2.402,2.097,2.966c1.174,0.565,2.53,0.486,3.628-0.21L15,25.953l2.172,1.375	c0.613,0.387,1.305,0.583,2.001,0.583c0.553,0,1.107-0.124,1.627-0.374c1.171-0.564,1.955-1.673,2.097-2.966l0.279-2.556l2.43-0.841	c1.229-0.425,2.136-1.436,2.425-2.705C28.32,17.202,27.942,15.897,27.02,14.981z" />
        </svg>
        New AI Chat
      </button>

      <div className="h-px bg-white/10 mx-2" />

      {/* Import */}
      <button
        type="button"
        onClick={() => {
          onImportClick();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs mono uppercase tracking-tight text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <Import className="w-3.5 h-3.5 stroke-[1.5]" />
        Import File
      </button>
    </div>
  );
}