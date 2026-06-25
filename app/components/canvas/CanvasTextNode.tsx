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
  useMemo,
  useRef,
  useState,
} from "react";
import { useAiSettingsStore } from "@/lib/canvas/aiSettingsStore";
import { dispatchUserCreditsUpdated } from "@/lib/credits/events";

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

type WordSegment = {
  text: string;
  isSpace: boolean;
};

const FIXED_WIDTH = 350;
const MIN_HEIGHT = 80;

// ── Helpers ────────────────────────────────────────────────────────────────

function toWordSegments(text: string): WordSegment[] {
  if (!text) return [];
  const segments: WordSegment[] = [];
  let buffer = "";
  let inSpace = false;

  for (const ch of text) {
    const isSpace = /\s/.test(ch);
    if (buffer.length === 0) {
      buffer = ch;
      inSpace = isSpace;
      continue;
    }
    if (isSpace === inSpace) {
      buffer += ch;
    } else {
      segments.push({ text: buffer, isSpace: inSpace });
      buffer = ch;
      inSpace = isSpace;
    }
  }
  if (buffer) segments.push({ text: buffer, isSpace: inSpace });
  return segments;
}

function buildWordTimings(
  text: string,
  duration: number,
): {
  charIndex: number;
  wordIndex: number;
  startTime: number;
  endTime: number;
}[] {
  const segments = toWordSegments(text);
  const totalChars = text.length;
  if (totalChars === 0 || duration <= 0) return [];

  let charOffset = 0;
  let wordIndex = 0;
  const timings: {
    charIndex: number;
    wordIndex: number;
    startTime: number;
    endTime: number;
  }[] = [];

  for (const seg of segments) {
    if (!seg.isSpace) {
      timings.push({
        charIndex: charOffset,
        wordIndex,
        startTime: (charOffset / totalChars) * duration,
        endTime: ((charOffset + seg.text.length) / totalChars) * duration,
      });
      wordIndex += 1;
    }
    charOffset += seg.text.length;
  }
  return timings;
}

