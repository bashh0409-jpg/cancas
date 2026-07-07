"use client";

import { useEffect, useState } from "react";
import { WebsitePreviewFrame } from "./WebsitePreviewFrame";
import { parseWebsiteUrl } from "./utils";
import { ArrowUpRight, Globe, Trash2Icon, X, BookOpen } from "lucide-react";

type WebsitePreviewModalProps = {
  url: string;
  title: string;
  onClose: () => void;
  onOpenInNewTab: () => void;
};

type ReaderData = {
  title?: string;
  excerpt?: string;
  byline?: string;
  content?: string;
};

export function WebsitePreviewModal({
  url,
  title,
  onClose,
  onOpenInNewTab,
}: WebsitePreviewModalProps) {
  const meta = parseWebsiteUrl(url);
  const displayTitle = title || meta.hostname;

  const [readerMode, setReaderMode] = useState(false);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerData, setReaderData] = useState<ReaderData | null>(null);

  /* =========================
     LOCK BACKGROUND SCROLL
  ========================== */
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* =========================
     LOAD READER MODE
  ========================== */
  const loadReaderMode = async () => {
    try {
      setReaderLoading(true);

      const res = await fetch(`/api/reader?url=${encodeURIComponent(url)}`);

      if (!res.ok) throw new Error("Failed to load reader mode");

      const data = await res.json();

      setReaderData(data);
      setReaderMode(true);
    } catch (err) {
      console.error(err);
      alert("Unable to load reader mode for this page.");
    } finally {
      setReaderLoading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex flex-col items-center gap-4 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================
            PREVIEW CARD
        ========================== */}
        <article
          className="flex w-full max-w-4xl aspect-video  flex-col overflow-hidden rounded border border-black bg-[#FAF8F4] shadow-[0_32px_100px_rgba(12,10,6,0.28)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative h-full overflow-hidden bg-white">
            {readerMode ? (
              /* =========================
                  READER MODE UI
              ========================== */
              <div className="h-full overflow-y-auto bg-[#faf8f4]">
                {readerLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-black/20 border-t-black rounded-full mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        Loading article...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl px-6 sm:px-10 py-14">
                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black leading-tight">
                      {readerData?.title}
                    </h1>

                    {/* Meta */}
                    {(readerData?.byline || readerData?.excerpt) && (
                      <div className="mt-5 space-y-3">
                        {readerData?.byline && (
                          <p className="text-sm text-gray-500">
                            {readerData.byline}
                          </p>
                        )}

                        {readerData?.excerpt && (
                          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                            {readerData.excerpt}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="my-8 h-px w-full bg-black/10" />

                    {/* Content */}
                    <article
                      className="
                        prose prose-lg max-w-none
                        prose-headings:font-semibold
                        prose-p:leading-7
                        prose-p:text-gray-800
                        prose-a:text-blue-600
                        prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-lg
                      "
                      dangerouslySetInnerHTML={{
                        __html: readerData?.content ?? "",
                      }}
                    />

               
                  </div>
                )}
              </div>
            ) : (
              /* =========================
                  NORMAL PREVIEW
              ========================== */
              <WebsitePreviewFrame interactive url={url} />
            )}
          </div>
        </article>

        {/* =========================
            FLOATING TOOLBAR
        ========================== */}
       <div className="flex items-center justify-between gap-4 bg-white px-2 py-1 rounded min-w-[360px] w-fit shadow-lg">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenInNewTab();
            }}
            className="flex hover:underline cursor-pointer items-center gap- flex-1 min-w-0"
          >
            <Globe className="h-4 stroke-[1.8] w-4 mr-2 shrink-0" />
            <span className="text-[13px] mono tracking-tight">https://</span>
            <span className="text-xs mono tracking-tight truncate" title={url}>
              {displayTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Reader Mode */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                if (readerMode) {
                  setReaderMode(false);
                } else {
                  loadReaderMode();
                }
              }}
              className={`rounded-xs p-1 transition-colors ${
                readerMode ? "bg-black text-white" : "hover:bg-gray-100"
              } ${readerLoading ? "opacity-50" : ""}`}
              aria-label="Reader mode"
            >
              <BookOpen className="h-4 w-4 stroke-[1.8]" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="rounded-xs p-1 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 stroke-[1.8] w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
