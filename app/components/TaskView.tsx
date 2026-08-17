"use client";

import { useEffect, useState } from "react";
import { Loader, SquareActivity, SquareUserRound } from "lucide-react";
import { useCanvasPreferencesStore } from "@/lib/canvas/canvasPreferencesStore";

type TaskProps = {
  credits: number;
  taskLabels?: string[];
  className?: string;
};

const TaskView = ({
  credits,
  taskLabels = ["No task running"],
  className,
}: TaskProps) => {
  const showActivityMonitor = useCanvasPreferencesStore(
    (state) => state.showActivityMonitor,
  );
  const setShowActivityMonitor = useCanvasPreferencesStore(
    (state) => state.setShowActivityMonitor,
  );
  const syncToServer = useCanvasPreferencesStore((state) => state.syncToServer);
  const hasTasks = taskLabels.length > 0 && taskLabels[0] !== "No task running";
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
            <span className="grotesk mr-1">{credits.toFixed(2)}</span>
          </span>
          <div className="flex gap-1">
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
              className="flex h-full cursor-not-allowed items-center rounded-full text-xs font-mono uppercase text-black"
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
                <div className="flex flex-col gap-2">
                  {taskLabels.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] uppercase flex gap-1 items-center tracking-tight font-mono text-black"
                    >
                      <Loader className="h-3 w-3 hidden animate-spin text-lime" />{" "}
                      {label}
                      <CountingDots />
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs tracking-tight font-mono text-black/60">
                No task running
              </span>
            )}

            {/* Uploading files summary */}
            {uploadingFiles.length > 0 && (
              <div className="mt-2 w-full">
                <div className="text-[10px] font-mono text-black/70 uppercase mb-1">
                  Uploading
                </div>
                <ul className="max-h-40 overflow-auto text-[11px]">
                  {uploadingFiles.map((f) => (
                    <li key={f.nodeId} className="flex  flex-col gap-2 mt-1">
                      <div className="flex justify-between items-center gap-1">
                        <div className="flex justify-between truncate items-center">
                          <span className="truncate tracking-tight">
                            {f.fileName}
                          </span>
                          {f.fileSize > BIG_FILE_BYTES && (
                            <span className="text-xs text-red-600 font-mono">
                              Large
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end">
                          <div className="flex-shrink-0">
                            <div className=" text-black text-[10px] flex items-center justify-center">
                              {formatPercent(f.percent)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
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

function CountingDots({ intervalMs = 400 }: { intervalMs?: number }) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((current) => (current % 3) + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return (
    <span className="inline-flex" aria-hidden>
      {[1, 2, 3].map((dot) => (
        <span key={dot} className={dot <= count ? "opacity-100" : "opacity-0"}>
          .
        </span>
      ))}
    </span>
  );
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

export default TaskView;

function formatPercent(p: unknown) {
  const n = Number(p);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// formatBytes removed — kept earlier but unused; restore if needed.
