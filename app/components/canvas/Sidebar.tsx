import {
  Search,
  Settings,
  Layers,
  Download,
  HelpCircle,
  Lock,
  X,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Maximize2,
  Grid2x2,
  ZoomIn,
  ZoomOut,
  Cable,
  Loader2,
  ExternalLink,
  Folder,
  FileText,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useLayersStore } from "@/lib/canvas/layersStore";
import { useViewControlsStore } from "@/lib/canvas/viewControlsStore";
import { useAiSettingsStore, ELEVENLABS_VOICES } from "@/lib/canvas/aiSettingsStore";
import type { CanvasGridLineType } from "@/types/canvas";
import { SiGoogledrive, SiDropbox } from "@icons-pack/react-simple-icons";

type PanelType =
  | "search"
  | "tools"
  | "export"
  | "layers"
  | "connect"
  | "settings"
  | "help"
  | null;

type GridControlsValue = {
  enabled: boolean;
  color: string;
  background: string;
  lineType: CanvasGridLineType;
  size: number;
};

type SidebarProps = {
  gridSettings: GridControlsValue;
  onGridSettingsChange: (updates: Partial<GridControlsValue>) => void;
  onImportCloudFile: (file: File) => Promise<void>;
  onClosePanel?: () => void;
  canvasName?: string;
  activeCanvasId?: string;
  canvases?: { id: string; name: string; slug: string }[];
  onRename?: (name: string) => void | Promise<void>;
  onSwitchCanvas?: (slug: string) => void;
};

// Canvas switcher popup — styled like the home account card
const CanvasSwitcherOverlay = ({
  canvasName,
  activeCanvasId,
  canvases,
  onRename,
  onSwitchCanvas,
}: {
  canvasName?: string;
  activeCanvasId?: string;
  canvases?: { id: string; name: string; slug: string }[];
  onRename?: (name: string) => void | Promise<void>;
  onSwitchCanvas?: (slug: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(canvasName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: -6, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.18,
        ease: "power2.out",
      },
    );
  }, []);

  useEffect(() => {
    setDraftName(canvasName ?? "");
  }, [canvasName]);

  const handleSaveName = async () => {
    const trimmed = draftName.trim() || "Untitled";

    if (!onRename) {
      setEditing(false);
      return;
    }

    if (trimmed === canvasName) {
      setEditing(false);
      return;
    }

    setIsSaving(true);
    setEditing(false);

    try {
      await onRename(trimmed);
      setDraftName(trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="absolute left-12 top-0 z-[60] w-[240px] overflow-hidden rounded border border-white/5 bg-[#212126] shadow-2xl"
    >
      {/* Current canvas */}
      <div className=" px-3 py-1">
        <div className="flex mono tracking-tight  items-center gap-2.5">

          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => void handleSaveName()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSaveName();
                  }
                  if (e.key === "Escape") {
                    setEditing(false);
                    setDraftName(canvasName ?? "");
                  }
                }}
                className="w-full cursor-pointer  mono tracking-tight rounded border border-white/20 bg-[#17171b] px-2 py-1 text-xs text-white mono outline-none focus:border-white/40"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full truncate cursor-pointer text-left text-xs font-medium leading-tight text-white transition hover:text-white/80"
                title="Click to rename"
              >
                {isSaving ? "Saving…" : canvasName}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Switch canvas */}
      {canvases && canvases.length > 0 ? (
        <div className="max-h-52 hidden overflow-y-auto px-3 py-2.5">
          <p className="mb-2 text-[10px] mono uppercase tracking-wider text-white/40">
            Switch canvas
          </p>
          <div className="flex flex-col gap-0.5">
            {canvases.map((canvas) => {
              const isActive = canvas.id === activeCanvasId;

              return (
                <a
                  key={canvas.id}
                  href={`/canvas/${canvas.slug}`}
                  onClick={(e) => {
                    if (onSwitchCanvas) {
                      e.preventDefault();
                      onSwitchCanvas(canvas.slug);
                    }
                  }}
                  className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs mono transition ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="truncate">{canvas.name}</span>
                  {isActive ? (
                    <span className="shrink-0 text-[9px] uppercase tracking-wide text-lime-300">
                      Current
                    </span>
                  ) : null}
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 text-xs mono text-white/50">
          No other canvases yet
        </div>
      )}

      {/* Back to workspace */}
      <div className="border-t border-white/10 px-3 py-1">
        <a
          href="/home"
          className="text-xs mono tracking-tight  hover:bg-white/10 text-white/60 underline transition hover:text-white"
        >
          Back to files
        </a>
      </div>
    </div>
  );
};
// Tooltip Component
const Tooltip = ({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative group">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#212126] text-white text-[11px] rounded  mono uppercase py-1 px-2 whitespace-nowrap pointer-events-none z-50">
          {text}
        </div>
      )}
    </div>
  );
};

