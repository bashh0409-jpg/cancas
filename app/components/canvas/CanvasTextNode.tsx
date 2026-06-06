"use client";

import type {
  ChangeEvent,
  FocusEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useLayoutEffect, useRef } from "react";

export type CanvasTextNodeData = {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  style: {
    backgroundColor: string;
    color: string;
    fontFamily: string;
    fontSize: number;
  };
};

type CanvasTextNodeProps = {
  node: CanvasTextNodeData;
  isDragging: boolean;
  isEditing: boolean;
  isSelected: boolean;
  onBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
  onInput: (text: string) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onStartEditing: () => void;
};

export function CanvasTextNode({
  node,
  isDragging,
  isEditing,
  isSelected,
  onBlur,
  onInput,
  onSizeChange,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onStartEditing,
}: CanvasTextNodeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [isEditing]);

  useLayoutEffect(() => {
    const measurement = measureRef.current;
    if (!measurement) {
      return;
    }

    const rect = measurement.getBoundingClientRect();
    const nextSize = {
      width: Math.max(60, Math.ceil(rect.width)),
      height: Math.max(node.style.fontSize * 1.35 + 16, Math.ceil(rect.height)),
    };

    if (
      Math.abs(nextSize.width - node.size.width) > 1 ||
      Math.abs(nextSize.height - node.size.height) > 1
    ) {
      onSizeChange(nextSize);
    }
  }, [
    node.text,
    node.style.backgroundColor,
    node.style.color,
    node.style.fontFamily,
    node.style.fontSize,
    onSizeChange,
  ]);

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onInput(event.currentTarget.value);
  }

  return (
    <div
      className="group absolute"
      onDoubleClick={(event) => {
        event.stopPropagation();
        onStartEditing();
      }}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        cursor: isEditing ? "text" : isDragging ? "grabbing" : "grab",
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
    >
      <div
        className={[
          "h-full w-full rounded-md border px-3 py-2 leading-tight transition",
          isSelected
            ? "border-[#2244ec]"
            : "border-transparent group-hover:border-[#2244ec]/70",
        ].join(" ")}
        style={{
          backgroundColor: node.style.backgroundColor,
          color: node.style.color,
          fontFamily: node.style.fontFamily,
          fontSize: node.style.fontSize,
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="h-full w-full resize-none overflow-hidden bg-transparent outline-none"
            spellCheck
            style={{
              backgroundColor: "transparent",
              color: node.style.color,
              fontFamily: node.style.fontFamily,
              fontSize: node.style.fontSize,
            }}
            value={node.text}
            onBlur={onBlur}
            onChange={handleTextChange}
            onPointerDown={(event) => event.stopPropagation()}
          />
        ) : (
          <div className="h-full w-full whitespace-pre-wrap break-words">
            {node.text || "Text"}
          </div>
        )}
      </div>

      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 -z-10 whitespace-pre-wrap break-words px-3 py-2 opacity-0"
        style={{
          minWidth: 60,
          backgroundColor: node.style.backgroundColor,
          color: node.style.color,
          fontFamily: node.style.fontFamily,
          fontSize: node.style.fontSize,
        }}
      >
        {node.text || "Text"}
      </div>
    </div>
  );
}
