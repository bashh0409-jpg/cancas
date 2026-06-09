"use client";

import { ClearLocalDataOnQuery } from "@/app/components/home/ClearLocalDataOnQuery";
import { EditableCanvasName } from "@/app/components/canvas/EditableCanvasName";
import FloatingToolbar from "@/app/components/FloatingToolbar";
import type { CanvasContent } from "@/types/canvas";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import {
  isUploadDebugEnabled,
  type UploadDebugEntry,
} from "@/lib/canvas/uploadDebug";
import CanvasWorkspace from "./CanvasWorkspace";
import { SyncIndicator } from "@/app/components/canvas/SyncIndicator";
import { CanvasSwitcher } from "@/app/components/canvas/CanvasSwitcher"; // FIXED PATH
import { CreditsBadge } from "@/app/components/home/CreditsBadge";

type CanvasObjectKind = "image" | "website" | "voice" | "cloud";

type ImageSyncStats = {
  synced: number;
  total: number;
  failed: number;
};

type CanvasPageClientProps = {
  canvasId: string;
  canvasName: string;
  initialContent: CanvasContent;
  canvases: { id: string; name: string; slug: string }[]; // 👈 add this
  serverUpdatedAt: string;
  userId: string;
  firstName: string;
  lastName: string;
  credits: number;
  signOutAction: (formData: FormData) => Promise<void>;
};

export default function CanvasPageClient({
  canvasId,
  canvasName,
  initialContent,
  canvases,
  serverUpdatedAt,
  userId,
  firstName,
  lastName,
  credits,
  signOutAction,
}: CanvasPageClientProps) {
  const [canvasTitle, setCanvasTitle] = useState(canvasName);

  const [syncStats, setSyncStats] = useState<ImageSyncStats>(() => ({
    synced: initialContent.imageNodes.filter((n) => Boolean(n.storagePath))
      .length,
    total: initialContent.imageNodes.length,
    failed: 0,
  }));

  const [uploadDebugEntries, setUploadDebugEntries] = useState<
    UploadDebugEntry[]
  >([]);
  // const [showUploadDebug, setShowUploadDebug] = useState(false);

  // useEffect(() => {
  //   setShowUploadDebug(isUploadDebugEnabled());
  // }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#111111]">
      <Suspense fallback={null}>
        <ClearLocalDataOnQuery redirectTo={`/canvas/${canvasId}`} />
      </Suspense>

      <CanvasWorkspace
        canvasId={canvasId}
        canvasName={canvasTitle}
        initialContent={initialContent}
        serverUpdatedAt={serverUpdatedAt}
        userId={userId}
        onImageSyncStatsChange={setSyncStats}
        onUploadDebugEntry={(entry) =>
          setUploadDebugEntries((c) => [entry, ...c].slice(0, 6))
        }
        onRemoteNameChange={setCanvasTitle}
      />

      {/* TOP BAR */}
      <div className="absolute left-0 top-0 z-50 w-full p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          {/* LEFT */}
          <div className="flex items-center gap-2 justify-start">
            <Link
              href="/home"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white text-black/70 transition hover:bg-white/90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="100"
                height="100"
                viewBox="0 0 24 24"
                className="w-5 h-5"
              >
                <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 11 21 L 11 15 L 13 15 L 13 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z M 12 4.7910156 L 18 10.191406 L 18 11 L 18 19 L 15 19 L 15 13 L 9 13 L 9 19 L 6 19 L 6 10.191406 L 12 4.7910156 z"></path>
              </svg>
            </Link>

            <div className="bg-white min-w-10 gap-1 h-8 rounded-lg text-sm p-1 flex items-center">
              <CanvasSwitcher canvases={canvases} activeCanvasId={canvasId} />
            </div>
          </div>

          {/* CENTER */}
          <div className="justify-self-center">
            <EditableCanvasName
              canvasId={canvasId}
              initialName={canvasTitle}
              onNameChange={setCanvasTitle}
            />
          </div>

          {/* RIGHT */}
          <div className="justify-self-end  text-sm tracking-tight text-white">
            <CreditsBadge credits={credits} />
          </div>
        </div>
      </div>

      {/* DEBUG 
      {showUploadDebug && (
        <div className="absolute right-4 top-16 z-[60] max-w-md rounded-lg border border-red-500/40 bg-black/90 p-3 text-xs text-white shadow-lg">
          <p className="mb-2 font-medium text-red-300">Upload debug (dev)</p>
          {uploadDebugEntries.length === 0 ? (
            <p className="text-white/60">
              Drop images. Failed uploads will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {uploadDebugEntries.map((entry) => (
                <li
                  key={`${entry.nodeId}-${entry.attempt}-${entry.at}`}
                  className="rounded bg-white/5 p-2"
                >
                  <p className="font-medium">{entry.fileName}</p>
                  <p className="text-white/70">
                    attempt {entry.attempt} · {entry.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}*/}

      {/* BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 z-50 flex w-fit items-center p-4">
        <SyncIndicator stats={syncStats} />
      </div>

      <FloatingToolbar />
    </main>
  );
}
