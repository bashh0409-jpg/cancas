"use client";

import type { CanvasListItem } from "@/types/canvas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CanvasPlaceholderIcon from "../CanvasPlaceholderIcon";
import { Trash2, Loader2 } from "lucide-react";

type CanvasFileListProps = {
  canvases: CanvasListItem[];
  isTrash?: boolean;
  createCanvasAction?: (idempotencyKey: string) => Promise<void>;
};

function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-2 left-z-30 w-max max-w-[180px] -translate-x-1/2 -translate-y-full whitespace-normal rounded-xs  bg-neutral-900 px-2 py-1 text-center text-[9px] mono uppercase leading-tight tracking-tight text-white opacity-0 shadow-lg shadow-black/50 transition-all duration-150 ease-out group-hover/tooltip:-translate-y-[calc(100%+6px)] group-hover/tooltip:opacity-100"
      >
        {label}
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
      </span>
    </span>
  );
}

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

export function CanvasFileList({
  canvases: initialCanvases,
  isTrash = false,
  createCanvasAction,
}: CanvasFileListProps) {
  const router = useRouter();
  const [canvases, setCanvases] = useState(initialCanvases);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const pendingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setCanvases(initialCanvases);
  }, [initialCanvases]);

  const handleCreateCanvas = async () => {
    if (!createCanvasAction || pendingKeyRef.current) return;
    pendingKeyRef.current = crypto.randomUUID();
    try {
      setCreating(true);
      await createCanvasAction(pendingKeyRef.current);
    } finally {
      pendingKeyRef.current = null;
      setCreating(false);
    }
  };

  async function handleDelete(canvasId: string, canvasName: string) {
    // If in trash view, this is permanent delete
    if (isTrash) {
      const confirmed = window.confirm(
        `Permanently delete "${canvasName}"? This cannot be undone.`,
      );
      if (!confirmed) return;

      setDeletingId(canvasId);
      try {
        const res = await fetch(`/api/canvases/${canvasId}/permanent`, {
          method: "DELETE",
        });
        if (!res.ok) return;
        setCanvases((current) => current.filter((c) => c.id !== canvasId));
        window.localStorage.removeItem(`canvasai:canvas:${canvasId}:draft`);
        router.refresh();
      } finally {
        setDeletingId(null);
      }

      return;
    }

    const confirmed = window.confirm(`Move "${canvasName}" to trash.`);

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

      setCanvases((current) =>
        current.filter((canvas) => canvas.id !== canvasId),
      );
      window.localStorage.removeItem(`canvasai:canvas:${canvasId}:draft`);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (canvases.length === 0) {
    if (isTrash) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <div className="mb-3 flex aspect-square items-center justify-center rounded text-white/30 transition">
            <CanvasPlaceholderIcon />
          </div>
          <p className="text-white/50 uppercase text-xs mono text-center max-w-sm">
            Trash is empty. Files in the trash will be permanently deleted after
            30 days.
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded bg-white/10 tracking-tight p-6 text-sm text-white mono">
        <div className="mb-3 flex aspect-square items-center justify-center rounded text-white/30 transition">
          <CanvasPlaceholderIcon />
        </div>
        <p className="text-white/50 uppercase text-xs mono text-center max-w-sm">
          You don&apos;t have any projects yet. Click{" "}
          <Tooltip label="Create a new canvas file">
            <span
              className="underline hover:text-white cursor-pointer"
              onClick={handleCreateCanvas}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleCreateCanvas();
              }}
            >
              {creating ? "Creating..." : "Create New File"}
            </span>
          </Tooltip>{" "}
          to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="grid  gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {canvases.map((canvas) => (
        <article
          key={canvas.id}
          className="group relative flex flex-col rounded transition"
        >
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
            {!isTrash ? (
              <Tooltip label={`Move "${canvas.name}" to trash`}>
                <button
                  aria-label={`Delete ${canvas.name}`}
                  className="flex cursor-pointer items-center justify-center rounded-xs bg-white p-1 text-black opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50"
                  disabled={deletingId === canvas.id}
                  type="button"
                  onClick={() => handleDelete(canvas.id, canvas.name)}
                >
                  {deletingId === canvas.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </Tooltip>
            ) : (
              <>
                <Tooltip label={`Restore "${canvas.name}" from trash`}>
                  <button
                    aria-label={`Recover ${canvas.name}`}
                    className="flex cursor-pointer items-center justify-center rounded-xs bg-white p-1 text-black opacity-0 transition group-hover:opacity-100 hover:bg-green-500/20 hover:text-green-200 disabled:opacity-50"
                    disabled={recoveringId === canvas.id}
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Recover \"${canvas.name}\"?`,
                      );
                      if (!confirmed) return;
                      setRecoveringId(canvas.id);
                      try {
                        const res = await fetch(
                          `/api/canvases/${canvas.id}/recover`,
                          { method: "POST" },
                        );
                        if (!res.ok) return;
                        setCanvases((current) =>
                          current.filter((c) => c.id !== canvas.id),
                        );
                        router.refresh();
                      } finally {
                        setRecoveringId(null);
                      }
                    }}
                  >
                    {recoveringId === canvas.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M21 10v6a2 2 0 0 1-2 2H7"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 13V7a2 2 0 0 1 2-2h12"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </Tooltip>

                <Tooltip
                  label={`Permanently delete "${canvas.name}" (cannot be undone)`}
                >
                  <button
                    aria-label={`Permanently delete ${canvas.name}`}
                    className="flex cursor-pointer items-center justify-center rounded-xs bg-white p-1 text-black opacity-0 transition group-hover:opacity-100 hover:bg-red-600/20 hover:text-white disabled:opacity-50"
                    disabled={deletingId === canvas.id}
                    type="button"
                    onClick={() => handleDelete(canvas.id, canvas.name)}
                  >
                    {deletingId === canvas.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </Tooltip>
              </>
            )}
          </div>

          <Link className="flex flex-col" href={`/canvas/${canvas.slug}`}>
            <div className="mb-3 flex aspect-square items-center justify-center rounded bg-white/10 text-white/30 transition">
              <CanvasPlaceholderIcon />
            </div>
            <h3 className="truncate text-xs mono tracking-tight uppercase text-white">
              {canvas.name}
            </h3>
            <p className="mt-1 mono uppercase tracking-tight  text-[10px] text-white/50">
              Last Edited {formatRelativeDate(canvas.updated_at)}
            </p>
            {isTrash &&
              canvas.deleted_at &&
              (() => {
                const deletedAt = new Date(canvas.deleted_at).getTime();
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysSince = Math.floor(
                  (Date.now() - deletedAt) / msPerDay,
                );
                const daysLeft = Math.max(0, 30 - daysSince);

                const colorClass =
                  daysLeft > 20
                    ? "text-emerald-400"
                    : daysLeft >= 10
                      ? "text-amber-300"
                      : "text-red-500";

                return (
                  <p
                    className={`mono tracking-tight uppercase text-[9px] ${colorClass}`}
                  >
                    {`${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                  </p>
                );
              })()}
          </Link>
        </article>
      ))}
    </div>
  );
}
