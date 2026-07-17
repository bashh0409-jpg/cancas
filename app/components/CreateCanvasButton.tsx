"use client";

import { useRef, useState } from "react";
import { FilePlusCorner, Loader2, Plus } from "lucide-react";

export function CreateCanvasButton({
  createCanvasAction,
  collapsed,
  labelRef,
}: {
  createCanvasAction: (idempotencyKey: string) => Promise<void>;
  collapsed: boolean;
  labelRef: (el: HTMLElement | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const pendingKeyRef = useRef<string | null>(null);

  const handleClick = async () => {
    if (pendingKeyRef.current) {
      return;
    }

    pendingKeyRef.current = crypto.randomUUID();

    try {
      setLoading(true);
      await createCanvasAction(pendingKeyRef.current);
    } finally {
      pendingKeyRef.current = null;
      setLoading(false);
    }
  };

  const label = "Create new file";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={collapsed ? label : undefined}
      className={`
        w-full h-8 lime cursor-pointer rounded-xs flex items-center text-sm
        text-black transition-colors
        hover:bg-white/10
        disabled:opacity-60 disabled:cursor-not-allowed
        ${collapsed ? "justify-center px-0" : "justify-between px-2"}
      `}
    >
      <div className={`flex items-center ${collapsed ? "gap-0" : "gap-2"}`}>
        <span className="shrink-0 flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FilePlusCorner className="w-4 h-4" />
          )}
        </span>

        <span
          ref={labelRef as React.LegacyRef<HTMLSpanElement>}
          className={`
            whitespace-nowrap mono uppercase text-xs font-medium
            ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}
          `}
        >
          {loading ? "please wait..." : label}
        </span>
      </div>
    </button>
  );
}
