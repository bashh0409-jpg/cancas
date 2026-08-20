"use client";

import {
  ArrowLeft,
  FileText,
  FolderOpen,
  Hand,
  HardDrive,
  ImageIcon,
  Import,
  LibraryBig,
  Loader2,
  Mic,
  SquareMousePointer,
  Network,
  Redo2,
  Search,
  Square,
  StickyNote,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { activateCanvasTextTool } from "@/lib/canvas/textToolEvents";
import { activateCanvasAiChatTool } from "@/lib/canvas/aiChatToolEvents";
import {
  activateCanvasTidyUpTool,
  type TidyUpMode,
} from "@/lib/canvas/tidyUpToolEvent";
import {
  VOICE_NOTE_RECORDED_EVENT,
  type VoiceNoteRecordedDetail,
} from "@/lib/canvas/voiceNotes";
import { SiGoogledrive, SiDropbox } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import { AssetLibrary } from "@/app/components/canvas/AssetLibrary";
import type { LibraryAsset } from "@/lib/canvas/assetLibrary";

function ToolboxButton({
  active = false,
  selected = false,
  disabled = false,
  children,
  label,
  onClick,
  bgColor,
  textColor,
}: {
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
  bgColor?: string;
  textColor?: string;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
      className={[
        "flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded transition disabled:cursor-not-allowed disabled:opacity-50",
        selected && "lime text-black",
        active
          ? " bg-red-500 text-white/60 shadow-[0_0_0_4px_rgba(239,68,68,0.14)]"
          : bgColor && textColor
            ? `${bgColor} ${textColor}`
            : "border-black/10 bg-[#212126] text-white/70 hover:lime ",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function FloatingToolbox() {
  const [isRecording, setIsRecording] = useState(false);
  const [canvasCursorTool, setCanvasCursorTool] = useState<"pointer" | "hand">(
    "hand",
  );
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [showMicrophonePermissionHelp, setShowMicrophonePermissionHelp] =
    useState(false);
  const [showImportOverlay, setShowImportOverlay] = useState(false);
  const [pageOverlay, setPageOverlay] = useState<
    "google-drive" | "dropbox" | "library" | null
  >(null);
  const [tidyMode, setTidyMode] = useState<TidyUpMode>("grouped");
  type CloudItem = {
    id: string;
    name: string;
    fileType: "folder" | "image" | "file";
    mimeType: string;
    size: number;
    path?: string;
    thumbnailUrl?: string;
  };

  type CloudFolder = {
    id: string;
    name: string;
  };

  const [cloudItems, setCloudItems] = useState<CloudItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<CloudFolder | null>(null);
  const [folderStack, setFolderStack] = useState<CloudFolder[]>([]);
  const [loadingCloudItems, setLoadingCloudItems] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [selectedCloudIndices, setSelectedCloudIndices] = useState<Set<number>>(
    new Set(),
  );
  const [cloudSearchQuery, setCloudSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  function setCanvasCursor(tool: "pointer" | "hand") {
    setCanvasCursorTool(tool);
    window.dispatchEvent(
      new CustomEvent("canvasai:canvas-cursor", { detail: tool }),
    );
  }

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        // Do not create a voice node after navigating away from the canvas.
        recorder.onstop = null;
        recorder.stop();
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function handleToggleRecording() {
    const activeRecorder = mediaRecorderRef.current;

    if (activeRecorder && activeRecorder.state !== "inactive") {
      activeRecorder.stop();
      return;
    }

    setRecordingError(null);
    setShowMicrophonePermissionHelp(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("This browser does not support microphone recording.");
      return;
    }

    if (!window.isSecureContext) {
      setRecordingError(
        "Microphone recording requires HTTPS or http://localhost. Open this canvas from a secure URL.",
      );
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setRecordingError(
        "This browser does not support saving microphone audio.",
      );
      return;
    }

    setIsRequestingMicrophone(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      startedAtRef.current = Date.now();
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (chunks.length > 0 && isMountedRef.current) {
          const blob = new Blob(chunks, {
            type: recorder.mimeType || "audio/webm",
          });
          const detail: VoiceNoteRecordedDetail = {
            id: crypto.randomUUID(),
            blob,
            durationMs: Math.max(1, Date.now() - startedAtRef.current),
          };

          window.dispatchEvent(
            new CustomEvent<VoiceNoteRecordedDetail>(
              VOICE_NOTE_RECORDED_EVENT,
              {
                detail,
              },
            ),
          );
        } else if (isMountedRef.current) {
          setRecordingError(
            "No audio was captured. Please try recording again.",
          );
        }

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        if (isMountedRef.current) {
          setIsRecording(false);
          // Clear the recording task once recording stops
          window.dispatchEvent(
            new CustomEvent("canvasai:task-status", {
              detail: { labels: null },
            }),
          );
        }
      };

      recorder.onerror = () => {
        if (isMountedRef.current) {
          setRecordingError(
            "Recording stopped unexpectedly. Please try again.",
          );
        }
      };

      recorder.start();
      setIsRecording(true);

      // Show "Recording audio" in the TaskView while recording is in progress
      window.dispatchEvent(
        new CustomEvent("canvasai:task-status", {
          detail: { labels: ["Recording audio"] },
        }),
      );
    } catch (error) {
      let message = "Unable to start recording. Please try again.";

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        let permissionState: PermissionState | null = null;

        try {
          permissionState = await navigator.permissions
            .query({ name: "microphone" as PermissionName })
            .then((permission) => permission.state);
        } catch {
          // Some browsers do not expose microphone state through the Permissions API.
        }

        if (permissionState === "granted") {
          message =
            "Chrome is allowed for this site, but macOS is blocking Chrome's microphone access.";
        } else {
          message =
            "Microphone access was denied. Allow it in your browser settings and try again.";
        }
        setShowMicrophonePermissionHelp(true);
      } else if (
        error instanceof DOMException &&
        error.name === "NotFoundError"
      ) {
        message = "No microphone was found. Connect one and try again.";
      } else if (
        error instanceof DOMException &&
        error.name === "NotReadableError"
      ) {
        message = "Your microphone is being used by another application.";
      }

      setRecordingError(message);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      setIsRecording(false);
    } finally {
      if (isMountedRef.current) {
        setIsRequestingMicrophone(false);
      }
    }
  }

  async function loadCloudItems(
    provider: "google-drive" | "dropbox",
    controller: AbortController,
    folderId?: string,
  ) {
    setCloudError(null);
    setCloudItems([]);
    setSelectedCloudIndices(new Set());
    setLoadingCloudItems(true);

    const queryParam =
      provider === "dropbox"
        ? `path=${encodeURIComponent(folderId ?? "")}`
        : `folderId=${encodeURIComponent(folderId ?? "root")}`;

    try {
      const res = await fetch(
        `/api/integrations/${provider}/list?${queryParam}`,
        { signal: controller.signal },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Unable to load cloud files.");
      }

      const data = await res.json();
      setCloudItems(data.items ?? []);
    } catch (err) {
      if (!controller.signal.aborted) {
        setCloudError(
          err instanceof Error ? err.message : "Unable to load cloud files.",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingCloudItems(false);
      }
    }
  }

  useEffect(() => {
    if (!pageOverlay || pageOverlay === "library") {
      return;
    }

    const controller = new AbortController();
    void Promise.resolve().then(() => {
      setFolderStack([]);
      setCurrentFolder(
        pageOverlay === "dropbox"
          ? { id: "", name: "Dropbox" }
          : { id: "root", name: "My Drive" },
      );
      loadCloudItems(pageOverlay, controller);
    });

    return () => {
      controller.abort();
    };
  }, [pageOverlay]);

  return (
    <>
      <div
        aria-label="Canvas toolbox"
        className="fixed bottom-5 gap-0.5 left-1/2 z-50 flex -translate-x-1/2 items-center  rounded-lg border border-white/5 bg-[#212126] p-1  shadow-[0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur-xl"
        role="toolbar"
      >
        <ToolboxButton
          selected
          label={
            canvasCursorTool === "pointer"
              ? "Use hand cursor"
              : "Use pointer cursor"
          }
          onClick={() =>
            setCanvasCursor(canvasCursorTool === "pointer" ? "hand" : "pointer")
          }
          bgColor={canvasCursorTool === "hand" ? "bg-[#f8ff9a]" : undefined}
          textColor={canvasCursorTool === "hand" ? "text-black" : undefined}
        >
          {canvasCursorTool === "pointer" ? (
            <SquareMousePointer
              className="h-5 text-black w-5"
              strokeWidth={1.5}
            />
          ) : (
            <Hand className="h-5 w-5" strokeWidth={1.5} />
          )}
        </ToolboxButton>

        <span className="mx-1 h-6 w-[1px] bg-white/10" />
        <ToolboxButton label="Add sticky note" onClick={activateCanvasTextTool}>
          <StickyNote className="h-5 w-5 rotate-90" strokeWidth={1.5} />
        </ToolboxButton>
        <ToolboxButton
          active={isRecording}
          label={
            isRequestingMicrophone
              ? "Requesting microphone access"
              : isRecording
                ? "Stop recording voice note"
                : "Record voice note"
          }
          onClick={handleToggleRecording}
          disabled={isRequestingMicrophone}
        >
          {isRecording ? (
            <Square className="h-4 w-4 fill-current" strokeWidth={1.5} />
          ) : (
            <Mic className="h-5 w-5" strokeWidth={1.5} />
          )}
        </ToolboxButton>
        <ToolboxButton
          label="Upload files"
          onClick={() => setShowImportOverlay(true)}
        >
          <Import className="h-5 w-5 " strokeWidth={1.5} />
        </ToolboxButton>
        <span className="mx-1 h-6 w-[1px] bg-white/10" />
        <ToolboxButton
          label="Reflow Intelligence"
          onClick={activateCanvasAiChatTool}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            fill="currentColor"
            width="100"
            height="100"
            viewBox="0 0 30 30"
            className="h-5 w-5 text-white/70"
            strokeWidth={1.5}
          >
            <path d="M27.02,14.981l-1.824-1.812l0.856-2.424c0.435-1.227,0.209-2.566-0.603-3.583c-0.812-1.018-2.069-1.531-3.358-1.384	l-2.554,0.296l-1.36-2.182C17.488,2.79,16.301,2.13,15,2.13s-2.488,0.659-3.177,1.763l-1.36,2.182L7.909,5.778	C6.622,5.632,5.362,6.146,4.551,7.163c-0.812,1.017-1.037,2.356-0.603,3.583l0.856,2.424L2.98,14.981	C2.058,15.897,1.68,17.202,1.97,18.47c0.289,1.269,1.196,2.279,2.425,2.705l2.43,0.841l0.279,2.557	c0.142,1.293,0.926,2.402,2.097,2.966c1.174,0.565,2.53,0.486,3.628-0.21L15,25.953l2.172,1.375	c0.613,0.387,1.305,0.583,2.001,0.583c0.553,0,1.107-0.124,1.627-0.374c1.171-0.564,1.955-1.673,2.097-2.966l0.279-2.556l2.43-0.841	c1.229-0.425,2.136-1.436,2.425-2.705C28.32,17.202,27.942,15.897,27.02,14.981z M22.321,7.765c0.618-0.069,1.182,0.165,1.564,0.645	c0.384,0.48,0.486,1.089,0.281,1.668l-0.635,1.794c-1.453-1.074-2.488-2.359-3.136-3.884L22.321,7.765z M21.112,20.361	c-2.394,0.292-4.452,1.287-6.144,2.965c-1.849-1.716-3.919-2.715-6.175-2.98c0.062-2.519-0.437-4.741-1.486-6.63	c1.847-1.349,3.27-3.141,4.242-5.347c2.273,0.659,4.567,0.664,6.841,0.017c0.812,2.121,2.235,3.901,4.244,5.312	C21.375,15.692,20.864,17.925,21.112,20.361z M15,4.13c0.615,0,1.154,0.299,1.479,0.821l0.998,1.601	c-1.659,0.416-3.297,0.416-4.955,0l0.998-1.601C13.846,4.43,14.385,4.13,15,4.13z M6.114,8.41c0.383-0.481,0.947-0.715,1.564-0.645	L9.52,7.979c-0.755,1.567-1.769,2.844-3.063,3.863l-0.624-1.764C5.628,9.499,5.73,8.89,6.114,8.41z M3.919,18.025	c-0.137-0.6,0.035-1.192,0.472-1.625l1.351-1.342c0.691,1.393,1.044,3.009,1.05,4.83l-1.743-0.603	C4.468,19.084,4.056,18.625,3.919,18.025z M11.758,25.638c-0.521,0.329-1.136,0.365-1.689,0.098s-0.91-0.771-0.977-1.381	l-0.215-1.971c1.632,0.254,3.125,0.985,4.516,2.219L11.758,25.638z M19.932,25.736c-0.554,0.268-1.169,0.231-1.689-0.098	l-1.679-1.063c1.283-1.21,2.789-1.934,4.56-2.192l-0.215,1.971C20.842,24.966,20.485,25.47,19.932,25.736z M26.081,18.025	c-0.137,0.6-0.549,1.059-1.13,1.26l-1.864,0.645c-0.145-1.81,0.221-3.44,1.108-4.935l1.415,1.405	C26.046,16.833,26.218,17.426,26.081,18.025z"></path>
          </svg>
        </ToolboxButton>
        <ToolboxButton
          label={`Tidy up ${tidyMode === "grouped" ? "horizontally" : "vertically"}`}
          onClick={() => {
            const next = tidyMode === "grouped" ? "grid" : "grouped";

            // State updater functions may be evaluated while React renders.
            // Dispatching from one would synchronously update CanvasWorkspace
            // during that render.
            activateCanvasTidyUpTool(next);
            setTidyMode(next);
          }}
        >
          {tidyMode === "grouped" ? (
            <Network className="w-5 h-5 stroke-[1.5]" />
          ) : (
            <Network className="w-5 h-5 -rotate-90 stroke-[1.5]" />
          )}
        </ToolboxButton>
        <span className="mx-1 hidden h-6 w-[1px] bg-white/10" />
        <span className="hidden">
          <ToolboxButton
            label="Undo"
            onClick={() => document.execCommand("undo")}
          >
            <Undo2 className="h-5 w-5 text-white/40" strokeWidth={1.5} />
          </ToolboxButton>
          <ToolboxButton
            label="Redo"
            onClick={() => document.execCommand("redo")}
          >
            <Redo2 className="h-5 w-5 text-white/40" strokeWidth={1.5} />
          </ToolboxButton>
        </span>
      </div>
      {recordingError && (
        <div
          aria-live="polite"
          className="fixed bottom-16 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] items-center gap-3 -translate-x-1/2 rounded border border-red-400/30 bg-[#212126] px-3 py-2 text-xs text-red-200 shadow-lg"
          role="status"
        >
          <div className="mono uppercase tracking-tight">
            <p>{recordingError}</p>
            {showMicrophonePermissionHelp && (
              <div className="mt-1 space-y-1 text-red-200/70 normal-case">
                <p>
                  In your browser&apos;s address bar, open{" "}
                  <strong>Site controls</strong> — usually a sliders icon, not a
                  padlock — and set Microphone to <strong>Allow</strong>.
                </p>
                <p>
                  On macOS, open System Settings → Privacy &amp; Security →
                  Microphone, enable <strong>Google Chrome</strong>, then quit
                  and reopen Chrome.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showImportOverlay ? (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => {
              setShowImportOverlay(false);
              setPageOverlay(null);
            }}
          />
          <div className="w-72 h-screen bg-[#212126] border-l border-white/10 p-4 flex flex-col overflow-y-auto">
            {pageOverlay === "library" ? (
              <AssetLibrary
                onClose={() => {
                  setShowImportOverlay(false);
                  setPageOverlay(null);
                }}
                onImportToCanvas={(assets: LibraryAsset[]) => {
                  if (assets.length > 0) {
                    window.dispatchEvent(
                      new CustomEvent("canvasai:library-import", {
                        detail: { libraryAssets: assets },
                      }),
                    );
                    setShowImportOverlay(false);
                    setPageOverlay(null);
                  }
                }}
              />
            ) : !pageOverlay ? (
              <>
                <div className="flex items-center justify-between pb-3 mb-2 ">
                  <h3 className="text-white flex items-center gap-2 text-xs mono uppercase tracking-tight">
                    <Import className="w-3.5 h-3.5" strokeWidth={1.25} />
                    Import Files
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportOverlay(false);
                      setPageOverlay(null);
                    }}
                    className="text-white/60 cursor-pointer hover:text-white transition"
                  >
                    <X className="w-4 h-4" strokeWidth={1.25} />
                  </button>
                </div>

                <div className="flex  flex-col gap-1 mt-2">
                  <p className="text-xs tracking-tight mb-4  uppercase mono text-white">
                    SELECT A STORAGE SOURCE TO IMPORT FILES FROM.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center hidden rounded border border-white/10 bg-[#1a1a1e] p-2 px-4  lime transition hover:border-white/20 hover:bg-white/5 cursor-pointer"
                  >
                    <HardDrive
                      className="w-4 h-4 text-black shrink-0"
                      strokeWidth={2}
                    />
                    <span className="mono text-xs tracking-tight ml-4">
                      LOCAL STORAGE
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageOverlay("library")}
                    className="flex items-center rounded border border-white/10 bg-[#1a1a1e] p-2 px-4 lime transition hover:border-white/20 hover:bg-white/5 cursor-pointer"
                  >
                    <LibraryBig
                      className="w-4 h-4 text-black shrink-0"
                      strokeWidth={1.5}
                    />
                    <span className="mono text-xs tracking-tight ml-4">
                      LIBRARY
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageOverlay("google-drive")}
                    className="flex items-center  rounded border border-white/10 bg-[#1a1a1e] p-2 px-4  lime transition hover:border-white/20 hover:bg-white/5 cursor-pointer"
                  >
                    <SiGoogledrive className="w-4 h-4 text-black shrink-0" />
                    <span className="mono text-xs tracking-tight ml-4">
                      GOOGLE DRIVE
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageOverlay("dropbox")}
                    className="flex items-center  rounded border lime p-2  px-4 lime transition text-black cursor-pointer"
                  >
                    <SiDropbox className="w-4 h-4 text-black shrink-0" />
                    <span className="mono text-xs tracking-tight ml-4">
                      DROPBOX
                    </span>
                  </button>
                </div>

                <div className="mt-auto ">
                  <p className="text-[9px] uppercase mono text-white">
                    Files remain in your cloud storage unless explicitly
                    imported.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPageOverlay(null);
                        setSelectedCloudIndices(new Set());
                      }}
                      className="text-white/60 cursor-pointer hover:text-white transition flex items-center gap-1 text-xs mono uppercase tracking-tight"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Back
                    </button>
                    <h3 className="text-white  text-xs mono uppercase tracking-tight">
                      {pageOverlay === "google-drive"
                        ? "Google Drive"
                        : "Dropbox"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportOverlay(false);
                      setPageOverlay(null);
                    }}
                    className="text-white/60 cursor-pointer hover:text-white transition"
                  >
                    <X className="w-4 h-4" strokeWidth={1.25} />
                  </button>
                </div>
                <div className=" w-full gap-2 px-1 flex bg-white/20 items-center rounded-xs border border-white/20  text-white">
                  <Search className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={cloudSearchQuery}
                    onChange={(e) => setCloudSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className=" w-full h-full py-1 font-medium text-xs uppercase text-white mono tracking-tight placeholder-white/40 focus:outline-none focus:border-none focus:ring-0 focus:ring-white/0 bg-transparent"
                  />
                  {cloudSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCloudSearchQuery("")}
                      className="text-white/40 hover:text-white/70 transition cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hidden">
                  {(() => {
                    const filteredItems = cloudSearchQuery.trim()
                      ? cloudItems.filter((item) =>
                          item.name
                            .toLowerCase()
                            .includes(cloudSearchQuery.toLowerCase()),
                        )
                      : cloudItems;

                    if (cloudError) {
                      return (
                        <div className="rounded mono uppercase tracking-tight border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
                          {cloudError}
                        </div>
                      );
                    }

                    if (loadingCloudItems) {
                      return (
                        <div className="flex flex-col mono uppercase tracking-tight items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                          <span className="text-xs text-white/60 mt-4">
                            Loading files...
                          </span>
                        </div>
                      );
                    }

                    if (filteredItems.length === 0) {
                      return (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-xs mono uppercase tracking-tight text-white/40">
                            {cloudSearchQuery.trim()
                              ? "No matching files found."
                              : "No files found."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-[10px] text-white/50">
                          <span className="mono uppercase hidden tracking-tight">
                            {currentFolder?.name ??
                              (pageOverlay === "dropbox"
                                ? "Dropbox"
                                : "My Drive")}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {filteredItems.map((item, index) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                if (item.fileType === "folder") {
                                  const folder = {
                                    id: item.id,
                                    name: item.name,
                                  };
                                  setFolderStack((current) => [
                                    ...(current || []),
                                    currentFolder ?? {
                                      id:
                                        pageOverlay === "dropbox" ? "" : "root",
                                      name:
                                        pageOverlay === "dropbox"
                                          ? "Dropbox"
                                          : "My Drive",
                                    },
                                  ]);
                                  setCurrentFolder(folder);
                                  const controller = new AbortController();
                                  const provider = pageOverlay as
                                    | "google-drive"
                                    | "dropbox";
                                  void Promise.resolve().then(() =>
                                    loadCloudItems(
                                      provider,
                                      controller,
                                      folder.id,
                                    ),
                                  );
                                  return;
                                }
                                setSelectedCloudIndices((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(index)) {
                                    next.delete(index);
                                  } else {
                                    next.add(index);
                                  }
                                  return next;
                                });
                              }}
                              className={`group relative aspect-[4/3] cursor-pointer overflow-hidden rounded border transition ${
                                selectedCloudIndices.has(index)
                                  ? "border-white/40 bg-white/10"
                                  : "border-white/10 bg-[#1a1a1e] hover:border-white/30"
                              }`}
                            >
                              {item.fileType === "image" ? (
                                <>
                                  {item.thumbnailUrl ? (
                                    <Image
                                      src={item.thumbnailUrl}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 50vw, 160px"
                                      loading="lazy"
                                      onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        const img =
                                          e.target as HTMLImageElement;
                                        img.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <ImageIcon
                                        className="h-6 w-6 text-white/30"
                                        strokeWidth={1.5}
                                      />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                                  {item.fileType === "folder" ? (
                                    <FolderOpen
                                      className="h-6 w-6 text-white/40"
                                      strokeWidth={1.5}
                                    />
                                  ) : (
                                    <FileText
                                      className="h-6 w-6 text-white/40"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                  <span className="text-[10px] uppercase tracking-tight text-white/70 mono">
                                    {item.fileType === "folder" ? (
                                      <span>{item.name}</span>
                                    ) : (
                                      "File"
                                    )}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-x-0 mono bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <p className="truncate mono text-xs text-white/80">
                                  {item.name}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {selectedCloudIndices.size > 0 && (
                  <div className="mt-auto pt-3">
                    <p className="text-[10px] mono uppercase tracking-tight text-white/50 mb-2">
                      {selectedCloudIndices.size} file
                      {selectedCloudIndices.size > 1 ? "s" : ""} selected
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        const selectedItems = Array.from(selectedCloudIndices)
                          .map((i) => cloudItems[i])
                          .filter((item) => item.fileType !== "folder");

                        if (selectedItems.length === 0) return;

                        const files: File[] = [];

                        for (const selected of selectedItems) {
                          const queryParam =
                            pageOverlay === "dropbox"
                              ? `path=${encodeURIComponent(selected.path ?? selected.id)}`
                              : `fileId=${encodeURIComponent(selected.id)}`;

                          const provider = pageOverlay as
                            | "google-drive"
                            | "dropbox";

                          try {
                            const response = await fetch(
                              `/api/integrations/${provider}/download?${queryParam}`,
                            );
                            if (!response.ok) {
                              const payload = await response
                                .json()
                                .catch(() => null);
                              setCloudError(
                                payload?.error ||
                                  "Unable to download cloud file.",
                              );
                              return;
                            }
                            const blob = await response.blob();
                            const fileName =
                              response.headers.get("x-file-name") ||
                              selected.name;
                            files.push(
                              new File([blob], fileName, {
                                type:
                                  blob.type ||
                                  selected.mimeType ||
                                  "application/octet-stream",
                              }),
                            );
                          } catch (err) {
                            setCloudError(
                              err instanceof Error
                                ? err.message
                                : "Unable to download cloud file.",
                            );
                            return;
                          }
                        }

                        if (files.length > 0) {
                          window.dispatchEvent(
                            new CustomEvent("canvasai:file-import", {
                              detail: { files },
                            }),
                          );
                          setShowImportOverlay(false);
                          setPageOverlay(null);
                        }
                      }}
                      className="w-full cursor-pointer rounded lime px-3 py-1.5 text-xs mono uppercase tracking-tight text-black transition"
                    >
                      Import{" "}
                      {selectedCloudIndices.size > 1
                        ? `(${selectedCloudIndices.size})`
                        : ""}{" "}
                      Selected
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.currentTarget.files;

          if (!files || files.length === 0) {
            event.currentTarget.value = "";
            return;
          }

          const fileArray = Array.from(files);
          window.dispatchEvent(
            new CustomEvent("canvasai:file-import", {
              detail: { files: fileArray },
            }),
          );

          event.currentTarget.value = "";
          setShowImportOverlay(false);
        }}
      />
    </>
  );
}
