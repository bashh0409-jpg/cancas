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
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { useState } from "react";
import { Toolbox } from "@/public/icons/custom/Toolbox";
import { useGridStore } from "@/lib/canvas/gridStore";
import { useLayersStore } from "@/lib/canvas/layersStore";
import { useViewControlsStore } from "@/lib/canvas/viewControlsStore";

type PanelType = "search" | "tools" | "export" | "layers" | null;

// Logo Component
const Logo = () => (
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
    <div className="flex items-center justify-between border-b border-white/10 pb-2">
      <h3 className="text-white text-xs mono uppercase tracking-tight ">
        Search
      </h3>
      <button
        onClick={onClose}
        className="text-white/60 hover:text-white transition"
      >
        <X className="w-4 h-4" strokeWidth={1.25} />
      </button>
    </div>

    <input
      type="text"
      placeholder="Search files, layers..."
      className="bg-white/10 my-1 border border-white/20 rounded-xs px-3 py-1 text-sm text-white mono tracking-tight placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
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
const ToolsPanel = ({ onClose }: { onClose: () => void }) => {
  const { settings, updateSettings } = useGridStore();

  return (
    <div className="w-60 h-screen bg-[#212126]  p-4 flex flex-col gap-4 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-2     ">
        <h3 className="text-white text-xs  mono uppercase tracking-tight">
          Tools & Assets
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Grid Control Section */}
        <div className="rounded p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white/60 text-xs  mono uppercase">
              Grid
            </label>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
              className="w-4 h-4 cursor-pointer"
            />
          </div>

          {settings.enabled && (
            <>
              {/* Grid Size */}
              <div className="space-y-1">
                <label className="text-white/50 mono text-xs uppercase">
                  Size: {settings.size}px
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={settings.size}
                  onChange={(e) =>
                    updateSettings({
                      size: parseInt(e.target.value),
                    })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Grid Color */}
              <div className="space-y-1">
                <label className="text-white/50 mono text-xs uppercase">
                  line Color
                </label>
                <div className="flex mono gap-2">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => updateSettings({ color: e.target.value })}
                    className="w-10 h-8 rounded cursor-pointer border border-white/20"
                  />
                  <input
                    type="text"
                    value={settings.color}
                    onChange={(e) => updateSettings({ color: e.target.value })}
                    className="flex-1 bg-[#1a1a1e] border border-white/20 rounded px-2 py-1 text-xs text-white/80 font-mono focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1">
                <label className=" mono text-white/50 text-xs uppercase">
                  canvas Background
                </label>
                <div className="flex mono gap-2">
                  <input
                    type="color"
                    value={settings.background}
                    onChange={(e) =>
                      updateSettings({
                        background: e.target.value,
                      })
                    }
                    className="w-10 h-8 rounded cursor-pointer border border-white/20"
                  />
                  <input
                    type="text"
                    value={settings.background}
                    onChange={(e) =>
                      updateSettings({
                        background: e.target.value,
                      })
                    }
                    className="flex-1 bg-[#1a1a1e] border border-white/20 rounded px-2 py-1 text-xs text-white/80 font-mono focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Line Type */}
              <div className="space-y-1">
                <label className="text-white/50 mono text-xs uppercase">
                  Line Style
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ lineType: "solid" })}
                    className={`flex-1 px-2  tracking-tight py-1 rounded-xs text-xs  transition ${
                      settings.lineType === "solid"
                        ? "lime text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    Solid
                  </button>

                  <button
                    onClick={() => updateSettings({ lineType: "dotted" })}
                    className={`flex-1 px-2 py-1 w-fit tracking-tight rounded-xs text-xs  transition ${
                      settings.lineType === "dotted"
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

// Export Panel Component
const ExportPanel = ({ onClose }: { onClose: () => void }) => {
  const [exportFormat, setExportFormat] = React.useState("PNG");

  return (
    <div className="w-60 h-screen bg-[#212126]  border-white/10 p-4 flex flex-col gap-4">
      <div className="flex items-center border-b border-white/10 pb-2 justify-between mb-2">
        <h3 className="text-white text-xs uppercase tracking-tight mono">
          Export & Share
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition"
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
      <div className="flex items-center scrollbar-hidden  border-b border-white/10 pb-2 justify-between mb-2">
        <h3 className="text-white text-xs  mono  uppercase tracking-tight">
          Layers
        </h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition"
        >
          <X className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      {layers.length === 0 ? (
        <div className="text-center py-8">
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
      icon={Toolbox}
      tooltip="Tools & Assets"
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
    setZoomPercent,
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
        className="text-white mono text-xs cursor-pointer"
        onClick={() => setZoomPercent(100)} // assumes setter exists in scope
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
      icon={Download}
      tooltip="Export Canvas"
      isActive={activePanel === "export"}
      onClick={() => onPanelChange(activePanel === "export" ? null : "export")}
    />
    <IconButton icon={HelpCircle} tooltip="Help & Docs" />
    <IconButton icon={Settings} tooltip="Settings" />
  </div>
);

export const Sidebar = () => {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const renderPanel = () => {
    switch (activePanel) {
      case "search":
        return <SearchPanel onClose={() => setActivePanel(null)} />;
      case "tools":
        return <ToolsPanel onClose={() => setActivePanel(null)} />;
      case "export":
        return <ExportPanel onClose={() => setActivePanel(null)} />;
      case "layers":
        return <LayersPanel onClose={() => setActivePanel(null)} />;
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
        <div className="mt-10">
          <ToolsSection
            activePanel={activePanel}
            onPanelChange={setActivePanel}
          />
        </div>
        {/* Edit Section */}
        {/* <EditSection /> */} <div className="w-6 h-px bg-white/10" />
        {/* View Section */}
        <ViewSection />
        {/* Divider */}
        <div className="w-6 h-px bg-white/10" />
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
