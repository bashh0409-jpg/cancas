"use client";

import { X, Keyboard } from "lucide-react";

type ShortcutsPanelProps = {
  onClose: () => void;
};

const shortcutGroups = [
  {
    title: "Canvas Controls",
    shortcuts: [
      { keys: "Space + Drag", label: "Pan canvas" },
      { keys: "Scroll", label: "Zoom in / out" },
      { keys: "Z", label: "Reset zoom to 100%" },
      { keys: "F", label: "Fit all content to screen" },
    ],
  },
  {
    title: "Panels",
    shortcuts: [
      { keys: "S", label: "Open Search panel" },
      { keys: "G", label: "Open Canvas Settings" },
      { keys: "L", label: "Open Layers panel" },
      { keys: "Esc", label: "Close panel / deselect" },
    ],
  },
  {
    title: "Selection & Editing",
    shortcuts: [
      { keys: "Click", label: "Select a node" },
      { keys: "Shift + Click", label: "Multi-select" },
      { keys: "Drag", label: "Marquee select" },
      { keys: "Backspace / Delete", label: "Remove selected node" },
      { keys: "Cmd/Ctrl + D", label: "Duplicate selected" },
      { keys: "Cmd/Ctrl + A", label: "Select all" },
      { keys: "Cmd/Ctrl + Z", label: "Undo delete" },
      { keys: "Cmd/Ctrl + Shift + Z", label: "Redo delete" },
    ],
  },
  {
    title: "Nodes",
    shortcuts: [
      { keys: "Double-click", label: "Edit sticky note" },
      { keys: "Drag corner", label: "Resize node" },
    ],
  },
];

export default function ShortcutsPanel({ onClose }: ShortcutsPanelProps) {
  return (
    <div className="w-60 h-screen bg-[#212126] p-4 flex flex-col gap-4 scrollbar-hidden overflow-y-auto">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-white text-xs mono uppercase tracking-tight flex items-center gap-2">
          <Keyboard className="w-3.5 h-3.5" strokeWidth={1.25} />
          Shortcuts
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 cursor-pointer hover:text-white transition"
        >
          <X className="w-4 cursor-pointer h-4" strokeWidth={1.25} />
        </button>
      </div>

      <div className="space-y-5">
        {shortcutGroups.map((group) => (
          <div key={group.title}>
            <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
              {group.title}
            </h4>
            <div className="space-y-1.5">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] mono text-white/50">
                    {shortcut.label}
                  </span>
                  <kbd className="shrink-0 rounded-xs border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] mono uppercase tracking-wide text-white/70">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}