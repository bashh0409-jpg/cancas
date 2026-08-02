"use client";

import {
  Search,
  X,
  Loader2,
  Folder,
  File,
  ImageIcon,
  ArrowLeft,
  Download,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type CloudFileType = "folder" | "image" | "file";

type CloudFileItem = {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  fileType: CloudFileType;
  size?: number;
  path?: string;
  thumbnailUrl?: string;
};

type CloudFolder = {
  id: string;
  name: string;
};

type CloudBrowserProps = {
  providerId: string;
  providerName: string;
  onImportCloudFile: (file: File) => Promise<void>;
  onBack: () => void;
  onClose: () => void;
};

function formatFileSize(size?: number) {
  if (!size || size <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let current = size;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(1)} ${units[index]}`;
}

export function CloudBrowser({
  providerId,
  providerName,
  onImportCloudFile,
  onBack,
  onClose,
}: CloudBrowserProps) {
  const [currentFolder, setCurrentFolder] = useState<CloudFolder>({
    id: "root",
    name: providerName,
  });
  const [folderStack, setFolderStack] = useState<CloudFolder[]>([]);
  const [items, setItems] = useState<CloudFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [thumbnailFallbackUrls, setThumbnailFallbackUrls] = useState<
    Record<string, string>
  >({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchFolder = useCallback(
    async (folderId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const apiPath =
          providerId === "dropbox"
            ? `/api/integrations/dropbox/list?path=${encodeURIComponent(folderId === "root" ? "" : folderId)}`
            : `/api/integrations/google-drive/list?folderId=${encodeURIComponent(folderId)}`;

        const res = await fetch(apiPath);
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Failed to load files");
        }
        const data = (await res.json()) as {
          folder: CloudFolder;
          items: CloudFileItem[];
        };
        setItems(data.items);
        setCurrentFolder(data.folder);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load folder contents",
        );
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [providerId],
  );

  // Fetch root folder on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiPath =
          providerId === "dropbox"
            ? `/api/integrations/dropbox/list?path=${encodeURIComponent("")}`
            : `/api/integrations/google-drive/list?folderId=${encodeURIComponent("root")}`;

        const res = await fetch(apiPath);
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Failed to load files");
        }
        const data = (await res.json()) as {
          folder: CloudFolder;
          items: CloudFileItem[];
        };
        if (cancelled) return;
        setItems(data.items);
        setCurrentFolder(data.folder);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load folder contents",
        );
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const navigateToFolder = (folder: CloudFileItem) => {
    setFolderStack((prev) => [...prev, currentFolder]);
    const folderId = providerId === "dropbox" ? (folder.path ?? folder.name) : folder.id;
    void fetchFolder(folderId);
    setSearchQuery("");
  };

  const navigateBack = () => {
    const prev = folderStack[folderStack.length - 1];
    if (prev) {
      setFolderStack((prevStack) => prevStack.slice(0, -1));
      const folderId = providerId === "dropbox" ? (prev.id === "root" ? "" : prev.id) : prev.id;
      void fetchFolder(folderId);
      setSearchQuery("");
    } else {
      onBack();
    }
  };

  const handleImport = async (item: CloudFileItem) => {
    if (item.isFolder) return;
    setImportingId(item.id);
    try {
      let downloadUrl: string;
      if (providerId === "dropbox") {
        downloadUrl = `/api/integrations/dropbox/download?path=${encodeURIComponent(item.path ?? item.name)}`;
      } else {
        downloadUrl = `/api/integrations/google-drive/download?fileId=${item.id}`;
      }

      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Failed to download file");

      const blob = await res.blob();
      const fileName = item.name;
      const ts = new Date().getTime();
      const file = Object.assign(blob, {
        name: fileName,
        lastModified: ts,
      }) as unknown as File;
      await onImportCloudFile(file);
    } catch (err) {
      console.error("Import failed:", err);
      setError(err instanceof Error ? err.message : "Failed to import file");
    } finally {
      setImportingId(null);
    }
  };

  // Filter items by search query (client-side filtering)
  const filteredItems = searchQuery.trim()
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  // Separate folders and files, sort alphabetically
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="w-60 h-screen bg-[#212126] border-white/10 p-4 flex flex-col overflow-y-auto">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-2 mb-2">
        <button
          onClick={navigateBack}
          className="text-white/60 cursor-pointer hover:text-white transition flex items-center gap-1 text-xs mono uppercase tracking-tight"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          onClick={onClose}
          className="text-white/60 cursor-pointer hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      {/* Current folder path */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-[10px] mono uppercase tracking-tight text-white/50 truncate">
          <Folder className="w-3 h-3 shrink-0" />
          <span className="truncate">{currentFolder.name}</span>
        </div>
      </div>

      {/* Search input */}
      <div className="mb-3">
        <div className="w-full gap-2 px-1 flex bg-white/10 items-center rounded-xs border border-white/20 text-white">
          <Search className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files..."
            className="w-full h-full py-1 text-xs uppercase text-white mono tracking-tight placeholder-white/40 focus:outline-none focus:border-none focus:ring-0 bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-white/40 hover:text-white/70 transition cursor-pointer"
            >
              <X className="w-3 h-3" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 mono uppercase tracking-tight rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedItems.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[10px] mono uppercase tracking-tight text-white/40">
            {searchQuery.trim()
              ? "No matching files found."
              : "This folder is empty."}
          </p>
        </div>
      )}

      {/* File list */}
      {!isLoading && sortedItems.length > 0 && (
        <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hidden">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-xs px-1 py-1.5 transition hover:bg-white/10"
            >
              {/* Icon / Thumbnail */}
              <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded border border-white/10 overflow-hidden bg-[#1a1a1e]">
                {item.isFolder ? (
                  <FolderOpen className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                ) : item.thumbnailUrl || thumbnailFallbackUrls[item.id] ? (
                  <img
                    src={item.thumbnailUrl ?? thumbnailFallbackUrls[item.id]}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => {
                      if (item.fileType === "image") {
                        setThumbnailFallbackUrls((current) => ({
                          ...current,
                          [item.id]:
                            providerId === "dropbox"
                              ? `/api/integrations/dropbox/download?path=${encodeURIComponent(
                                  item.path ?? item.name,
                                )}`
                              : `/api/integrations/google-drive/download?fileId=${encodeURIComponent(
                                  item.id,
                                )}`,
                        }));
                      }
                    }}
                  />
                ) : item.fileType === "image" ? (
                  <ImageIcon className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                ) : (
                  <File className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                )}
              </div>

              {/* Name + size */}
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => {
                    if (item.isFolder) navigateToFolder(item);
                    else void handleImport(item);
                  }}
                  className="w-full text-left"
                >
                  <p className="truncate text-[11px] mono uppercase tracking-tight text-white/80">
                    {item.name}
                  </p>
                  {!item.isFolder && item.size != null && item.size > 0 && (
                    <p className="text-[9px] mono text-white/40">
                      {formatFileSize(item.size)}
                    </p>
                  )}
                </button>
              </div>

              {/* Action */}
              <div className="shrink-0">
                {item.isFolder ? (
                  <ChevronRight
                    className="w-3.5 h-3.5 text-white/30"
                    strokeWidth={1.5}
                  />
                ) : (
                  <button
                    onClick={() => void handleImport(item)}
                    disabled={importingId === item.id}
                    className="opacity-0 group-hover:opacity-100 transition cursor-pointer text-white/50 hover:text-white p-0.5"
                    title="Import to canvas"
                  >
                    {importingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}