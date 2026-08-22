"use client";

import { useEffect, useState } from "react";
import { SquareActivity, SquareUserRound } from "lucide-react";
import { useCanvasPreferencesStore } from "@/lib/canvas/canvasPreferencesStore";
import { formatCredits } from "@/lib/credits/format";

type TaskProps = {
  credits: number;
  taskLabels?: string[];
  className?: string;
  storageSizeBytes?: number;
};

const TaskView = ({
  credits,
  taskLabels = ["No task running"],
  className,
  storageSizeBytes,
}: TaskProps) => {
  const showActivityMonitor = useCanvasPreferencesStore(
    (state) => state.showActivityMonitor,
  );
  const setShowActivityMonitor = useCanvasPreferencesStore(
    (state) => state.setShowActivityMonitor,
  );
  const syncToServer = useCanvasPreferencesStore((state) => state.syncToServer);
  const hasTasks = taskLabels.length > 0 && taskLabels[0] !== "No task running";
  const storageSize = formatStorageSize(storageSizeBytes);
  const [uploadingFiles, setUploadingFiles] = useState<
    { nodeId: string; fileName: string; fileSize: number; percent: number }[]
  >([]);
  const [failedFiles, setFailedFiles] = useState<
    { nodeId: string; fileName: string; message: string }[]
  >([]);

  const BIG_FILE_BYTES = 5 * 1024 * 1024; // 5MB threshold for 'big'

  useEffect(() => {
    function handleStart(event: Event) {
      const d = (event as CustomEvent).detail as {
        nodeId: string;
        fileName: string;
        fileSize: number;
      };

      if (!d) return;

      setUploadingFiles((current) => {
        if (current.some((c) => c.nodeId === d.nodeId)) return current;
        return [
          {
            nodeId: d.nodeId,
            fileName: d.fileName,
            fileSize: d.fileSize,
            percent: 0,
          },
          ...current,
        ];
      });
    }

    function handleProgress(event: Event) {
      const d = (event as CustomEvent).detail as
        | { nodeId: string; percent: number }
        | undefined;
      if (!d) return;

      const raw = Number(d.percent);
      const sanePercent = Number.isFinite(raw) ? raw : 0;

      setUploadingFiles((current) => {
        // update existing entry
        if (current.some((c) => c.nodeId === d.nodeId)) {
          return current.map((c) =>
            c.nodeId === d.nodeId ? { ...c, percent: sanePercent } : c,
          );
        }

        // if we don't have the entry yet, add it
        return [
          {
            nodeId: d.nodeId,
            fileName: "(uploading)",
            fileSize: 0,
            percent: sanePercent,
          },
          ...current,
        ];
      });
    }

    function handleSuccess(event: Event) {
      const d = (event as CustomEvent).detail as { nodeId: string } | undefined;
      if (!d) return;
      setUploadingFiles((current) =>
        current.filter((c) => c.nodeId !== d.nodeId),
      );
      setFailedFiles((current) => current.filter((f) => f.nodeId !== d.nodeId));
    }

    function handleFailed(event: Event) {
      const d = (event as CustomEvent).detail as
        | {
            nodeId: string;
            fileName: string;
            message: string;
          }
        | undefined;
      if (!d) return;

      setUploadingFiles((current) =>
        current.filter((c) => c.nodeId !== d.nodeId),
      );
      setFailedFiles((current) => {
        if (current.some((c) => c.nodeId === d.nodeId)) return current;
        return [
          { nodeId: d.nodeId, fileName: d.fileName, message: d.message },
          ...current,
        ];
      });
    }

    window.addEventListener(
      "canvasai:upload-start",
      handleStart as EventListener,
    );
    window.addEventListener(
      "canvasai:upload-progress",
      handleProgress as EventListener,
    );
    window.addEventListener(
      "canvasai:upload-success",
      handleSuccess as EventListener,
    );
    window.addEventListener(
      "canvasai:upload-failed",
      handleFailed as EventListener,
    );

    return () => {
      window.removeEventListener(
        "canvasai:upload-start",
        handleStart as EventListener,
      );
      window.removeEventListener(
        "canvasai:upload-progress",
        handleProgress as EventListener,
      );
      window.removeEventListener(
        "canvasai:upload-success",
        handleSuccess as EventListener,
      );
      window.removeEventListener(
        "canvasai:upload-failed",
        handleFailed as EventListener,
      );
    };
  }, []);

  return (
    <div className="gap-1 flex flex-col">
      <div
        role="group"
        className={`flex p-2 border border-white/2 gap-2 flex-col  bg-[#212126] h-fit  w-50 rounded text-black  text-[10px] tracking-tight ${className ?? ""}`}
      >
        <div className="flex  w-full justify-between items-center gap-1">
          <span className="text-xs cursor-pointer font-mono uppercase  flex items-center tracking-tight text-white">
            <Icon />
            <span className="grotesk mr-1">{formatCredits(credits)}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded text-[10px] text-white gap-1">
              <span className="grotesk">{storageSize.value}</span>
              <span className="font-mono uppercase text-white/80">
                {storageSize.unit}
              </span>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowActivityMonitor(!showActivityMonitor);
                void syncToServer();
              }}
              aria-label="Show activity monitor"
              title="Show activity monitor"
              className="flex cursor-pointer items-center rounded-full font-mono text-xs text-black"
            >
              <SquareActivity className="w-4 text-white stroke-[1.5] h-4" />
            </button>
            <button
              type="button"
              aria-label="Share canvas"
              title="Share"
              className="flex h-full hidden cursor-not-allowed items-center rounded-full text-xs font-mono uppercase text-black"
            >
              <SquareUserRound className="h-4 w-4 text-white/50 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>
      {showActivityMonitor && (
        <div
          className={`flex p-2  border-white/2 gap-2 flex-col bg-white h-fit w-50 rounded text-black text-[10px] tracking-tight ${className ?? ""}`}
        >
          {/**Task monotor */}
          <div className="flex text-black font-medium flex-col w-full items-start gap-1 text-left">
            {hasTasks ? (
              <div className="flex items-center gap-2 ">
                <div className="flex flex-col w-full  gap-2">
                  {taskLabels.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] justify-between w-full uppercase flex gap-1 items-center tracking-tight font-mono text-black"
                    >
                      {label} <TaskIndicator />
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs tracking-tigh font-mon capitaliz  text-black/50">
                No task running
              </span>
            )}

            {/* Uploading files summary */}
            {uploadingFiles.length > 0 && (
              <div className="mt-2 w-full">
                <div className="text-[10px] hidden font-mono text-black/70 uppercase mb-1">
                  Uploading
                </div>

                <ul className="max-h-40 overflow-auto text-[11px]">
                  {uploadingFiles.map((f) => {
                    const progress = Math.min(100, Math.max(0, f.percent));
                    const radius = 6;
                    const circumference = 2 * Math.PI * radius;
                    const offset =
                      circumference - (progress / 100) * circumference;

                    return (
                      <li key={f.nodeId} className="flex flex-col gap-2 mt-1">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex justify-between truncate items-center min-w-0">
                            <span className="truncate tracking-tight">
                              {f.fileName}
                            </span>

                            {f.fileSize > BIG_FILE_BYTES && (
                              <span className="text-xs text-red-600 font-mono ml-2">
                                Large
                              </span>
                            )}
                          </div>

                          <div className="relative flex-shrink-0 w-4 h-4">
                            <svg
                              className="w-4 h-4 -rotate-90"
                              viewBox="0 0 16 16"
                              aria-label={`${progress}% uploaded`}
                            >
                              <circle
                                cx="8"
                                cy="8"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-black/10"
                              />

                              <circle
                                cx="8"
                                cy="8"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                className="text-black transition-[stroke-dashoffset] duration-200"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                              />
                            </svg>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {failedFiles.length > 0 && (
              <div className="mt-2 w-full">
                <div className="text-[10px] font-mono text-black/70 uppercase mb-1">
                  Upload Errors
                </div>
                <ul className="max-h-40 overflow-auto text-[11px]">
                  {failedFiles.map((f) => (
                    <li
                      key={f.nodeId}
                      className="flex flex-col gap-1 text-red-700"
                    >
                      <span className="font-mono text-[11px]">
                        {f.fileName}
                      </span>
                      <span className="text-[10px] text-red-600">
                        {f.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function formatStorageSize(sizeBytes?: number) {
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes === undefined ||
    sizeBytes <= 0
  ) {
    return { value: "0", unit: "B" };
  }

  if (sizeBytes < 1024) {
    return { value: `${Math.round(sizeBytes)}`, unit: "B" };
  }

  const units = ["KB", "MB", "GB"];
  let size = sizeBytes;
  let unitIndex = -1;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return {
    value: size.toFixed(size < 10 ? 1 : 0),
    unit: units[unitIndex] ?? "GB",
  };
}

function Icon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3.75V20.25" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 7.5L19.5 16.5" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 16.5L19.5 7.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TaskIndicator() {
  return (
    <span
      className="relative inline-flex h-3 w-3 shrink-0"
      aria-label="Task running"
    >
      <svg
        className="h-3 w-3 animate-spin"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-black/15"
        />
        <path
          d="M8 2a6 6 0 0 1 6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-black"
        />
      </svg>
    </span>
  );
}

export default TaskView;
