"use client";

import {
  AudioLines,
  Bot,
  FileText,
  Folder,
  ImageIcon,
  Import,
  Server,
  Square,
  StickyNote,
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
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      type="button"
      onClick={onClick}
      className={[
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded border transition",
        active
          ? "border-red-500/30 bg-red-500 text-white shadow-[0_0_0_4px_rgba(239,68,68,0.14)]"
          : "border-black/10 bg-white text-black hover:bg-zinc-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function FloatingToolbox() {
  const [isRecording, setIsRecording] = useState(false);
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
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function handleToggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      startedAtRef.current = Date.now();
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
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

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
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
        className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded border border-black/10 bg-white/90 p-0.5 shadow-[0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur-xl"
        role="toolbar"
      >
        <ToolboxButton label="Add sticky note" onClick={activateCanvasTextTool}>
          <StickyNote className="h-5 w-5 rotate-90" strokeWidth={1.5} />
        </ToolboxButton>
        <ToolboxButton
          label="Upload files"
          onClick={() => setShowImportOverlay(true)}
        >
          <Import className="h-5 w-5 " strokeWidth={1.5} />
        </ToolboxButton>

        <ToolboxButton
          active={isRecording}
          label={
            isRecording ? "Stop recording voice note" : "Record voice note"
          }
          onClick={handleToggleRecording}
        >
          {isRecording ? (
            <Square className="h-4 w-4 fill-current" strokeWidth={1.5} />
          ) : (
            <AudioLines className="h-5 w-5" strokeWidth={1.5} />
          )}
        </ToolboxButton>

        <ToolboxButton label="AI Chat" onClick={activateCanvasAiChatTool}>
          <Bot className="h-5 w-5" strokeWidth={1.5} />
        </ToolboxButton>
      </div>

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
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded cursor-pointer flex items-center mono uppercase gap-2 text-xs tracking-tight lime-one px-4 py-2 text-black hover:bg-blue-600"
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
              <p className="text-xs mono mt-2 ">Current folder:{" "}
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
