"use client";

import { EditableCanvasName } from "@/app/components/canvas/EditableCanvasName";
import FloatingToolbar from "@/app/components/FloatingToolbar";
import type { CanvasContent } from "@/types/canvas";
import Link from "next/link";
import { useState } from "react";
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
    synced: initialContent.imageNodes.filter((node) => Boolean(node.storagePath))
      .length,
    total: initialContent.imageNodes.length,
  }));

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#111111]">
      <CanvasWorkspace
        canvasId={canvasId}
        canvasName={canvasTitle}
        initialContent={initialContent}
        serverUpdatedAt={serverUpdatedAt}
        userId={userId}
        onImageSyncStatsChange={setSyncStats}
      />

      <div className="absolute left-0 top-0 z-50 flex w-full items-center justify-between p-4">
        <Link
          href="/home"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/60 transition hover:bg-white/15"
        >
          <svg
            fill="currentColor"
            width="20"
            height="20"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M26.025 14.496l-14.286-.001 6.366-6.366L15.979 6 5.975 16.003 15.971 26l2.129-2.129-6.367-6.366h14.29z" />
          </svg>
        </Link>
        <EditableCanvasName
          canvasId={canvasId}
          initialName={canvasTitle}
          onNameChange={setCanvasTitle}
        />
        <div className="pixel text-sm tracking-tight text-white">
          You have {credits} credits left.
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-50 flex w-full items-center justify-between p-4">
        <div className="pixel text-sm tracking-tight text-white">
          <span className="text-white">{syncStats.synced}</span>
          <span className="text-white/50"> / {syncStats.total}</span>
          <span className="text-white/70"> synced to cloud</span>
        </div>
        <div className="pixel text-sm tracking-tight text-white">
          Let&apos;s do this thing{" "}
          <SignOutNameButton firstName={firstName} signOutAction={signOutAction} />
        </div>
      </div>

      <FloatingToolbar />
    </main>
  );
}