// Icon Button Component
const IconButton = ({
  icon: Icon,
  tooltip,
  onClick,
  isActive,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tooltip: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}) => (
  <Tooltip text={tooltip}>
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 rounded items-center justify-center cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-30 ${
        isActive ? "lime text-black" : "hover:bg-white/20 hover:text-white"
      }`}
    >
      <Icon
        strokeWidth={1.25}
        className={`w-5 h-5 ${isActive ? "text-black" : "text-white/60"} transition`}
      />
    </button>
  </Tooltip>
);

// Search Panel Component
const SearchPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="w-60 h-screen bg-[#212126] p-4 flex flex-col gap-4">
    <div className="flex items-center justify-between  pb-2">
      <h3 className="text-white text-xs mono uppercase tracking-tight ">
        Search
      </h3>
      <button
        onClick={onClose}
        className="text-white/60 cursor-pointer hover:text-white transition"
      >
        <X className="w-4 cursor-pointer h-4" strokeWidth={1.25} />
      </button>
    </div>

    <input
      type="text"
      placeholder="Search files, layers..."
      className="bg-white/10 my-1 w-full border border-white/20 rounded-xs px-1 py-1 text-sm text-white mono tracking-tight placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
    />

    <div className="space-y-2">
      <h4 className="text-white/60 text-xs mono uppercase">Recent Searches</h4>

      <div className="">
        <p className="text-white/40 mono text-sm">No recent searches.</p>
      </div>
    </div>
  </div>
);

// Tools Panel Component
const ToolsPanel = ({
  gridSettings,
  onClose,
  onGridSettingsChange,
}: {
  gridSettings: GridControlsValue;
  onClose: () => void;
  onGridSettingsChange: (updates: Partial<GridControlsValue>) => void;
}) => {
  return (
    <div className="w-60 h-screen bg-[#212126]  p-4 flex flex-col gap-4 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between  pb-2     ">
        <h3 className="text-white text-xs  mono uppercase tracking-tight">
          Canvas Settings
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 cursor-pointer hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Grid Control Section */}
        <div className="rounded mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white/60 text-xs  mono uppercase">
              Grid
            </label>
            <input
              type="checkbox"
              checked={gridSettings.enabled}
              onChange={(e) =>
                onGridSettingsChange({ enabled: e.target.checked })
              }
              className="w-4 h-4 cursor-pointer"
            />
          </div>

          {gridSettings.enabled && (
            <>
              {/* Grid Size */}
              <div className="space-y-1">
                <label className="text-white/50 mono text-xs uppercase">
                  Size: {gridSettings.size}px
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={gridSettings.size}
                  onChange={(e) =>
                    onGridSettingsChange({
                      size: parseInt(e.target.value),
                    })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <ColorField
                label="Line Color"
                value={gridSettings.color}
                onChange={(color) => onGridSettingsChange({ color })}
              />

              <ColorField
                label="Canvas Background"
                value={gridSettings.background}
                onChange={(background) => onGridSettingsChange({ background })}
              />

              {/* Line Type */}
              <div className="space-y-1">
                <label className="text-white/50 mono text-xs uppercase">
                  Line Style
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onGridSettingsChange({ lineType: "solid" })}
                    className={`flex-1 px-2  tracking-tight py-1 rounded-xs text-xs  transition ${
                      gridSettings.lineType === "solid"
                        ? "lime text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    Solid
                  </button>

                  <button
                    onClick={() => onGridSettingsChange({ lineType: "dotted" })}
                    className={`flex-1 px-2 py-1 w-fit tracking-tight rounded-xs text-xs  transition ${
                      gridSettings.lineType === "dotted"
                        ? "lime text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    Dotted
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function toColorInputValue(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
}

function normalizeHexInput(value: string) {
  return value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
}

const ColorField = ({ label, value, onChange }: ColorFieldProps) => {
  const [draftHex, setDraftHex] = useState(() =>
    value.replace("#", "").toUpperCase(),
  );

  useEffect(() => {
    setDraftHex(value.replace("#", "").toUpperCase());
  }, [value]);

  return (
    <label className="block space-y-1.5">
      <span className="text-white/50 mono text-xs uppercase">{label}</span>
      <div className="group flex h-8 items-center gap-2 rounded-xs border border-white/10 bg-[#17171b] py-1.5 px-1 transition focus-within:border-white/30 focus-within:bg-[#1b1b20]">
        <span className="relative h-6 w-7 shrink-0 overflow-hidden rounded-xs border border-white/15 bg-black/20 shadow-inner">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: toColorInputValue(value) }}
          />
          <input
            aria-label={label}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            type="color"
            value={toColorInputValue(value)}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </span>

        <span className="font-mono text-xs text-white/30">#</span>
        <input
          aria-label={`${label} hex`}
          className="min-w-0 flex-1 bg-transparent p-0 font-mono text-xs uppercase tracking-normal text-white/85 outline-none placeholder:text-white/25"
          maxLength={6}
          spellCheck={false}
          type="text"
          value={draftHex}
          onBlur={() => setDraftHex(value.replace("#", "").toUpperCase())}
          onChange={(event) => {
            const nextHex = normalizeHexInput(event.currentTarget.value);

            setDraftHex(nextHex.toUpperCase());

            if (nextHex.length === 6) {
              onChange(`#${nextHex}`);
            }
          }}
        />
      </div>
    </label>
  );
};

