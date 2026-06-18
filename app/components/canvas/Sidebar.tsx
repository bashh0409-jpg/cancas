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
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";

import React, { useEffect, useState } from "react";
import { useLayersStore } from "@/lib/canvas/layersStore";
import { useViewControlsStore } from "@/lib/canvas/viewControlsStore";
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
};

// Logo Component
const Logo = () => (
  <a href="/home" className="cursor-pointer hover:bg-white/20 rounded p-1">
    <svg
      width="24"
      height="24"
      viewBox="0 0 35 30"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
    >
      <title>Logo</title>
      <path
        d="M34.6895 0H25.8153V19.4784H21.7818V0H12.9077V19.4784H8.87414V0H0V19.6353H6.45383V30H15.328V19.6353H19.3615V30H28.2356V19.6353H34.6895V0Z"
        fill="white"
      ></path>
    </svg>
  </a>
);

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

export const ConnectPanel = ({ onClose }: { onClose: () => void }) => {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);

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
    <div className="w-60 h-screen bg-[#212126] border-l border-white/10 p-4 flex flex-col">
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
              className="group  rounded  hover:border-white/20 transition"
            >
              <div className=" flex items-start gap-2">
                {/* Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded border-white/10 shrink-0">
                  <Icon className="w-5 h-5 text-white/80" />
                </div>

                {/* Content */}
                <div className=" min-w-0 ">
                  <div className="flex items-center justify-between ">
                    <div className="text-sm gap-3 flex-col flex text-white mono uppercase tracking-tight truncate">
                      <p>{provider.name} </p>
                      <p>
                        {provider.connected && (
                          <span className="uppercase flex items-center gap-2 mono  text-lime-300 text-xs uppercase tracking-wide">
                            <Cable className="w-3.5 h-3.5" />
                            Connected
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleConnect(provider.id)}
                      disabled={provider.loading}
                      className={`
                        h-8 px-3 rounded text-xs font-medium transition cursor-pointer
                        flex items-center gap-2
                        ${
                          provider.connected
                            ? "bg-white/10 text-white hover:bg-white/15"
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
    <div className="w-60 mb-8 bg-[#212126] scrollbar-hidden  border-white/10 p-4 flex flex-col gap-4 h-screen overflow-y-auto">
      <div className="flex items-center scrollbar-hidden   pb-2 justify-between mb-2">
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
        <div className="space-y-1">
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

// Settings Panel Component
const SettingsPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="w-60 h-screen bg-[#212126] p-4 flex flex-col gap-4">
    <div className="flex items-center justify-between  pb-2">
      <h3 className="text-white text-xs mono uppercase tracking-tight ">
        Settings
      </h3>
      <button
        onClick={onClose}
        className="text-white/60 cursor-pointer hover:text-white transition"
      >
        <X className="w-4 cursor-pointer h-4" strokeWidth={1.25} />
      </button>
    </div>
  </div>
);
// Settings Panel Component
const HelpPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="w-60 h-screen bg-[#212126] p-4 flex flex-col gap-4">
    <div className="flex items-center justify-between  pb-2">
      <h3 className="text-white text-xs mono uppercase tracking-tight ">
        Help & docs
      </h3>
      <button
        onClick={onClose}
        className="text-white/60 cursor-pointer hover:text-white transition"
      >
        <X className="w-4 cursor-pointer h-4" strokeWidth={1.25} />
      </button>
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
}: SidebarProps) => {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const renderPanel = () => {
    switch (activePanel) {
      case "search":
        return <SearchPanel onClose={() => setActivePanel(null)} />;
      case "tools":
        return (
          <ToolsPanel
            gridSettings={gridSettings}
            onClose={() => setActivePanel(null)}
            onGridSettingsChange={onGridSettingsChange}
          />
        );
      case "export":
        return <ExportPanel onClose={() => setActivePanel(null)} />;
      case "layers":
        return <LayersPanel onClose={() => setActivePanel(null)} />;
      case "connect":
        return <ConnectPanel onClose={() => setActivePanel(null)} />;
      case "help":
        return <HelpPanel onClose={() => setActivePanel(null)} />;
      case "settings":
        return <SettingsPanel onClose={() => setActivePanel(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute left-0 top-0 h-screen flex z-50">
      {/* Left Sidebar */}
      <div className="w-fit p-2 bg-[#212126] flex flex-col items-center py-4 gap-6 border-r border-white/10">
        {/* Logo */}
        <Logo />
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
        <div className="animate-in fade-in slide-in-from-left-80 duration-300 h-screen overflow-y-auto">
          {renderPanel()}
        </div>
      )}
    </div>
  );
};
