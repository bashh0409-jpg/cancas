"use client";

import { ClearLocalDataOnQuery } from "@/app/components/work/ClearLocalDataOnQuery";
import FloatingToolbar from "@/app/components/FloatingToolbar";
import type { CanvasContent } from "@/types/canvas";
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { UploadDebugEntry } from "@/lib/canvas/uploadDebug";
import { createClient } from "@/lib/supabase/client";
import { getUserCanvases } from "@/lib/canvas/repository";
import { getUserCredits } from "@/lib/credits/repository";
const CanvasWorkspace = dynamic(() => import("./CanvasWorkspace"), {
  ssr: false,
});
import { SyncIndicator } from "@/app/components/canvas/SyncIndicator";
import { CreditsBadge } from "@/app/components/work/CreditsBadge";
import {
  USER_CREDITS_UPDATED_EVENT,
  type UserCreditsUpdatedDetail,
} from "@/lib/credits/events";
import TaskView from "@/app/components/TaskView";

type ImageSyncStats = {
  synced: number;
  total: number;
  failed: number;
};

type CanvasPageClientProps = {
  canvasId: string;
  canvasName: string;
  initialContent: CanvasContent;
  canvases: { id: string; name: string; slug: string }[];
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
  canvases,
  initialContent,
  serverUpdatedAt,
  userId,
  credits,
}: CanvasPageClientProps) {
  const [canvasTitle, setCanvasTitle] = useState(canvasName);
  const [currentCredits, setCurrentCredits] = useState(credits);
  const [taskLabels, setTaskLabels] = useState<string[]>(["No task running"]);
  const [userCanvases, setUserCanvases] = useState(canvases);

  const [syncStats, setSyncStats] = useState<ImageSyncStats>(() => ({
    synced: initialContent.imageNodes.filter((n) => Boolean(n.storagePath))
      .length,
    total: initialContent.imageNodes.length,
    failed: 0,
  }));

  const [, setUploadDebugEntries] = useState<UploadDebugEntry[]>([]);

  useEffect(() => {
    const handleCreditsUpdated = (event: Event) => {
      const creditsDetail = (event as CustomEvent<UserCreditsUpdatedDetail>)
        .detail;

      if (typeof creditsDetail?.credits === "number") {
        setCurrentCredits(creditsDetail.credits);
      }
    };

    const handleTaskStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ labels: string[] | null }>).detail;
      setTaskLabels(
        detail?.labels?.length ? detail.labels : ["No task running"],
      );
    };

    window.addEventListener(USER_CREDITS_UPDATED_EVENT, handleCreditsUpdated);
    window.addEventListener("canvasai:task-status", handleTaskStatus);

    return () => {
      window.removeEventListener(
        USER_CREDITS_UPDATED_EVENT,
        handleCreditsUpdated,
      );
      window.removeEventListener("canvasai:task-status", handleTaskStatus);
    };
  }, []);

  useEffect(() => {
    if (canvases.length > 0) {
      return;
    }

    const loadDeferredData = async () => {
      try {
        const supabase = createClient();
        const [loadedCanvases, loadedCredits] = await Promise.all([
          getUserCanvases(supabase, userId),
          credits <= 0
            ? getUserCredits(supabase, userId)
            : Promise.resolve(credits),
        ]);

        setUserCanvases(loadedCanvases);
        if (credits <= 0) setCurrentCredits(loadedCredits);
      } catch (error) {
        console.error("Failed to load deferred canvas data:", error);
      }
    };

    void loadDeferredData();
  }, [canvases.length, credits, userId]);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#111111]">
      <Suspense fallback={null}>
        <ClearLocalDataOnQuery redirectTo={`/canvas/${canvasId}`} />
      </Suspense>

      <CanvasWorkspace
        canvasId={canvasId}
        canvasName={canvasTitle}
        canvases={userCanvases}
        initialContent={initialContent}
        serverUpdatedAt={serverUpdatedAt}
        userId={userId}
        onImageSyncStatsChange={setSyncStats}
        onUploadDebugEntry={(entry) =>
          setUploadDebugEntries((c) => [entry, ...c].slice(0, 6))
        }
        onRemoteNameChange={setCanvasTitle}
      />

      <div className="absolute bottom-0 right-0 z-50 flex w-fit items-center p-4">
        <SyncIndicator stats={syncStats} />
      </div>

      <div className="absolute hidden right-4 top-4 z-50 flex items-center">
        <CreditsBadge
          credits={currentCredits}
          className=" rounded border-white/10 bg-black/75 px-1  shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl hover:bg-black/90"
        />
      </div>
      <div className="absolute right-4 top-4 z-50 flex items-center">
        <TaskView credits={currentCredits} taskLabels={taskLabels} />
        
      </div>
    </main>
  );
}
