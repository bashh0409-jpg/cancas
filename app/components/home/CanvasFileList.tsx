import type { CanvasListItem } from "@/types/canvas";
import Link from "next/link";

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

export function CanvasFileList({ canvases }: CanvasFileListProps) {
  if (canvases.length === 0) {
    return (
      <div className="p-3 text-white text-sm pixel bg-white/5 rounded-lg min-h-[200px] flex items-start">
        <p>You don&apos;t have any projects yet. Click New File to create one.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {canvases.map((canvas) => (
        <Link
          key={canvas.id}
          className="group flex flex-col rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-white/25 hover:bg-white/10"
          href={`/canvas/${canvas.id}`}
        >
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
          <h3 className="truncate text-sm font-semibold text-white">
            {canvas.name}
          </h3>
          <p className="mt-1 text-xs text-white/50">
            Edited {formatRelativeDate(canvas.updated_at)}
          </p>
        </Link>
      ))}
    </div>
  );
}
