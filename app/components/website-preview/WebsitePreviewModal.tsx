"use client";

import { WebsitePreviewFrame } from "./WebsitePreviewFrame";
import { parseWebsiteUrl } from "./utils";

type WebsitePreviewModalProps = {
  url: string;
  title: string;
  onClose: () => void;
};

export function WebsitePreviewModal({
  url,
  title,
  onClose,
}: WebsitePreviewModalProps) {
  const meta = parseWebsiteUrl(url);
  const displayTitle = title || meta.hostname;
  const initial = displayTitle.slice(0, 1).toUpperCase();

  return (
    <div
      className="absolute inset-0 z-[70] grid place-items-center bg-[#1a1814]/55 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
      role="presentation"
    >
      <article
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-black/[0.06] bg-[#FAF8F4] shadow-[0_32px_100px_rgba(12,10,6,0.28)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="website-preview-title"
        aria-modal="true"
      >
        <div className="relative h-[min(56vh,420px)] min-h-[280px] shrink-0 overflow-hidden">
          <WebsitePreviewFrame interactive url={url} />

          <button
            aria-label="Close preview"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.08] bg-white/90 text-[#5C574E] shadow-[0_4px_16px_rgba(24,20,12,0.1)] transition hover:bg-white hover:text-[#1E1C18]"
            type="button"
            onClick={onClose}
          >
            <svg
              aria-hidden
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-black/[0.07] bg-white text-base font-semibold text-[#2C2924] shadow-[0_4px_14px_rgba(24,20,12,0.08)]">
              {initial}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8A8478]">
                {meta.hostname}
              </p>
              <h2
                id="website-preview-title"
                className="mt-1 text-xl font-medium leading-tight tracking-tight text-[#1E1C18] sm:text-2xl"
              >
                {displayTitle}
              </h2>
              {meta.path ? (
                <p className="mt-1 truncate text-sm text-[#9A9488]">{meta.path}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-black/[0.06] bg-white/70 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9A9488]">
              URL
            </p>
            <p className="mt-1 break-all text-sm text-[#3D3A34]">{url}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a
              className="inline-flex items-center justify-center rounded-lg bg-[#2C2924] px-5 py-2.5 text-sm font-medium text-[#FAF8F4] transition hover:bg-[#1E1C18]"
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              Open in browser
            </a>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-black/[0.08] bg-white px-5 py-2.5 text-sm font-medium text-[#3D3A34] transition hover:bg-[#F3F0E8]"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