// ── Component ──────────────────────────────────────────────────────────────

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const wordTimingsRef = useRef<
    {
      charIndex: number;
      wordIndex: number;
      startTime: number;
      endTime: number;
    }[]
  >([]);

  const segments = useMemo(() => toWordSegments(node.text), [node.text]);

  // ── Focus textarea on edit start ────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing]);

  // ── Auto-resize textarea while editing ─────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [node.text, node.style.fontSize, node.style.fontFamily, isEditing]);

  // ── Height measurement — grows freely, no max cap ──────────────────────
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const contentHeight = Math.ceil(el.getBoundingClientRect().height);
    const nextHeight = Math.max(MIN_HEIGHT, contentHeight);

    if (
      Math.abs(FIXED_WIDTH - node.size.width) > 1 ||
      Math.abs(nextHeight - node.size.height) > 1
    ) {
      onSizeChange({ width: FIXED_WIDTH, height: nextHeight });
    }
    // Intentionally omitting node.size.* to avoid infinite update loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.text, node.style.fontSize, node.style.fontFamily]);

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLTextAreaElement>) => {
      onBlur(e);
    },
    [onBlur],
  );

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onInput(e.currentTarget.value);
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  // ── Playback cleanup ───────────────────────────────────────────────────
  const cleanupPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    wordTimingsRef.current = [];
    queueMicrotask(() => {
      setActiveWordIndex(null);
      setIsSpeaking(false);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isEditing || !isSelected) cleanupPlayback();
  }, [isEditing, isSelected, cleanupPlayback]);

  // ── RAF word-highlight loop (throttled ~60fps) ─────────────────────────
  const lastRafTimeRef = useRef(0);

  const scheduleHighlightTick = useCallback(() => {
    const tick = (now: number) => {
      if (now - lastRafTimeRef.current < 14) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastRafTimeRef.current = now;

      const audio = audioRef.current;
      const timings = wordTimingsRef.current;
      if (!audio || timings.length === 0) {
        setActiveWordIndex(null);
        return;
      }

      const t = audio.currentTime;
      let found = false;
      for (let i = 0; i < timings.length; i++) {
        if (t >= timings[i].startTime && t < timings[i].endTime) {
          setActiveWordIndex(timings[i].wordIndex);
          found = true;
          break;
        }
      }
      if (!found) {
        setActiveWordIndex(
          t >= timings[timings.length - 1].endTime
            ? timings[timings.length - 1].wordIndex
            : -1,
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── TTS ───────────────────────────────────────────────────────────────
  const speakText = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setIsLoading(true);

      try {
        const idempotencyKey = crypto.randomUUID();
        const creditRes = await fetch("/api/credits/consume", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            amount: 3,
            idempotencyKey,
            scope: "tts.speak",
          }),
        });
        if (creditRes.status === 402) {
          cleanupPlayback();
          return;
        }
        if (!creditRes.ok) throw new Error("Credit check failed");

        const creditData = (await creditRes.json()) as { balance?: number };
        if (typeof creditData.balance === "number") {
          dispatchUserCreditsUpdated(creditData.balance);
        }
      } catch {
        cleanupPlayback();
        return;
      }

      try {
        const { ttsProvider, ttsVoice } = useAiSettingsStore.getState();

        const response = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            provider: ttsProvider,
            task: "text-to-speech",
            prompt: text,
            options:
              ttsProvider === "elevenlabs" ? { voice: ttsVoice } : undefined,
          }),
        });
        if (!response.ok) throw new Error("TTS request failed");

        const data = (await response.json()) as { audio?: string };
        if (!data.audio) throw new Error("No audio returned");

        const audio = new Audio(data.audio);
        audioRef.current = audio;

        const setupTimings = () => {
          const dur = audio.duration;
          if (isFinite(dur) && dur > 0) {
            wordTimingsRef.current = buildWordTimings(text, dur);
          }
        };

        if (isFinite(audio.duration) && audio.duration > 0) {
          setupTimings();
        } else {
          audio.addEventListener("loadedmetadata", setupTimings, {
            once: true,
          });
        }

        audio.onended = cleanupPlayback;
        audio.onerror = cleanupPlayback;

        await audio.play();
        setIsSpeaking(true);
        setIsLoading(false);
        scheduleHighlightTick();
      } catch {
        cleanupPlayback();
      }
    },
    [cleanupPlayback, scheduleHighlightTick],
  );

  const handleReadAloud = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (isSpeaking) cleanupPlayback();
      else void speakText(node.text);
    },
    [isSpeaking, node.text, speakText, cleanupPlayback],
  );

  const textStyle = {
    color: node.style.color,
    fontFamily: node.style.fontFamily,
    fontSize: node.style.fontSize,
    lineHeight: 1.5,
  } as const;

  const highlightColor =
    node.style.backgroundColor &&
    !node.style.backgroundColor.match(/^#(ffffff|fff|f8f9fa|f0f0f0)/i)
      ? "rgba(125, 160, 255, 0.49)"
      : "rgba(34,68,236,0.15)";

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
        width: FIXED_WIDTH,
        minWidth: FIXED_WIDTH,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
    >
      {/* Content container — no overflow clipping, grows with content */}
      <div
        ref={scrollContainerRef}
        className={[
          "w-full h-full rounded border px-3 py-2 transition",
          isSelected
            ? "border-[#2244ec]"
            : "border-transparent group-hover:border-[#2244ec]/70",
        ].join(" ")}
        style={{ backgroundColor: node.style.backgroundColor }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="w-full resize-none bg-transparent outline-none tracking-tight overflow-hidden"
            value={node.text}
            spellCheck
            onBlur={handleBlur}
            onChange={handleTextChange}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              ...textStyle,
              minHeight: MIN_HEIGHT - 16,
            }}
          />
        ) : (
          <div
            className="w-full whitespace-pre-wrap break-words tracking-tight"
            style={textStyle}
          >
            {node.text.length > 0 ? (
              (() => {
                let wordIdx = 0;
                return segments.map((seg, i) => {
                  if (seg.isSpace) return <span key={i}>{seg.text}</span>;
                  const idx = wordIdx++;
                  return (
                    <span
                      key={i}
                      className={
                        idx === activeWordIndex
                          ? "transition-colors duration-75"
                          : ""
                      }
                      style={
                        idx === activeWordIndex
                          ? {
                              backgroundColor: highlightColor,
                              boxShadow: `0 0 0 1px ${highlightColor}`,
                            }
                          : undefined
                      }
                    >
                      {seg.text}
                    </span>
                  );
                });
              })()
            ) : (
              <span className="opacity-40">Type here...</span>
            )}
          </div>
        )}
      </div>

      {/* Read Aloud button */}
      <div
        className={[
          "absolute -top-8 right-0 flex items-center gap-1 transition-opacity",
          isSelected && !isEditing
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
          isEditing ? "pointer-events-none" : "",
        ].join(" ")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={[
            "flex items-center cursor-pointer gap-1 rounded px-2 py-1 text-xs shadow-sm",
            isSpeaking
              ? "bg-red-500 text-white"
              : isLoading
                ? "bg-gray-300 text-gray-500 cursor-wait"
                : "bg-white text-gray-700 hover:bg-gray-100",
          ].join(" ")}
          onPointerDown={handleReadAloud}
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

      {/* Invisible measurement div — matches view mode font metrics exactly */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 -z-10 px-3 py-2 whitespace-pre-wrap break-words tracking-tight"
        style={{
          width: FIXED_WIDTH,
          ...textStyle,
          visibility: "hidden",
        }}
      >
        {node.text || "Text"}
      </div>
    </div>
  );
}
