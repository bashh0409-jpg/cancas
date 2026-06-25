"use client";

import { ClearLocalDataOnQuery } from "@/app/components/home/ClearLocalDataOnQuery";
import FloatingToolbar from "@/app/components/FloatingToolbar";
import type { CanvasContent } from "@/types/canvas";
import { Suspense, useEffect, useState } from "react";
import type { UploadDebugEntry } from "@/lib/canvas/uploadDebug";
import CanvasWorkspace from "./CanvasWorkspace";
import { SyncIndicator } from "@/app/components/canvas/SyncIndicator";
import { CreditsBadge } from "@/app/components/home/CreditsBadge";
import {
  USER_CREDITS_UPDATED_EVENT,
  type UserCreditsUpdatedDetail,
} from "@/lib/credits/events";

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
  serverUpdatedAt,
  userId,
  credits,
}: CanvasPageClientProps) {
  const [canvasTitle, setCanvasTitle] = useState(canvasName);
  const [currentCredits, setCurrentCredits] = useState(credits);

  const [syncStats, setSyncStats] = useState<ImageSyncStats>(() => ({
    synced: initialContent.imageNodes.filter((n) => Boolean(n.storagePath))
      .length,
    total: initialContent.imageNodes.length,
    failed: 0,
  }));

  const [, setUploadDebugEntries] = useState<
    UploadDebugEntry[]
  >([]);
  // const [showUploadDebug, setShowUploadDebug] = useState(false);

  // useEffect(() => {
  //   setShowUploadDebug(isUploadDebugEnabled());
  // }, []);

  useEffect(() => {
    const handleCreditsUpdated = (event: Event) => {
      const creditsDetail = (event as CustomEvent<UserCreditsUpdatedDetail>)
        .detail;

      if (typeof creditsDetail?.credits === "number") {
        setCurrentCredits(creditsDetail.credits);
      }
    };

    window.addEventListener(
      USER_CREDITS_UPDATED_EVENT,
      handleCreditsUpdated,
    );

    return () => {
      window.removeEventListener(
        USER_CREDITS_UPDATED_EVENT,
        handleCreditsUpdated,
      );
    };
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
      <div className="absolute bottom-0 right-0 z-50 flex w-fit items-center p-4">
        <SyncIndicator stats={syncStats} />
      </div>

      <div className="absolute right-4 top-4 z-50 flex items-center">
        <CreditsBadge
          credits={currentCredits}
          className=" rounded border-white/10 bg-black/75 px-1  shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl hover:bg-black/90"
        />
      </div>

      <FloatingToolbar />
    </main>
  );
}
