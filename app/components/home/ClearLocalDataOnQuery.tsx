"use client";

import { clearAllCanvasLocalData } from "@/lib/canvas/localStorageCleanup";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type ClearLocalDataOnQueryProps = {
  redirectTo?: string;
};

export function ClearLocalDataOnQuery({
  redirectTo = "/home",
}: ClearLocalDataOnQueryProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) {
      return;
    }

    if (searchParams.get("resetLocal") !== "1") {
      return;
    }

    didRunRef.current = true;
    clearAllCanvasLocalData();
    router.replace(redirectTo);
  }, [redirectTo, router, searchParams]);

  return null;
}
