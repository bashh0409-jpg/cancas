"use client";

import { Send, X, RotateCcw, ChevronsLeftRightEllipsis } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import CanvasPlaceholderIcon from "../CanvasPlaceholderIcon";
// ── Types ──────────────────────────────────────────────────────────────────

export type CanvasAiChatNodeData = {
  id: string;
  sourceNodeId?: string;
  name: string;
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
  // Persisted conversation so it survives re-renders / node re-selection
  messages: ChatMessage[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  // assistant messages track whether they're still streaming
  streaming?: boolean;
};

type CanvasAiChatNodeProps = {
  node: CanvasAiChatNodeData;
  isDragging: boolean;
  isSelected: boolean;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
  onNameChange: (name: string) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
};

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_WIDTH = 340;
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 800;
const HEADER_HEIGHT = 30;
const INPUT_HEIGHT = 30;
const MESSAGES_HEIGHT = MAX_HEIGHT - HEADER_HEIGHT - INPUT_HEIGHT;

// ── Helpers ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Component ──────────────────────────────────────────────────────────────

export function CanvasAiChatNode({
  node,
  isDragging,
  isSelected,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onMessagesChange,
  onNameChange,
  onSizeChange,
}: CanvasAiChatNodeProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [title, setTitle] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = node.messages;

  const [inputHeight, setInputHeight] = useState(28);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    textarea.style.height = "auto";

    const height = Math.min(textarea.scrollHeight, 120);

    textarea.style.height = `${height}px`;
    setInputHeight(height);
    setInput(textarea.value);
  };

  const inputRadius = Math.max(
    10,
    Math.min(24, 24 - (inputHeight - 28) * 0.5),
  );
  
  // ── Auto-detect conversation title ────────────────────────────────────
  useEffect(() => {
    // Only generate title if node doesn't have a name yet
    if (node.name && node.name !== "AI Chat") {
      setTitle(node.name);
      return;
    }

    if (messages.length === 0) {
      setTitle("");
      return;
    }

    // Find first user message to generate title from
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (!firstUserMsg) {
      setTitle("");
      return;
    }

    // Generate a concise title from the first message using server-side API
    const generateTitle = async () => {
      try {
        const response = await fetch("/api/ai/generate-title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: firstUserMsg.content }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.title) {
            setTitle(data.title);
            onNameChange(data.title);
            return;
          }
        }
      } catch (err) {
        console.error("Title generation failed:", err);
      }

      // Fallback: extract first sentence or first few words
      const text = firstUserMsg.content.trim();
      const sentenceMatch = text.match(/^[^.!?]*[.!?]/);
      let fallbackTitle = sentenceMatch
        ? sentenceMatch[0].replace(/[.!?]$/, "").trim()
        : text;

      // If first sentence is too long, take first few words instead
      if (fallbackTitle.length > 60) {
        fallbackTitle = text.split(/\s+/).slice(0, 5).join(" ");
      }

      // Truncate to 60 characters max
      fallbackTitle = fallbackTitle.substring(0, 60).trim();
      setTitle(fallbackTitle);
      onNameChange(fallbackTitle);
    };

    void generateTitle();
  }, [node.name, messages, onNameChange]);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Set node height once on mount ─────────────────────────────────────
  useEffect(() => {
    if (
      Math.abs(node.size.width - FIXED_WIDTH) > 1 ||
      Math.abs(node.size.height - MIN_HEIGHT) > 1
    ) {
      onSizeChange({ width: FIXED_WIDTH, height: MIN_HEIGHT });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Block wheel from reaching canvas ──────────────────────────────────
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Auto-resize textarea ───────────────────────────────────────────────
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [input]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const assistantMsg: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "",
      streaming: true,
    };

    const nextMessages = [...messages, userMsg, assistantMsg];
    onMessagesChange(nextMessages);
    setInput("");
    setIsStreaming(true);

    // Build the full conversation history for the API
    const apiMessages = nextMessages
      .filter((m) => !m.streaming)
      .concat({ ...assistantMsg, content: "" })
      .filter(
        (m) =>
          m.role === "user" || (m.role === "assistant" && m !== assistantMsg),
      )
      .map((m) => ({ role: m.role, content: m.content }));

    // Correctly build history: all previous turns + new user message
    const historyForApi = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          stream: true,
          system:
            "You are a helpful assistant embedded in a canvas workspace. Be concise and clear. Use markdown sparingly — prefer plain text for short answers.",
          messages: historyForApi,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta"
            ) {
              accumulated += parsed.delta.text;

              // Update the streaming assistant message in place
              onMessagesChange(
                nextMessages.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: accumulated, streaming: true }
                    : m,
                ),
              );
            }
          } catch {
            // Malformed JSON line — skip
          }
        }
      }

      // Mark streaming done
      onMessagesChange(
        nextMessages.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: accumulated, streaming: false }
            : m,
        ),
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — mark the partial response as done
        onMessagesChange(
          nextMessages.map((m) =>
            m.id === assistantMsg.id ? { ...m, streaming: false } : m,
          ),
        );
      } else {
        onMessagesChange(
          nextMessages.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: "Something went wrong. Please try again.",
                  streaming: false,
                }
              : m,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [input, isStreaming, messages, onMessagesChange]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    if (isStreaming) stopStreaming();
    onMessagesChange([]);
  }, [isStreaming, stopStreaming, onMessagesChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────
  const textStyle = {
    fontFamily: node.style.fontFamily,
    fontSize: node.style.fontSize,
  } as const;

  const isEmpty = messages.length === 0;

  return (
    <div
      className="group absolute flex flex-col"
      onPointerDown={(e) => onPointerDown(e)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheelCapture={(event) => event.stopPropagation()}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        left: node.position.x,
        top: node.position.y,
        width: FIXED_WIDTH,
        minWidth: FIXED_WIDTH,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
    >
      <div
        className={[
          "flex flex w-full h-full p-2 rounded-lg border  overflow-hidden transition",
          isSelected
            ? "border-[#2244ec]"
            : "border-transparent group-hover:border-[#2244ec]/70",
        ].join(" ")}
        style={{ backgroundColor: node.style.backgroundColor }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          {/* ── Header (drag handle) ── */}

          <div
            className="flex absolute left-0 top-0 w-full px-2 items-center justify-between bg-transparent shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="flex items-center gap-2">
              {" "}
              <button className="rounded h-4 object-contain select-none flex items-center bg-white">
                <CanvasPlaceholderIcon size={14} />
              </button>
              <span
                className="text-xs mono font-medium  uppercase tracking-tight truncate select-none"
                style={{ color: node.style.color, opacity: 0.7 }}
              >
                {title || "Untitled"}
              </span>
              {isStreaming && (
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-[#2244ec] animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-[#2244ec] animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-[#2244ec] animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isStreaming && (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    stopStreaming();
                  }}
                >
                  <X className="w-3 h-3" />
                  Stop
                </button>
              )}
              {!isEmpty && !isStreaming && (
                <button
                  type="button"
                  className="flex tracking-tight items-center lime gap-1 rounded px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    clearMessages();
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
          {/* ── Messages ── */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto  scrollbar-hidden mb-6 py-2 flex flex-col gap-2"
            style={{ maxHeight: MESSAGES_HEIGHT }}
            onPointerDown={(e) => {
              const el = scrollContainerRef.current;
              if (el && el.scrollHeight > el.clientHeight) e.stopPropagation();
            }}
          >
            {isEmpty ? (
              <div className="flex-1 flex mono flex-col items-center justify-center gap-2 py-8 select-none">
                <p
                  className="text-xs hidden mono mono tracking-tight text-center"
                  style={{ color: node.style.color, opacity: 0.4 }}
                >
                  Ask me anything
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={[
                    "flex ",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "max-w-[85%] rounded px-2  py-2 text-xs  tracking-tight whitespace-pre-wrap break-words",
                      msg.role === "user"
                        ? "bg-[#2244ec] text-black rounded "
                        : " rounded",
                    ].join(" ")}
                    style={{
                      ...textStyle,
                      color: msg.role === "user" ? "#fff" : node.style.color,
                    }}
                  >
                    {msg.content}
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-3 ml-0.5 bg-current opacity-70 animate-pulse rounded-sm align-middle" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ── */}
          <div
            className="absolute bottom-0 left-0 mb-1 flex w-full shrink-0 items-end gap-1 px-2 py-1"
            style={{ minHeight: INPUT_HEIGHT }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <textarea
              ref={inputRef}
              rows={1}
              disabled={isStreaming}
              value={input}
              placeholder="What are you thinking?"
              className="min-h-7 flex-1 resize-none overflow-y-auto bg-black/5 px-3 py-1.5 text-xs leading-tight tracking-tight outline-none shadow-[0_2px_18px_rgba(0,0,0,0.28)] placeholder:opacity-70"
              style={{
                ...textStyle,
                color: node.style.color,
                height: `${inputHeight}px`,
                maxHeight: 120,
                borderRadius: `${inputRadius}px`,
              }}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
            />

            <button
              type="button"
              disabled={!input.trim() || isStreaming}
              className={[
                "flex h-7 shrink-0 items-center justify-center rounded-full px-2 text-xs uppercase tracking-tight transition-all duration-200",
                input.trim() && !isStreaming
                  ? "lime text-black shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.28)] hover:bg-[#1a35c4]"
                  : "cursor-not-allowed  bg-black/5 text-gray-300 shadow-none",
              ].join(" ")}
              onPointerDown={(e) => {
                e.stopPropagation();
                void sendMessage();
              }}
            >
              send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
