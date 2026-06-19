"use client";

import { AlertCircle, CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

type SyncStatus = "idle" | "syncing" | "error";

type ImageSyncStats = {
  synced: number;
  total: number;
  failed: number;
};

type SyncIndicatorProps = {
  stats: ImageSyncStats;
};

function deriveStatus(stats: ImageSyncStats): SyncStatus {
  if (stats.failed > 0) {
    return "error";
  }

  if (stats.synced < stats.total) {
    return "syncing";
  }

  return "idle";
}

export function SyncIndicator({ stats }: SyncIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const status = deriveStatus(stats);

  const config = useMemo(() => {
    switch (status) {
      case "syncing":
        return {
          icon: <Loader2 className="h-3.5 hidden w-3.5 animate-spin text-black/60" />,
          label: `${stats.synced}/${stats.total}`,
          description: `Uploading ${stats.total - stats.synced} remaining file${
            stats.total - stats.synced !== 1 ? "s" : ""
          }`,
          classes: "border-black/10 bg-white/95 text-black/75",
        };

      case "error":
        return {
          icon: <AlertCircle className="h-3.5 w-3.5 text-black/60" />,
          label: `${stats.failed} failed`,
          description: `${stats.synced}/${stats.total} synced successfully`,
          classes: "border-black/10 bg-white/95 text-black/75",
        };

      default:
        return {
          icon: <CheckCircle2 className="h-3.5 hidden w-3.5 text-black/60" />,
          label: "Saved",
          description: `All ${stats.total} file${
            stats.total !== 1 ? "s" : ""
          } synced to cloud`,
          classes: "border-black/10 hidden   bg-white/95 text-black/75",
        };
    }
  }, [stats, status]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        aria-label={config.description}
        className={[
          "group flex h-9 items-center gap-2 rounded border px-1",
          "backdrop-blur-xl transition-all duration-200",
          "shadow-[0_10px_28px_rgba(0,0,0,0.10)]",
          config.classes,
        ].join(" ")}
        type="button"
      >
        <div className="flex items-center justify-center">{config.icon}</div>

        <span className="text-xs mono uppercase  tracking-tight">{config.label}</span>

        {status === "syncing" ? (
          <div className="flex items-center gap-[2px]">
          </div>
        ) : null}
      </button>

      <div
        className={[
          "pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2",
          "-translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10",
          "bg-black/90 px-2.5 py-1.5 backdrop-blur-xl",
          "transition-all duration-150",
          showTooltip ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        ].join(" ")}
      >
        <div className="pixel text-[10px] tracking-tight text-white/70">
          {config.description}
        </div>

        <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-white/10 bg-black/90" />
      </div>
    </div>
  );
}
