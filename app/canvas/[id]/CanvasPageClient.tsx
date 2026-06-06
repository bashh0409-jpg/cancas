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
import { SignOutNameButton } from "../../home/SignOutNameButton";

type ImageSyncStats = {
  synced: number;
  total: number;
};

type CanvasPageClientProps = {
  canvasId: string;
  canvasName: string;
  initialContent: CanvasContent;
  serverUpdatedAt: string;
  userId: string;
  firstName: string;
  credits: number;
  signOutAction: (formData: FormData) => Promise<void>;
};

export default function CanvasPageClient({
  canvasId,
  canvasName,
  initialContent,
  serverUpdatedAt,
  userId,
  firstName,
  credits,
  signOutAction,
}: CanvasPageClientProps) {
  const [canvasTitle, setCanvasTitle] = useState(canvasName);
  const [syncStats, setSyncStats] = useState<ImageSyncStats>(() => ({
    synced: initialContent.imageNodes.filter((n) => Boolean(n.storagePath))
      .length,
    total: initialContent.imageNodes.length,
  }));

  const [uploadDebugEntries, setUploadDebugEntries] = useState<
    UploadDebugEntry[]
  >([]);
  const [showUploadDebug, setShowUploadDebug] = useState(false);

  useEffect(() => {
    setShowUploadDebug(isUploadDebugEnabled());
  }, []);

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

      {/* TOP BAR (strict 3-column grid) */}
      <div className="absolute left-0 top-0 z-50 w-full p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          {/* LEFT */}
          <div className="flex items-center gap-2 justify-start">
            <Link
              href="/home"
              className="
                flex h-8 w-8 items-center justify-center
                rounded-md border border-white/10
                bg-white text-black/70
                transition hover:bg-white/15 hover:text-white
              "
            >
              <svg
                fill="currentColor"
                width="18"
                height="18"
                viewBox="0 0 32 32"
              >
                <path d="M26.025 14.496l-14.286-.001 6.366-6.366L15.979 6 5.975 16.003 15.971 26l2.129-2.129-6.367-6.366h14.29z" />
              </svg>
            </Link>
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
          <div className="justify-self-end pixel text-sm tracking-tight text-white">
            You have {credits} credits left.
          </div>
        </div>
      </div>

      {/* DEBUG */}
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
      )}

      {/* BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 z-50 flex w-full items-center justify-between p-4">
        <div className="pixel text-sm tracking-tight text-white">
          <span className="text-white">{syncStats.synced}</span>
          <span className="text-white/50"> / {syncStats.total}</span>
          <span className="text-white/70"> synced to cloud</span>
        </div>

        <div className="pixel text-sm tracking-tight text-white">
          Let&apos;s do this thing{" "}
          <SignOutNameButton
            firstName={firstName}
            signOutAction={signOutAction}
          />
        </div>
      </div>

      <FloatingToolbar />
    </main>
  );
}
