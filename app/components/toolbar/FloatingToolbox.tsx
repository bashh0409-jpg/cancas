"use client";

import {
  FileText,
  Folder,
  Hand,
  ImageIcon,
  Import,
  Mic,
  Redo2,
  Server,
  Square,
  StickyNote,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { activateCanvasTextTool } from "@/lib/canvas/textToolEvents";
import { activateCanvasAiChatTool } from "@/lib/canvas/aiChatToolEvents";
import {
  VOICE_NOTE_RECORDED_EVENT,
  type VoiceNoteRecordedDetail,
} from "@/lib/canvas/voiceNotes";
import { SiGoogledrive, SiDropbox } from "@icons-pack/react-simple-icons";

function ToolboxButton({
  active = false,
  disabled = false,
  children,
  label,
  onClick,
  bgColor,
  textColor,
}: {
  active?: boolean;
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
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
      className={[
        "flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded transition disabled:cursor-not-allowed disabled:opacity-50",
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
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [showMicrophonePermissionHelp, setShowMicrophonePermissionHelp] =
    useState(false);
  const [showImportOverlay, setShowImportOverlay] = useState(false);
  const [pageOverlay, setPageOverlay] = useState<
    "google-drive" | "dropbox" | null
  >(null);
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
  const [selectedCloudIndex, setSelectedCloudIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const isMountedRef = useRef(true);

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
      setRecordingError("This browser does not support saving microphone audio.");
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
            new CustomEvent<VoiceNoteRecordedDetail>(VOICE_NOTE_RECORDED_EVENT, {
              detail,
            }),
          );
        } else if (isMountedRef.current) {
          setRecordingError("No audio was captured. Please try recording again.");
        }

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        if (isMountedRef.current) {
          setIsRecording(false);
        }
      };

      recorder.onerror = () => {
        if (isMountedRef.current) {
          setRecordingError("Recording stopped unexpectedly. Please try again.");
        }
      };

      recorder.start();
      setIsRecording(true);
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
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
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
    setSelectedCloudIndex(null);
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
    if (!pageOverlay) {
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
        {" "}
        <ToolboxButton
          label="Add sticky note"
          onClick={console.log}
          bgColor="bg-[#f8ff9a]"
          textColor="text-black"
        >
          <Hand className="h-5 w-5 " strokeWidth={1.5} />
        </ToolboxButton>
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
        <span className="mx-1 h-6 w-[1px] bg-white/10" />
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
                  In your browser&apos;s address bar, open <strong>Site controls</strong>
                  {" "}— usually a sliders icon, not a padlock — and set
                  {" "}Microphone to <strong>Allow</strong>.
                </p>
                <p>
                  On macOS, open System Settings → Privacy &amp; Security →
                  Microphone, enable <strong>Google Chrome</strong>, then quit
                  and reopen Chrome.
                </p>
              </div>
            )}
          </div>
          {showMicrophonePermissionHelp && (
            <button
              className="shrink-0 rounded border border-red-300/30 px-2 py-1 font-medium text-red-100 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRequestingMicrophone}
              onClick={() => void handleToggleRecording()}
              type="button"
            >
              Enable microphone
            </button>
          )}
          <button
            aria-label="Dismiss recording error"
            className="shrink-0 text-red-200/70 transition hover:text-red-100"
            onClick={() => {
              setRecordingError(null);
              setShowMicrophonePermissionHelp(false);
            }}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {showImportOverlay ? (
        <div
          onClick={() => setShowImportOverlay(false)}
          className="fixed inset-0 z-[100] flex items-center  justify-center bg-black/50 p-2"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-fit max-w-lg rounded border border-white/10  bg-white p-2 shadow-2xl"
          >
            <div className="mono uppercase text-sm tracking-tight text-black/70"></div>
            <div className=" flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded cursor-pointer flex items-center mono uppercase gap-2 text-xs tracking-tight lime px-4 py-2 text-black hover:bg-blue-600"
              >
                <Server className="inline-block h-4 w-4 mr-1" />
                Local storage
              </button>

              <button
                type="button"
                onClick={() => {
                  setPageOverlay("google-drive");
                  setShowImportOverlay(false);
                }}
                className="rounded cursor-pointer flex items-center mono uppercase gap-2 text-xs tracking-tight lime-one px-4 py-2 text-black hover:bg-blue-600"
              >
                <SiGoogledrive className="inline-block h-4 w-4 mr-1" />
                Google Drive
              </button>

              <button
                type="button"
                onClick={() => {
                  setPageOverlay("dropbox");
                  setShowImportOverlay(false);
                }}
                className="rounded cursor-pointer flex items-center mono uppercase gap-2 text-xs tracking-tight lime-one px-4 py-2 text-black hover:bg-blue-600"
              >
                <SiDropbox className="inline-block h-4 w-4 mr-1" />
                Dropbox
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pageOverlay ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded border border-white/10 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm mono uppercase tracking-tight text-black">
                  {pageOverlay === "google-drive" ? "Google Drive" : "Dropbox"}
                </h2>
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="border-b border-black/20 bg-white px-3 py-1 text-sm text-black outline-none focus:ring-2 focus:rounded focus:ring-blue-500"
              />
            </div>

            <div className="mt-4 text-sm text-slate-700">
              {cloudError ? (
                <div className="rounded border border-red-200 bg-red-50 p-1 mono tracking-tight text-sm text-red-700">
                  {cloudError}
                </div>
              ) : loadingCloudItems ? (
                <div className="rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-700">
                  Loading files…
                </div>
              ) : cloudItems.length === 0 ? (
                <div className="rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-700">
                  No files found.
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <button
                      type="button"
                      disabled={folderStack.length === 0}
                      onClick={() => {
                        const previousFolder =
                          folderStack[folderStack.length - 1];
                        if (!previousFolder) {
                          return;
                        }
                        setFolderStack((current) => current.slice(0, -1));
                        setCurrentFolder(previousFolder);
                        const controller = new AbortController();
                        void Promise.resolve().then(() =>
                          loadCloudItems(
                            pageOverlay,
                            controller,
                            previousFolder.id,
                          ),
                        );
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] uppercase tracking-tight text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Back
                    </button>
                    <span className="mono tracking-tight">
                      {currentFolder?.name ??
                        (pageOverlay === "dropbox" ? "Dropbox" : "My Drive")}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center text-xs text-slate-500 overflow-y-auto min-h-50">
                    {cloudItems.map((item, index) => (
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
                                id: pageOverlay === "dropbox" ? "" : "root",
                                name:
                                  pageOverlay === "dropbox"
                                    ? "Dropbox"
                                    : "My Drive",
                              },
                            ]);
                            setCurrentFolder(folder);
                            const controller = new AbortController();
                            void Promise.resolve().then(() =>
                              loadCloudItems(
                                pageOverlay,
                                controller,
                                folder.id,
                              ),
                            );
                            return;
                          }

                          setSelectedCloudIndex(index);
                        }}
                        className={`flex h-32 cursor-pointer aspect-square flex-col items-center justify-center rounded border px-2 py-2 text-left transition ${
                          selectedCloudIndex === index
                            ? "border-blue-500 bg-blue-50 text-slate-900"
                            : "border-dashed border-slate-300 bg-white text-slate-600"
                        }`}
                      >
                        {item.fileType === "image" ? (
                          <span className="mb-2 flex h-20 w-full items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-100">
                            {item.thumbnailUrl ? (
                              <span
                                aria-label={`${item.name} thumbnail`}
                                className="block h-full w-full bg-cover bg-center bg-no-repeat"
                                role="img"
                                style={{
                                  backgroundImage: `url("${item.thumbnailUrl}")`,
                                }}
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-slate-400" />
                            )}
                          </span>
                        ) : (
                          <span className="mb-2 flex h-20 w-full flex-col items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 text-slate-400">
                            {item.fileType === "folder" ? (
                              <Folder className="h-7 w-7" strokeWidth={1.5} />
                            ) : (
                              <FileText className="h-7 w-7" strokeWidth={1.5} />
                            )}
                            <span className="text-[10px] uppercase tracking-[0.18em]">
                              {item.fileType === "folder" ? "Folder" : "File"}
                            </span>
                          </span>
                        )}
                        <span className="w-full truncate text-center text-[11px] font-semibold leading-5">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center w-full justify-between">
              <p className="text-xs mono mt-2 ">
                Current folder:{" "}
                {currentFolder?.name ??
                  (pageOverlay === "google-drive" ? "My Drive" : "Dropbox")}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPageOverlay(null)}
                  className="rounded cursor-pointer bg-black/20 px-3 py-1 text-sm text-black mono tracking-tight hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCloudIndex === null) {
                      return;
                    }

                    const selected = cloudItems[selectedCloudIndex];
                    if (selected.fileType !== "image") {
                      return;
                    }

                    const queryParam =
                      pageOverlay === "dropbox"
                        ? `path=${encodeURIComponent(selected.path ?? selected.id)}`
                        : `fileId=${encodeURIComponent(selected.id)}`;

                    void (async () => {
                      try {
                        const response = await fetch(
                          `/api/integrations/${pageOverlay}/download?${queryParam}`,
                        );

                        if (!response.ok) {
                          const payload = await response
                            .json()
                            .catch(() => null);
                          setCloudError(
                            payload?.error || "Unable to download cloud file.",
                          );
                          return;
                        }

                        const blob = await response.blob();
                        const fileName =
                          response.headers.get("x-file-name") || selected.name;
                        const file = new File([blob], fileName, {
                          type:
                            blob.type ||
                            selected.mimeType ||
                            "application/octet-stream",
                        });

                        window.dispatchEvent(
                          new CustomEvent("canvasai:file-import", {
                            detail: { files: [file] },
                          }),
                        );
                        setPageOverlay(null);
                      } catch (err) {
                        setCloudError(
                          err instanceof Error
                            ? err.message
                            : "Unable to download cloud file.",
                        );
                      }
                    })();
                  }}
                  disabled={selectedCloudIndex === null}
                  className="rounded cursor-pointer bg-blue-600 px-3 py-1 text-sm text-white tracking-tight mono hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Import
                </button>
              </div>
            </div>
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
