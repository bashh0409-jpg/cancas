"use client";

import { Send, X, Bot, RotateCcw } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type CanvasAiChatNodeData = {
  id: string;
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
  onSizeChange: (size: { width: number; height: number }) => void;
};

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_WIDTH = 380;
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 600;
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
  onSizeChange,
}: CanvasAiChatNodeProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = node.messages;

  // ── Scroll to bottom when messages update ──────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop = scrollTop === 0 && e.deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
      if (!atTop && !atBottom) e.stopPropagation();
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
          "flex flex-col w-full h-full rounded border shadow-sm overflow-hidden transition",
          isSelected
            ? "border-[#2244ec]"
            : "border-transparent group-hover:border-[#2244ec]/70",
        ].join(" ")}
        style={{ backgroundColor: node.style.backgroundColor }}
      >
        {/* ── Header (drag handle) ── */}
        <div
          className="flex items-center justify-between px-3 shrink-0 border-b border-black/5"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs mono uppercase font-medium tracking-tight"
              style={{ color: node.style.color, opacity: 0.7 }}
            >
              Untitled
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
                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
          className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2"
          style={{ maxHeight: MESSAGES_HEIGHT }}
          onPointerDown={(e) => {
            const el = scrollContainerRef.current;
            if (el && el.scrollHeight > el.clientHeight) e.stopPropagation();
          }}
        >
          {isEmpty ? (
            <div className="flex-1 flex mono flex-col items-center justify-center gap-2 py-8 select-none">
              <p
                className="text-xs mono mono tracking-tight text-center"
                style={{ color: node.style.color, opacity: 0.4, ...textStyle }}
              >
                Ask me anything
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={[
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[85%] rounded px-2 py-2 text-xs  tracking-tight whitespace-pre-wrap break-words",
                    msg.role === "user"
                      ? "bg-[#2244ec] text-white rounded-br-sm"
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
          className="shrink-0   px-2 py-1 flex items-end gap-2"
          style={{ minHeight: INPUT_HEIGHT }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <textarea
            ref={inputRef}
            className="flex-1 resize-none bg-black/5 rounded px-3 py-2 text-xs outline-none tracking-tight leading-relaxed placeholder:opacity-40 transition-colors focus:bg-black/8"
            placeholder="Ask a question… (Enter to send)"
            value={input}
            rows={1}
            disabled={isStreaming}
            style={{ ...textStyle, color: node.style.color, maxHeight: 96 }}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            disabled={!input.trim() || isStreaming}
            className={[
              "shrink-0 flex items-center justify-center w-8 h-8 rounded hidden mono transition-colors mb-0.5",
              input.trim() && !isStreaming
                ? "bg-[#2244ec] mono text-white hover:bg-[#1a35c4]"
                : "bg-black/5 text-gray-300 cursor-not-allowed",
            ].join(" ")}
            onPointerDown={(e) => {
              e.stopPropagation();
              void sendMessage();
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
