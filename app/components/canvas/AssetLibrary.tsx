"use client";

import {
  ImageIcon,
  Loader2,
  Trash2,
  X,
  FileText,
  Upload,
  ArrowLeft,
  Library,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryAsset } from "@/lib/canvas/assetLibrary";

type AssetLibraryProps = {
  onClose: () => void;
  onImportToCanvas: (assets: LibraryAsset[]) => void;
};

export function AssetLibrary({
  onClose,
  onImportToCanvas,
}: AssetLibraryProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/library");

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to load library assets");
      }

      const data = (await response.json()) as { assets: LibraryAsset[] };
      setAssets(data.assets ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load library assets",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/library")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data: { error?: string }) => {
            throw new Error(data.error ?? "Failed to load library assets");
          });
        }
        return res.json() as Promise<{ assets: LibraryAsset[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setAssets(data.assets ?? []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load library assets",
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleUploadFiles(fileList: FileList) {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    let hasError = false;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/library", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to upload file");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to upload ${file.name}`,
        );
        hasError = true;
      }
    }

    if (!hasError) {
      await loadAssets();
    }

    setIsUploading(false);
  }

  async function handleDeleteAsset(assetId: string, event: React.MouseEvent) {
    event.stopPropagation();

    setDeletingIds((prev) => new Set(prev).add(assetId));

    try {
      const response = await fetch(`/api/library/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete asset");
      }

      setAssets((current) => current.filter((a) => a.id !== assetId));
      setSelectedIndices(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete asset",
      );
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
    }
  }

  function handleImportSelected() {
    const selected = Array.from(selectedIndices).map((i) => assets[i]);
    if (selected.length === 0) return;
    onImportToCanvas(selected);
    onClose();
  }

  return (
    <>
      <div className="flex items-center justify-between pb-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 cursor-pointer hover:text-white transition flex items-center gap-1 text-xs mono uppercase tracking-tight"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Back
          </button>
          <h3 className="text-white flex items-center gap-2 text-xs mono uppercase tracking-tight">
            <Library className="w-3.5 h-3.5" strokeWidth={1.25} />
            Asset Library
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/60 cursor-pointer hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      {/* Upload button */}
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 w-full rounded border border-dashed border-white/20 bg-[#1a1a1e] p-1.5 mb-3 lime transition hover:border-white/40 hover:bg-white/5 cursor-pointer disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white/60" />
        ) : (
          <Upload className="w-4 h-4 hidden text-white/60" strokeWidth={1.5} />
        )}
        <span className="mono text-xs tracking-tight text-black uppercase">
          {isUploading ? "Uploading..." : "Upload to Library"}
        </span>
      </button>

      {/* Error */}
      {error && (
        <div className="mb-3 mono uppercase tracking-tight rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col mono uppercase tracking-tight items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
          <span className="text-xs text-white/60 mt-4">Loading library...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && assets.length === 0 && !error && (
        <div className="flex flex-1 flex-col items-center justify-center text-center px-2 py-8">
          <Library className="mb-3 h-8 w-8 text-white/20" strokeWidth={1} />
          <p className="text-[10px] mono uppercase tracking-tight text-white/40">
            Your library is empty.
          </p>
          <p className="text-[9px] mono uppercase tracking-tight text-white/20 mt-1">
            Upload images to reuse across canvases.
          </p>
        </div>
      )}

      {/* Assets grid */}
      {!isLoading && assets.length > 0 && (
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset, index) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  setSelectedIndices((prev) => {
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
                  selectedIndices.has(index)
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 bg-[#1a1a1e] hover:border-white/30"
                }`}
              >
                {asset.file_type === "image" ? (
                  <img
                    src={asset.thumbnail_url ?? asset.public_url}
                    alt={asset.file_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                    <FileText
                      className="h-6 w-6 text-white/30"
                      strokeWidth={1.5}
                    />
                    <span className="text-[10px] uppercase tracking-tight text-white/50 mono">
                      {asset.file_type}
                    </span>
                  </div>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteAsset(asset.id, e)}
                  disabled={deletingIds.has(asset.id)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/80 disabled:opacity-50"
                >
                  {deletingIds.has(asset.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin text-white" />
                  ) : (
                    <Trash2 className="h-3 w-3 text-white" strokeWidth={1.5} />
                  )}
                </button>

                {/* Filename overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate mono text-[10px] text-white/80">
                    {asset.file_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedIndices.size > 0 && (
        <div className="mt-1">
          <p className="text-[10px] mono uppercase tracking-tight text-white/50">
            {selectedIndices.size} file
            {selectedIndices.size > 1 ? "s" : ""} selected
          </p>
        </div>
      )}
      {/* Import selected button */}
      {selectedIndices.size > 0 && (
        <div className="mt-auto pt-1">
          <button
            type="button"
            onClick={handleImportSelected}
            className="w-full cursor-pointer rounded lime px-3 py-1.5 text-xs mono uppercase tracking-tight text-black transition"
          >
            Import to Canvas{" "}
            {selectedIndices.size > 1 ? `(${selectedIndices.size})` : ""}
          </button>
        </div>
      )}

      {/* Hidden file input for uploading */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.currentTarget.files;
          if (files && files.length > 0) {
            void handleUploadFiles(files);
          }
          event.currentTarget.value = "";
        }}
      />
    </>
  );
}