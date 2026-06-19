"use client";

import { Volume2, VolumeX } from "lucide-react";
import type {
  ChangeEvent,
  FocusEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type CanvasTextNodeData = {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
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

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;

    const el = textareaRef.current;
    if (!el) return;

    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    const MAX_WIDTH = 420; // increased cap (bigger node)
    const MIN_SIZE = 120;

    const nextWidth = Math.min(
      MAX_WIDTH,
      Math.max(MIN_SIZE, Math.ceil(rect.width)),
    );

    const nextHeight = Math.max(
      nextWidth, // square constraint
      Math.ceil(rect.height),
      node.style.fontSize * 1.8 + 20,
    );

    if (
      Math.abs(nextWidth - node.size.width) > 1 ||
      Math.abs(nextHeight - node.size.height) > 1
    ) {
      onSizeChange({ width: nextWidth, height: nextHeight });
    }
  }, [node.text, node.style.fontSize, node.style.fontFamily]);

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onInput(e.currentTarget.value);
  }

  useEffect(() => {
    if (isEditing || !isSelected) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audioRef.current = null;
      }
      queueMicrotask(() => {
        setIsSpeaking(false);
        setIsLoading(false);
      });
    }
  }, [isEditing, isSelected]);

  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "elevenlabs",
          task: "text-to-speech",
          prompt: text,
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const data = (await response.json()) as { audio?: string };

      if (!data.audio) throw new Error("No audio returned");

      const audio = new Audio(data.audio);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        audioRef.current = null;
      };

      await audio.play();
      setIsSpeaking(true);
      setIsLoading(false);
    } catch {
      setIsSpeaking(false);
      setIsLoading(false);
      audioRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const handleReadAloud = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (isSpeaking) stopSpeaking();
      else void speakText(node.text);
    },
    [isSpeaking, node.text, speakText, stopSpeaking],
  );

  return (
    <div
      className="group absolute"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEditing();
      }}
      onPointerDown={(e) => {
        if (isEditing) return;
        onPointerDown(e);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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
          "min-h-20 w-full rounded border px-3 py-2 transition overflow-hidden",
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
            className="w-full resize-none bg-transparent outline-none text-sm tracking-tight overflow-hidden"
            value={node.text}
            spellCheck
            onBlur={onBlur}
            onChange={handleTextChange}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              color: node.style.color,
              fontFamily: node.style.fontFamily,
              fontSize: node.style.fontSize,
            }}
          />
        ) : (
          <div className="w-full text-sm whitespace-pre-wrap break-words tracking-tight overflow-hidden">
            {node.text.length > 0 ? node.text : "Type here..."}
          </div>
        )}
      </div>

      {/* Read Aloud */}
      <div
        className={[
          "absolute -top-8 right-0 flex items-center gap-1 transition-opacity",
          isSelected && !isEditing
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
          isEditing && "pointer-events-none",
        ].join(" ")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={[
            "flex items-center gap-1 rounded px-2 py-1 text-xs shadow-sm",
            isSpeaking
              ? "bg-red-500 text-white"
              : isLoading
                ? "bg-gray-300 text-gray-500 cursor-wait"
                : "bg-white text-gray-700 hover:bg-gray-100",
          ].join(" ")}
          onClick={handleReadAloud}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="h-3 w-3 animate-pulse rounded-full bg-gray-400" />
          ) : isSpeaking ? (
            <>
              <VolumeX className="h-3 w-3" />
              Stop
            </>
          ) : (
            <>
              <Volume2 className="h-3 w-3" />
              Read
            </>
          )}
        </button>
      </div>

      {/* measurement */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 -z-10 px-3 py-2 whitespace-pre-wrap break-words"
        style={{
          width: 420,
          fontFamily: node.style.fontFamily,
          fontSize: node.style.fontSize,
          lineHeight: 1.4,
          visibility: "hidden",
        }}
      >
        {node.text || "Text"}
      </div>
    </div>
  );
}
