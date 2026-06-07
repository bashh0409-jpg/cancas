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
import { SignOutNameButton } from "../../home/SignOutNameButton";

type CanvasObjectKind = "image" | "website" | "voice" | "cloud";

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
                rounded-xl border border-white/10
                bg-white text-black/70
                transition  hover:bg-white/90
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
            <div className="bg-white min-w-10 gap-1 h-8 rounded-lg text-sm  p-1 flex items-center">
              <button
                className="h-7  w-7 bg-black/10 p-1 items-center justify-center flex rounded-md text-black/50"
                aria-label="Undo"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.125 12.75L2.625 8.25L7.125 3.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M7.125 18.75H15.375C16.7674 18.75 18.1027 18.1969 19.0873 17.2123C20.0719 16.2277 20.625 14.8924 20.625 13.5C20.625 12.1076 20.0719 10.7723 19.0873 9.78769C18.1027 8.80312 16.7674 8.25 15.375 8.25H2.625"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </button>
              <button className="h-7 w-7 bg-black/10 p-1 font-semibold items-center justify-center flex rounded-md text-black/50">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.875 12.75L21.375 8.25L16.875 3.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M16.875 18.75H12.75H8.625C7.23261 18.75 5.89726 18.1969 4.91269 17.2123C3.92812 16.2277 3.375 14.8924 3.375 13.5C3.375 12.1076 3.92812 10.7723 4.91269 9.78769C5.89726 8.80312 7.23261 8.25 8.625 8.25H21.375"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </button>
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
      <div className="absolute bottom-0 left-0 z-50 flex w-fit items-center p-4">
        <SyncIndicator stats={syncStats} />
      </div>

      <FloatingToolbar />
    </main>
  );
}
