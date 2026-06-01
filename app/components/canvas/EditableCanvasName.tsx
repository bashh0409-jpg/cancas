"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type EditableCanvasNameProps = {
  canvasId: string;
  initialName: string;
  onNameChange?: (name: string) => void;
};

export function EditableCanvasName({
  canvasId,
  initialName,
  onNameChange,
}: EditableCanvasNameProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  async function saveName(nextName: string) {
    const trimmedName = nextName.trim() || "Untitled";

    setName(trimmedName);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/canvases/${canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        setName(initialName);
        return;
      }

      const data = (await response.json()) as { slug?: string };

      onNameChange?.(trimmedName);

      if (data.slug) {
        router.replace(`/canvas/${data.slug}`);
        router.refresh();
      }
    } catch {
      setName(initialName);
    } finally {
      setIsSaving(false);
    }
  }

  function commitEdit() {
    setIsEditing(false);
    void saveName(name);
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="pixel max-w-[min(40vw,280px)] rounded-md border border-white/20 bg-white/10 px-2 py-1 text-center text-sm tracking-tight text-white outline-none focus:border-white/40"
        value={name}
        onBlur={commitEdit}
        onChange={(event) => setName(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setName(initialName);
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      className="pixel max-w-[min(40vw,280px)] truncate text-sm tracking-tight text-white transition hover:text-white/80"
      title="Click to rename"
      type="button"
      onClick={() => setIsEditing(true)}
    >
      {isSaving ? "Saving…" : name}
    </button>
  );
}