// Export Panel Component
const ExportPanel = ({ onClose }: { onClose: () => void }) => {
  const [exportFormat, setExportFormat] = React.useState("PNG");

  return (
    <div className="w-60 h-screen bg-[#212126]  border-white/10 p-4 flex flex-col gap-4">
      <div className="flex items-center  pb-2 justify-between mb-2">
        <h3 className="text-white text-xs uppercase tracking-tight mono">
          Export & Share
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 cursor-pointer  hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      {/* Export Format Dropdown */}
      <div className="space-y-3 ">
        <div className="flex items-center w-full justify-between">
          <label className="text-white/60 text-xs tracking-tight mono uppercase block">
            Format
          </label>
        </div>

        {/* Export Options */}
        <div className="flex justify-between border-b border-white/10 pb-4 gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className=" bg-[#1a1a1e] border border-white/20 rounded px-1 mono text-xs text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 cursor-pointer"
          >
            <option value="PNG">PNG</option>
            <option value="SVG">SVG</option>
            <option value="PDF">PDF</option>
            <option value="WebP">WebP</option>
            <option value="JPEG">JPEG</option>
          </select>
          <button className="w-fit cursor-pointer px-2 py-1 rounded-xs lime text-black text-xs hover:bg-white/90 transition">
            Export
          </button>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="mono tracking-tight rounded ">
        <label className="text-white/60 text-xs mono uppercase block mb-2">
          Recent
        </label>
        <div className="text-xs text-white/50">No exports yet</div>
      </div>
    </div>
  );
};
type Provider = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  connected?: boolean;
  loading?: boolean;
};

type CloudFileType = "folder" | "image" | "other";

type CloudFileItem = {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  fileType: CloudFileType;
  size?: number;
  path?: string;
};

type CloudFolder = {
  id: string;
  name: string;
};

type CloudBrowserProps = {
  providerId: string;
  providerName: string;
  connected: boolean;
  onConnect: () => void;
  onImportCloudFile?: (file: File) => Promise<void>;
};

function formatFileSize(size?: number) {
  if (!size || size <= 0) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let current = size;

  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }

  return `${current.toFixed(1)} ${units[index]}`;
}

function getItemIcon(fileType: CloudFileType, isFolder: boolean) {
  if (isFolder) {
    return <Folder className="h-4 w-4" />;
  }

  if (fileType === "image") {
    return <ImageIcon className="h-4 w-4" />;
  }

  return <FileText className="h-4 w-4" />;
}

function isImageFile(file: CloudFileItem) {
  return file.fileType === "image";
}

function getProviderRootFolder(providerId: string): CloudFolder {
  return providerId === "dropbox"
    ? { id: "", name: "Dropbox" }
    : { id: "root", name: "My Drive" };
}

