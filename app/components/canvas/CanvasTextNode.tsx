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

/** Split text into word and whitespace segments preserving original layout. */
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

/** Character-length‑based word timing: assume each char takes equal time. */
function buildWordTimings(
  text: string,
  duration: number,
): { charIndex: number; wordIndex: number; startTime: number; endTime: number }[] {
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
      const startTime =
        (charOffset / totalChars) * duration;
      const endTime =
        ((charOffset + seg.text.length) / totalChars) * duration;
      timings.push({
        charIndex: charOffset,
        wordIndex,
        startTime,
        endTime,
      });
      wordIndex += 1;
    }
    charOffset += seg.text.length;
  }

  return timings;
}

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
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const wordTimingsRef = useRef<
    { charIndex: number; wordIndex: number; startTime: number; endTime: number }[]
  >([]);

  const segments = useMemo(() => toWordSegments(node.text), [node.text]);

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

    const MAX_WIDTH = 420;
    const MIN_SIZE = 120;

    const nextWidth = Math.min(
      MAX_WIDTH,
      Math.max(MIN_SIZE, Math.ceil(rect.width)),
    );

    const nextHeight = Math.max(
      nextWidth,
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

  // ── Word-highlight animation loop ──────────────────────────────────
  const tickRef = useRef<() => void>(() => {});

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
    if (isEditing || !isSelected) {
      cleanupPlayback();
    }
  }, [isEditing, isSelected, cleanupPlayback]);

  // Tick uses a ref internally so it can schedule itself without a
  // temporal-dead-zone issue. This also avoids referencing tick before init.
  useEffect(() => {
    const fn = () => {
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

      rafRef.current = requestAnimationFrame(tickRef.current);
    };

    tickRef.current = fn;
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsLoading(true);

      // Consume 3 credits first
      try {
        const creditRes = await fetch("/api/credits/consume", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ amount: 3 }),
        });

        if (creditRes.status === 402) {
          cleanupPlayback();
          return;
        }

        if (!creditRes.ok) throw new Error("Credit check failed");
      } catch {
        cleanupPlayback();
        return;
      }

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

        // Build word timings once we know the total duration.
        const setupTimings = () => {
          const dur = audio.duration;
          if (isFinite(dur) && dur > 0) {
            wordTimingsRef.current = buildWordTimings(text, dur);
          }
        };

        // duration may not be available immediately
        if (isFinite(audio.duration) && audio.duration > 0) {
          setupTimings();
        } else {
          audio.addEventListener("loadedmetadata", setupTimings, { once: true });
        }

        audio.onended = cleanupPlayback;
        audio.onerror = cleanupPlayback;

        await audio.play();
        setIsSpeaking(true);
        setIsLoading(false);

        // Start the word-highlight loop
        rafRef.current = requestAnimationFrame(tickRef.current);
      } catch {
        cleanupPlayback();
      }
    },
    [cleanupPlayback],
  );

  const stopSpeaking = useCallback(() => {
    cleanupPlayback();
  }, [cleanupPlayback]);

  const handleReadAloud = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (isSpeaking) stopSpeaking();
      else void speakText(node.text);
    },
    [isSpeaking, node.text, speakText, stopSpeaking],
  );

  // ── Render active word background ──────────────────────────────────
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
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
    >
      <div
        className={[
          "min-h-20 max-h-150 overflow-y-auto w-full rounded border px-3 py-2 transition overflow-hidden",
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
        onPointerDown={(e) => e.stopPropagation()}
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
          <div className="w-full text-sm whitespace-pre-wrap break-words tracking-tight leading-relaxed overflow-hidden">
            {node.text.length > 0
              ? (() => {
                  let wordIdx = 0;
                  return segments.map((seg, i) => {
                    if (seg.isSpace) {
                      return <span key={i}>{seg.text}</span>;
                    }
                    const idx = wordIdx;
                    wordIdx += 1;
                    return (
                      <span
                        key={i}
                        className={
                          idx === activeWordIndex
                            ? " transition-colors duration-75"
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
              : "Type here..."}
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
            "flex items-center cursor-pointer gap-1 rounded px-2 py-1 text-xs shadow-sm",
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