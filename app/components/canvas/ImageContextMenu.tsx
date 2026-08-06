"use client";

import { useEffect, useRef } from "react";
import { Download, Copy, Trash2, Wand2, Scan, Expand, RotateCwSquare, SquareCenterlineDashedHorizontal, SquareCenterlineDashedVertical } from "lucide-react";

export type ImageMenuAction =
  | "download"
  | "duplicate"
  | "delete"
  | "remove-background"
  | "edit-with-ai"
  | "upscale"
  | "flip-horizontal"
  | "flip-vertical"
  | "rotate";

type ImageContextMenuProps = {
  x: number;
  y: number;
  onAction: (action: ImageMenuAction) => void;
  onClose: () => void;
};

export function ImageContextMenu({
  x,
  y,
  onAction,
  onClose,
}: ImageContextMenuProps) {
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

  // Keep menu within viewport bounds
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 260);

  const items: {
    action: ImageMenuAction;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      action: "remove-background",
      label: "Remove Background",
      icon: <Scan className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      action: "edit-with-ai",
      label: "Edit with AI",
      icon: <Wand2 className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      action: "upscale",
      label: "Upscale",
      icon: <Expand className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      action: "flip-horizontal",
      label: "Flip Horizontal",
      icon: (
        <SquareCenterlineDashedHorizontal
          className="h-4 w-4"
          strokeWidth={1.5}
        />
      ),
    },
    {
      action: "flip-vertical",
      label: "Flip Vertical",
      icon: (
        <SquareCenterlineDashedVertical className="h-4 w-4" strokeWidth={1.5} />
      ),
    },
    {
      action: "rotate",
      label: "Rotate",
      icon: <RotateCwSquare className="h-4 w-4" strokeWidth={1.5} />,
    },
  ];

  const basicItems: { action: ImageMenuAction; label: string; icon: React.ReactNode }[] = [
    { action: "download", label: "Download", icon: <Download className="h-4 w-4" strokeWidth={1.5} /> },
    { action: "duplicate", label: "Duplicate", icon: <Copy className="h-4 w-4" strokeWidth={1.5} /> },
    { action: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} /> },
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
      <div className="my-1 border-t border-white/10" />
      {basicItems.map((item) => (
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