function CloudBrowser({
  providerId,
  providerName,
  connected,
  onConnect,
  onImportCloudFile,
}: CloudBrowserProps) {
  const [folderStack, setFolderStack] = useState<CloudFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<CloudFolder>(
    getProviderRootFolder(providerId),
  );
  const [items, setItems] = useState<CloudFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const rootFolder = getProviderRootFolder(providerId);

  useEffect(() => {
    setFolderStack([]);
    setCurrentFolder(rootFolder);
    setItems([]);
    setError(null);

    if (connected) {
      void loadFolder(rootFolder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, connected]);

  async function loadFolder(folder: CloudFolder) {
    setLoading(true);
    setError(null);

    try {
      const queryParam =
        providerId === "dropbox"
          ? `path=${encodeURIComponent(folder.id)}`
          : `folderId=${encodeURIComponent(folder.id)}`;
      const res = await fetch(
        `/api/integrations/${providerId}/list?${queryParam}`,
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.error || "Unable to load cloud storage contents.",
        );
      }

      const data = await res.json();

      setCurrentFolder({
        id: data.folder.id,
        name: data.folder.name,
      });
      setItems(data.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load cloud storage contents.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFolder(item: CloudFileItem) {
    if (!item.isFolder) {
      return;
    }

    setFolderStack((current) => [...current, currentFolder]);
    void loadFolder({ id: item.id, name: item.name });
  }

  function handleGoBack() {
    const previous = folderStack[folderStack.length - 1];

    if (!previous) {
      return;
    }

    setFolderStack((current) => current.slice(0, -1));
    void loadFolder(previous);
  }

  async function handleImport(item: CloudFileItem) {
    if (!onImportCloudFile || !isImageFile(item)) {
      return;
    }

    setImportingId(item.id);

    try {
      const queryParam =
        providerId === "dropbox"
          ? `path=${encodeURIComponent(item.path ?? item.id)}`
          : `fileId=${encodeURIComponent(item.id)}`;
      const response = await fetch(
        `/api/integrations/${providerId}/download?${queryParam}`,
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Unable to download cloud file.");
      }

      const blob = await response.blob();
      const fileName =
        response.headers.get("x-file-name") ?? item.name ?? "cloud-file";
      const file = new File([blob], fileName, {
        type: blob.type || item.mimeType || "application/octet-stream",
      });

      await onImportCloudFile(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to import cloud file.",
      );
    } finally {
      setImportingId(null);
    }
  }

  if (!connected) {
    return (
      <div className="rounded border border-white/10 bg-[#17171b] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs mono uppercase tracking-wide text-white/50">
              {providerName}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-white">
              Connect to browse files
            </h3>
          </div>
          <button
            type="button"
            onClick={onConnect}
            className="rounded bg-lime-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-lime-300"
          >
            Connect
          </button>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-white/50">
          Link your cloud storage account to browse files and import images
          directly into the canvas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-white/10 bg-[#17171b] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs mono uppercase tracking-wide text-white/50">
            {providerName}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">
            {currentFolder.name}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {folderStack.length > 0 ? (
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void loadFolder(currentFolder)}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
          >
            Reload
          </button>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-white/50">
        Only image files can be imported to the canvas from cloud storage.
      </p>

      {error ? (
        <div className="mt-4 rounded border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <div className="rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
            Loading files…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
            No files found in this folder.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_auto] gap-3 rounded border border-white/10 bg-white/5 p-3"
              >
                <button
                  type="button"
                  onClick={() => handleSelectFolder(item)}
                  disabled={!item.isFolder}
                  className="flex items-start gap-3 text-left"
                >
                  <div className="grid h-9 w-9 place-items-center rounded bg-black/20 text-white/70">
                    {getItemIcon(item.fileType, item.isFolder)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-white/50">
                      {item.isFolder
                        ? "Folder"
                        : `${item.mimeType} ${formatFileSize(item.size)}`}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  {item.isFolder ? (
                    <button
                      type="button"
                      onClick={() => handleSelectFolder(item)}
                      className="rounded border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
                    >
                      Open
                    </button>
                  ) : isImageFile(item) ? (
                    <button
                      type="button"
                      onClick={() => void handleImport(item)}
                      disabled={Boolean(importingId)}
                      className="rounded bg-lime-400 px-3 py-2 text-[11px] font-semibold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {importingId === item.id ? "Importing…" : "Import"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/40"
                    >
                      Unsupported
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const initialProviders: Provider[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Import and sync canvas files",
    icon: SiGoogledrive,
    connected: false,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Access cloud storage files",
    icon: SiDropbox,
    connected: false,
  },
];

export const ConnectPanel = ({
  onClose,
  onImportCloudFile,
}: {
  onClose: () => void;
  onImportCloudFile: (file: File) => Promise<void>;
}) => {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    try {
      window.location.href = `/api/integrations/${providerId}/connect`;
    } catch (error) {
      console.error("Failed to connect provider:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/integrations/status`);
        if (!res.ok) return;
        const json = await res.json();
        const connected = json.connected || {};

        if (!mounted) return;

        setProviders((prev) =>
          prev.map((p) => {
            const key = p.id.replace(/-/g, "_");
            return { ...p, connected: Boolean(connected[key]) };
          }),
        );
      } catch (err) {
        // ignore
      }
    }

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-60 h-screen bg-[#212126] border-white/10 p-4 flex flex-col">
      <div className="flex items-center scrollbar-hidden   pb-2 justify-between mb-2">
        <h3 className="text-white text-xs  mono  uppercase tracking-tight">
          External storage
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 cursor-pointer  hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      {/* Providers */}
      <div className="flex flex-col gap-6 mt-4">
        {providers.map((provider) => {
          const Icon = provider.icon;

          return (
            <div
              key={provider.id}
              className="group  rounded w-full  hover:border-white/20 transition"
            >
              <div className=" flex items-start gap-2">
                {/* Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded border-white/10 shrink-0">
                  <Icon className="w-5 h-5 text-white/80" />
                </div>

                {/* Content */}
                <div className=" w-full min-w-0 ">
                  <div className="flex items-center w-full justify-between ">
                    <div className="text-sm gap-3 w-full items-center justify-between flex text-white mono uppercase tracking-tight truncate">
                      <p className="text-xs">{provider.name} </p>
                      <p>
                        {provider.connected && (
                          <span className="uppercase w-full justify-between flex items-center gap-2 mono  text-lime-300 text-xs uppercase tracking-wide">
                          connected
                             <Cable className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center gap-2 mt-3">
                    <p></p><button
                      onClick={() => handleConnect(provider.id)}
                      disabled={provider.loading}
                      className={`
                        h-8 px-3 rounded mono tracking-tight text-xs font-medium transition cursor-pointer
                        flex items-center gap-2
                        ${
                          provider.connected
                            ? "bg-white/20 text-white hover:bg-white/15"
                            : "lime text-black hover:opacity-90"
                        }
                      `}
                    >
                      {provider.loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : provider.connected ? (
                        <>
                          Manage 
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <Cable className="w-3.5 h-3.5" />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 ">
        <p className="text-[10px] uppercase tracking-tight mono text-white">
          Secure OAuth connections. Files remain in your cloud storage unless
          explicitly imported.
        </p>
      </div>
    </div>
  );
};

// Layers Panel Component
const LayersPanel = ({ onClose }: { onClose: () => void }) => {
  const {
    layers,
    selectedLayerId,
    selectLayer,
    toggleLayerVisibility,
    toggleLayerLocked,
    renameLayer,
    deleteLayer,
  } = useLayersStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleRename = (id: string, newName: string) => {
    const trimmedName = newName.trim();

    if (trimmedName) {
      renameLayer(id, trimmedName);
    }

    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="w-60 pb-8 bg-[#212126] scrollbar-hidden  border-white/10 p-4 flex flex-col gap-4 h-screen overflow-y-auto">
      <div className="flex items-center scrollbar-hidden  justify-between ">
        <h3 className="text-white text-xs  mono  uppercase tracking-tight">
          Layers
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 cursor-pointer  hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      {layers.length === 0 ? (
        <div className="">
          <p className="text-white/60 tracking-tight mono text-sm">
            No layers yet
          </p>
        </div>
      ) : (
        <div className="space-y-1 scrollbar-hidden overflow-y-auto">
          {[...layers].reverse().map((layer) => (
            <div
              key={layer.id}
              onClick={() => selectLayer(layer.id)}
              onDoubleClick={() => {
                setEditingId(layer.id);
                setEditingName(layer.name);
              }}
              className={`group px-1 py-1 mono flex items-center justify-between gap-2 tracking-tight  rounded-xs cursor-pointer transition ${
                selectedLayerId === layer.id
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="text-white/60 hover:bg-white/20 h-5 flex items-center justify-center w-5 rounded-xs hover:text-white transition flex-shrink-0"
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5" strokeWidth={1.25} />
                  ) : (
                    <EyeOff className="w-3 h-3" strokeWidth={1.25} />
                  )}
                </button>

                {/* Layer Name / Edit */}
                {editingId === layer.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRename(layer.id, editingName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleRename(layer.id, editingName);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="bg-[#1a1a1e] border border-white/20 rounded-xs px-2  text-xs text-white focus:outline-none focus:border-white/40 flex-1 min-w-0"
                  />
                ) : (
                  <span
                    className={`text-xs truncate tracking-tight text-left ${
                      layer.visible ? "text-white/80" : "text-white/35"
                    }`}
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(layer.id);
                  setEditingName(layer.name);
                }}
                className="text-white/40 hover:bg-white/20 h-5 flex items-center justify-center w-5 rounded-xs hover:text-white/70 transition flex-shrink-0 opacity-0 group-hover:opacity-100"
                aria-label={`Rename ${layer.name}`}
              >
                <Edit2 className="w-3 h-3" strokeWidth={1.25} />
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(layer.id);
                }}
                disabled={layer.locked}
                className={`transition flex-shrink-0 hover:bg-white/20 h-5 flex items-center justify-center w-5 rounded-xs opacity-0 group-hover:opacity-100 ${
                  layer.locked
                    ? "cursor-not-allowed text-white/20"
                    : "text-white/40 hover:text-red-400"
                }`}
                aria-label={`Delete ${layer.name}`}
              >
                <Trash2 className="w-3 h-3" strokeWidth={1.25} />
              </button>

              {/* Lock Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLocked(layer.id);
                }}
                className={`transition hover:bg-white/20 h-5 flex items-center justify-center w-5 rounded-xs flex-shrink-0 ${
                  layer.locked
                    ? "text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <Lock className="w-3 h-3" strokeWidth={1.25} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Layer Info */}
      <div className="mt-auto absolute bottom-0 bg-[#212126] w-60 -ml-4 p-2 border-t border-white/10">
        <p className="text-xs mono tracking-tight text-white/50">
          Total Layers: {layers.length}
        </p>
      </div>
    </div>
  );
};

// Tools Section Component
const ToolsSection = ({
  activePanel,
  onPanelChange,
}: {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
}) => (
  <div className="flex flex-col items-center gap-4">
    <IconButton
      icon={Search}
      tooltip="Search (Cmd+F)"
      isActive={activePanel === "search"}
      onClick={() => onPanelChange(activePanel === "search" ? null : "search")}
    />
    <IconButton
      icon={Grid2x2}
      tooltip="Canvas Settings"
      isActive={activePanel === "tools"}
      onClick={() => onPanelChange(activePanel === "tools" ? null : "tools")}
    />
  </div>
);

// Layers & Objects Section Component
const LayersSection = ({
  activePanel,
  onPanelChange,
}: {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
}) => (
  <div className="flex flex-col items-center gap-4">
    <IconButton
      icon={Layers}
      tooltip="Layers Panel (L)"
      isActive={activePanel === "layers"}
      onClick={() => onPanelChange(activePanel === "layers" ? null : "layers")}
    />
    {/**  <IconButton icon={Lock} tooltip="Lock Selection" />*/}
  </div>
);

const ViewSection = () => {
  const {
    canZoomIn,
    canZoomOut,
    fitToScreen,
    zoomIn,
    zoomOut,
    zoomPercent,
    resetZoom,
  } = useViewControlsStore();

  return (
    <div className="flex flex-col items-center gap-4">
      <IconButton
        icon={Maximize2}
        tooltip="Fit To Screen"
        onClick={fitToScreen}
      />
      <IconButton
        disabled={!canZoomIn}
        icon={ZoomIn}
        tooltip={`Zoom In (${zoomPercent})`}
        onClick={zoomIn}
      />
      <div
        className="text-white mono text-[11px] hover:bg-white/20 w-full h-8 flex items-center rounded justify-center cursor-pointer"
        title="Reset zoom to 100%"
        onClick={resetZoom}
      >
        {zoomPercent}
      </div>

      <IconButton
        disabled={!canZoomOut}
        icon={ZoomOut}
        tooltip={`Zoom Out (${zoomPercent})`}
        onClick={zoomOut}
      />
    </div>
  );
};

// Settings Panel Component — focused on AI settings
const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const {
    ttsProvider,
    ttsVoice,
    speechRate,
    autoSummarize,
    defaultAction,
    setTtsProvider,
    setTtsVoice,
    setSpeechRate,
    setAutoSummarize,
    setDefaultAction,
  } = useAiSettingsStore();

  const voiceName =
    Object.entries(ELEVENLABS_VOICES).find(([, id]) => id === ttsVoice)?.[0] ??
    "Rachel";

  return (
    <div className="w-60 h-screen bg-[#212126] p-4 flex flex-col gap-2 overflow-y-auto">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-white text-xs mono uppercase tracking-tight">
          AI Settings
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 cursor-pointer hover:text-white transition"
        >
          <X className="w-4 cursor-pointer h-4" strokeWidth={1.25} />
        </button>
      </div>

      <div className="space-y-5">
        {/* ── TTS Provider ── */}
        <div className="space-y-2">
          <label className="text-white/50 mono text-xs uppercase tracking-tight">
            Text-to-speech Provider
          </label>
          <select
            value={ttsProvider}
            onChange={(e) => setTtsProvider(e.target.value as "elevenlabs" | "amazon-tts")}
            className="w-full bg-[#17171b] border border-white/10 rounded px-2 py-1.5 mono text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="elevenlabs">ElevenLabs</option>
            <option value="amazon-tts">Amazon Polly</option>
          </select>
        </div>

        {/* ── TTS Voice ── */}
        <div className="space-y-2">
          <label className="text-white/50 mono text-xs uppercase tracking-tight">
            Voice
          </label>
          <select
            value={voiceName}
            onChange={(e) => {
              const voiceId = ELEVENLABS_VOICES[e.target.value];
              if (voiceId) setTtsVoice(voiceId);
            }}
            className="w-full bg-[#17171b] border border-white/10 rounded px-2 py-1.5 mono text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
          >
            {Object.keys(ELEVENLABS_VOICES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Speech Rate ── */}
        <div className="space-y-2">
          <label className="text-white/50 mono text-xs uppercase tracking-wide">
            Speed: {Math.round(speechRate * 100)}%
          </label>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full  cursor-pointer"
          />
        </div>

        <div className="border-t border-white/10" />

        {/* ── Default AI Action ── */}
        <div className="space-y-2">
          <label className="text-white/50 mono text-xs uppercase tracking-tight">
            Default Action
          </label>
          <select
            value={defaultAction}
            onChange={(e) => setDefaultAction(e.target.value as "ask" | "summarize" | "describe")}
            className="w-full bg-[#17171b] border border-white/10 rounded px-2 py-1.5 mono text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="ask">Ask AI</option>
            <option value="summarize">Summarize</option>
            <option value="describe">Describe</option>
          </select>
        </div>

        {/* ── Auto Summarize on Drop ── */}
        <div className="flex items-center justify-between">
          <label className="text-white/50 mono text-xs uppercase tracking-wide">
            Auto-summarize documents
          </label>
          <input
            type="checkbox"
            checked={autoSummarize}
            onChange={(e) => setAutoSummarize(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// Help Panel Component
const HelpPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="w-60 h-screen bg-[#212126] p-4 flex flex-col gap-4 scrollbar-hidden overflow-y-auto">
    <div className="flex items-center justify-between pb-2">
      <h3 className="text-white text-xs mono uppercase tracking-tight">
        Help & docs
      </h3>
      <button
        onClick={onClose}
        className="text-white/60 cursor-pointer hover:text-white transition"
      >
        <X className="w-4 cursor-pointer h-4" strokeWidth={1.25} />
      </button>
    </div>

    <div className="space-y-4">
      <div>
        <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
          AI Read Aloud
        </h4>
        <div className="space-y-2 text-[11px] mono text-white/50 leading-relaxed">
          <p>Select any <span className="text-white/70">sticky note</span> and click the <span className="text-white/70">Read</span> button above it to hear the text spoken aloud using ElevenLabs AI voices.</p>
          <p>Each read-aloud costs <span className="text-white/70">3 credits</span>. Words are highlighted in real-time as they&rsquo;re spoken.</p>
          <p>Configure your preferred voice and speech speed in <span className="text-white/70">AI Settings</span>.</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
          AI Actions
        </h4>
        <div className="space-y-2 text-[11px] mono text-white/50 leading-relaxed">
          <p><span className="text-white/70">Ask AI</span> — Open a floating chat window to ask questions about a file</p>
          <p><span className="text-white/70">Summarize</span> — AI-generated summary of documents & spreadsheets</p>
          <p><span className="text-white/70">Describe</span> — AI describes the contents of an image</p>
          <p><span className="text-white/70">Edit with AI</span> — Edit documents or images via natural language prompts</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
          Canvas Controls
        </h4>
        <div className="space-y-2 text-[11px] mono text-white/50 leading-relaxed">
          <p><span className="text-white/70">Pan</span> — Middle mouse drag or Space + left drag</p>
          <p><span className="text-white/70">Zoom</span> — Scroll wheel or two-finger pinch</p>
          <p><span className="text-white/70">Select</span> — Click a node, or drag to marquee select</p>
          <p><span className="text-white/70">Multi-select</span> — Shift/Cmd + click</p>
          <p><span className="text-white/70">Delete</span> — Backspace or Delete key</p>
          <p><span className="text-white/70">Duplicate</span> — Cmd/Ctrl + D</p>
          <p><span className="text-white/70">Deselect</span> — Escape</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
          Sticky Notes
        </h4>
        <div className="space-y-2 text-[11px] mono text-white/50 leading-relaxed">
          <p>Use the <span className="text-white/70">Text tool</span> to create sticky notes on the canvas. Double-click to edit, click outside to save. Drag to reposition. Right-click for more options.</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
          File Actions
        </h4>
        <div className="space-y-2 text-[11px] mono text-white/50 leading-relaxed">
          <p><span className="text-white/70">Drop files</span> — Drag images from your OS onto the canvas</p>
          <p><span className="text-white/70">Right-click</span> — Context menu with AI actions per file type</p>
          <p><span className="text-white/70">Resize</span> — Drag corner handles on selected nodes</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
          Cloud Storage
        </h4>
        <div className="space-y-2 text-[11px] mono text-white/50 leading-relaxed">
          <p>Connect Google Drive or Dropbox from the <span className="text-white/70">External storage</span> panel to browse and import images directly.</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="text-white/70 text-[11px] mono uppercase tracking-wide mb-2">
          Shortcuts
        </h4>
        <div className="space-y-2 text-[11px] mono text-white/50 leading-relaxed">
          <p><span className="text-white/70">L</span> — Open layers panel</p>
          <p><span className="text-white/70">Cmd+F</span> — Search</p>
          <p><span className="text-white/70">Cmd+D</span> — Duplicate selected</p>
          <p><span className="text-white/70">Esc</span> — Deselect / close panels</p>
        </div>
      </div>
    </div>
  </div>
);

// Export & Settings Section Component
const ExportSection = ({
  activePanel,
  onPanelChange,
}: {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
}) => (
  <div className="flex flex-col items-center gap-4">
    <IconButton
      icon={Cable}
      tooltip="Connect external storage"
      isActive={activePanel === "connect"}
      onClick={() =>
        onPanelChange(activePanel === "connect" ? null : "connect")
      }
    />
    <IconButton
      icon={Download}
      tooltip="Export Canvas"
      isActive={activePanel === "export"}
      onClick={() => onPanelChange(activePanel === "export" ? null : "export")}
    />
    <IconButton
      icon={HelpCircle}
      tooltip="help & docs"
      isActive={activePanel === "help"}
      onClick={() => onPanelChange(activePanel === "help" ? null : "help")}
    />
    <IconButton
      icon={Settings}
      tooltip="Settings"
      isActive={activePanel === "settings"}
      onClick={() =>
        onPanelChange(activePanel === "settings" ? null : "settings")
      }
    />
  </div>
);

export const Sidebar = ({
  gridSettings,
  onGridSettingsChange,
  onImportCloudFile,
  onClosePanel,
  canvasName,
  activeCanvasId,
  canvases,
  onRename,
  onSwitchCanvas,
}: SidebarProps) => {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [showCanvasOverlay, setShowCanvasOverlay] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevPanelRef = useRef<PanelType>(null);
  const canvasSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCanvasOverlay) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        canvasSwitcherRef.current &&
        !canvasSwitcherRef.current.contains(event.target as Node)
      ) {
        setShowCanvasOverlay(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCanvasOverlay(false);
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handlePointerDown);
    }, 0);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCanvasOverlay]);

  useEffect(() => {
    if (!activePanel) return;

    function handleCanvasPointerDown(event: PointerEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setActivePanel(null);
      }
    }

    window.addEventListener("pointerdown", handleCanvasPointerDown);

    return () => {
      window.removeEventListener("pointerdown", handleCanvasPointerDown);
    };
  }, [activePanel]);

  // GSAP animation: simple left-to-right slide when panel opens/closes
  useGSAP(() => {
    // Animate out the previous panel
    if (prevPanelRef.current && !activePanel) {
      gsap.to(panelRef.current, {
        x: -16,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          prevPanelRef.current = null;
        },
      });
    }

    // Animate in the new panel
    if (activePanel) {
      gsap.fromTo(
        panelRef.current,
        { x: -200 },
        { x: 0, duration: 0.3, ease: "power2.out" },
      );
    }

    // Track previous panel state
    prevPanelRef.current = activePanel;
  }, [activePanel]);

  const handleClose = useCallback(() => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        x: -16,
        duration: 0.12,
        ease: "power2.in",
        onComplete: () => {
          setActivePanel(null);
        },
      });
    } else {
      setActivePanel(null);
    }
  }, []);

  const renderPanel = () => {
    switch (activePanel) {
      case "search":
        return <SearchPanel onClose={handleClose} />;
      case "tools":
        return (
          <ToolsPanel
            gridSettings={gridSettings}
            onClose={handleClose}
            onGridSettingsChange={onGridSettingsChange}
          />
        );
      case "export":
        return <ExportPanel onClose={handleClose} />;
      case "layers":
        return <LayersPanel onClose={handleClose} />;
      case "connect":
        return <ConnectPanel onClose={handleClose} onImportCloudFile={onImportCloudFile} />;
      case "help":
        return <HelpPanel onClose={handleClose} />;
      case "settings":
        return <SettingsPanel onClose={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="absolute left-0 top-0 h-screen flex z-50"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Left Sidebar */}
      <div className="w-fit p-2 bg-[#212126] flex flex-col items-center py-4 gap-6 border-r border-white/10">
        {/* Logo — click to open canvas switcher */}
        <div ref={canvasSwitcherRef} className="relative">
          <button
            type="button"
            aria-expanded={showCanvasOverlay}
            aria-label="Canvas menu"
            onClick={() => setShowCanvasOverlay((open) => !open)}
            className="cursor-pointer rounded p-1 py-1.5 hover:bg-white/20"
          >
            <Image
              src="/images/Re.svg"
              alt="Reflow"
              width={24}
              height={24}
              className="object-contain"
            />
          </button>
          {showCanvasOverlay ? (
            <CanvasSwitcherOverlay
              activeCanvasId={activeCanvasId}
              canvasName={canvasName}
              canvases={canvases}
              onRename={onRename}
              onSwitchCanvas={(slug) => {
                setShowCanvasOverlay(false);
                onSwitchCanvas?.(slug);
              }}
            />
          ) : null}
        </div>
        {/* Tools Section */}
        <div className="mt-5">
          <ToolsSection
            activePanel={activePanel}
            onPanelChange={setActivePanel}
          />
        </div>
        {/* Edit Section */}
        {/* <EditSection /> */}
        {/* View Section */}
        <ViewSection />
        {/* Divider */}

        {/* Layers Section */}
        <LayersSection
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />
        {/* Divider */}
        <div className="w-6 h-px bg-white/10" />
        {/* Spacer */}
        <div className="flex-1" />
        {/* Export & Settings Section */}
        <ExportSection
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />
      </div>

      {/* Right Panel */}
      {activePanel && (
        <div
          ref={panelRef}
          className="h-screen -z-1 overflow-y-auto"
          onWheel={(e) => e.stopPropagation()}
        >
          {renderPanel()}
        </div>
      )}
    </div>
  );
};
