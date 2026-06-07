"use client";

import type { CanvasListItem } from "@/types/canvas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CanvasFileListProps = {
  canvases: CanvasListItem[];
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function CanvasFileList({ canvases: initialCanvases }: CanvasFileListProps) {
  const router = useRouter();
  const [canvases, setCanvases] = useState(initialCanvases);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setCanvases(initialCanvases);
  }, [initialCanvases]);

  async function handleDelete(canvasId: string, canvasName: string) {
    const confirmed = window.confirm(
      `Move "${canvasName}" to trash.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(canvasId);

    try {
      const response = await fetch(`/api/canvases/${canvasId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      setCanvases((current) => current.filter((canvas) => canvas.id !== canvasId));
      window.localStorage.removeItem(`canvasai:canvas:${canvasId}:draft`);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (canvases.length === 0) {
    return (
      <div className="flex min-h-[400px] items-start rounded-lg bg-white/10 p-3 text-sm text-white pixel">
        <p>You don&apos;t have any projects yet. Click New File to create one.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {canvases.map((canvas) => (
        <article
          key={canvas.id}
          className="group relative flex flex-col rounded-lg border border-white/10 bg-white/5 transition hover:border-white/25 hover:bg-white/10"
        >
          <button
            aria-label={`Delete ${canvas.name}`}
            className="absolute right-2 top-2 z-10 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 transition hover:bg-red-500/20 hover:text-red-200 group-hover:opacity-100 disabled:opacity-50"
            disabled={deletingId === canvas.id}
            type="button"
            onClick={() => handleDelete(canvas.id, canvas.name)}
          >
            {deletingId === canvas.id ? "Movint to trash…" : "Trash"}
          </button>

          <Link className="flex flex-col p-4" href={`/canvas/${canvas.slug}`}>
            <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-white/10 text-white/30 transition group-hover:bg-white/15">
              <svg
                aria-hidden
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 2h8v2H8V9zm0 3h5v2H8v-2z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <h3 className="truncate text-sm  text-white">
              {canvas.name}
            </h3>
            <p className="mt-1 text-xs text-white/50">
              Edited {formatRelativeDate(canvas.updated_at)}
            </p>
          </Link>
        </article>
      ))}
    </div>
  );
}
