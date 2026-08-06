"use client";

import {
  ArrowLeft,
  Grid2x2,
  Minus,
  Workflow,
  ChevronRight,
  MouseRight,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCanvasPreferencesStore } from "@/lib/canvas/canvasPreferencesStore";

type WireType = "line" | "elbow" | "bezier";
type ConnectorLineStyle = "solid" | "dashed";

export default function PreferencesPage() {
  const {
    rightClickMenu,
    snapToGrid,
    wireType,
    connectorLineStyle,
    keepOriginalImageOnRemoveBg,
    setRightClickMenu,
    setSnapToGrid,
    setWireType,
    setConnectorLineStyle,
    setKeepOriginalImageOnRemoveBg,
    syncFromServer,
    syncToServer,
  } = useCanvasPreferencesStore();

  // Sync from server on mount
  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const handleToggle = (
    setting: "rightClickMenu" | "snapToGrid" | "keepOriginalImageOnRemoveBg",
  ) => {
    switch (setting) {
      case "rightClickMenu":
        setRightClickMenu(!rightClickMenu);
        syncToServer();
        break;
      case "snapToGrid":
        setSnapToGrid(!snapToGrid);
        syncToServer();
        break;
      case "keepOriginalImageOnRemoveBg":
        setKeepOriginalImageOnRemoveBg(!keepOriginalImageOnRemoveBg);
        syncToServer();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded border border-white/10 bg-[#212126] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <Link
            href="/work"
            className="flex items-center gap-1 text-xs mono uppercase tracking-tight text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
            Back
          </Link>
          <h1 className="text-xs mono uppercase tracking-tight text-white">
            Preferences
          </h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="divide-y divide-white/10 px-4 py-2">
          {/* Right-click to open menu */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <MouseRight className="w-3.5 h-3.5 text-white/60 stroke-[1.5]" />{" "}
              <span className="text-xs mono uppercase tracking-tight text-white">
                Right-click to open menu
              </span>
            </div>
            <ToggleSwitch
              checked={rightClickMenu}
              onChange={() => handleToggle("rightClickMenu")}
            />
          </div>

          {/* Snap to Grid */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Grid2x2 className="w-4 h-4 text-white/60 stroke-[1.5]" />
              <span className="text-xs mono uppercase tracking-tight text-white">
                Snap to Grid
              </span>
            </div>
            <ToggleSwitch
              checked={snapToGrid}
              onChange={() => handleToggle("snapToGrid")}
            />
          </div>

          {/* Keep original when removing background */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-white/60 stroke-[1.5]" />
              <span className="text-xs mono uppercase tracking-tight text-white">
                Keep original when removing background
              </span>
            </div>
            <ToggleSwitch
              checked={keepOriginalImageOnRemoveBg}
              onChange={() => handleToggle("keepOriginalImageOnRemoveBg")}
            />
          </div>

          {/* Wire Type — flyout */}
          <WireTypeFlyout
            value={wireType}
            onChange={setWireType}
            syncToServer={syncToServer}
          />

          <ConnectorStyleFlyout
            value={connectorLineStyle}
            onChange={setConnectorLineStyle}
            syncToServer={syncToServer}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 cursor-pointer h-5 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? "bg-blue-500" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-4 rounded-full transition-transform duration-200 ${
          checked
            ? "translate-x-4 bg-white shadow-[0_0_8px_1px_rgba(0,0,0,0.3)]"
            : "bg-white/40"
        }`}
      />
    </button>
  );
}

function WireTypeFlyout({
  value,
  onChange,
  syncToServer,
}: {
  value: WireType;
  onChange: (type: WireType) => void;
  syncToServer: () => Promise<void>;
}) {
  const [showFlyout, setShowFlyout] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowFlyout(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowFlyout(false);
    }, 150);
  };

  const wireTypeLabel = {
    line: "Line",
    elbow: "Elbow",
    bezier: "Bezier",
  };

  const wireTypeIcon = {
    line: <Minus className="w-3.5 h-3.5" />,
    elbow: (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polyline points="1,12 6,12 6,4 15,4" />
      </svg>
    ),
    bezier: (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M1,12 C5,12 6,4 10,4 C12,4 14,6 15,4" />
      </svg>
    ),
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-white/60 stroke-[1.5]" />
          <span className="text-xs mono uppercase tracking-tight text-white">
            Wire Type
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-xs mono uppercase tracking-tight text-white/70 transition hover:text-white cursor-pointer"
        >
          {wireTypeIcon[value]}
          <span>{wireTypeLabel[value]}</span>
          <ChevronRight className="w-3 h-3 text-white/50 stroke-[1.5]" />
        </button>
      </div>

      {showFlyout && (
        <div
          className="absolute right-0 top-full mt-1 z-[70] w-[180px] rounded border border-white/10 bg-[#212126] shadow-2xl"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {(Object.entries(wireTypeLabel) as [WireType, string][]).map(
            ([type, label], index) => (
              <div key={type}>
                {index > 0 && <div className="h-px bg-white/10" />}
                <button
                  type="button"
                  onClick={() => {
                    onChange(type);
                    syncToServer();
                    setShowFlyout(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs mono uppercase tracking-tight transition cursor-pointer ${
                    value === type
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {wireTypeIcon[type]}
                  <span>{label}</span>
                  {value === type && (
                    <span className="ml-auto text-white/40">✓</span>
                  )}
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ConnectorStyleFlyout({
  value,
  onChange,
  syncToServer,
}: {
  value: ConnectorLineStyle;
  onChange: (style: ConnectorLineStyle) => void;
  syncToServer: () => Promise<void>;
}) {
  const [showFlyout, setShowFlyout] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowFlyout(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowFlyout(false);
    }, 150);
  };

  const styleLabel: Record<ConnectorLineStyle, string> = {
    solid: "Solid",
    dashed: "Dashed",
  };

  return (
    <div
      ref={useRef<HTMLDivElement>(null)}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-white/60 stroke-[1.5]" />
          <span className="text-xs mono uppercase tracking-tight text-white">
            Connector Style
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-xs mono uppercase tracking-tight text-white/70 transition hover:text-white cursor-pointer"
        >
          <span>{styleLabel[value]}</span>
          <ChevronRight className="w-3 h-3 text-white/50 stroke-[1.5]" />
        </button>
      </div>

      {showFlyout && (
        <div
          className="absolute right-0 top-full mt-1 z-[70] w-[180px] rounded border border-white/10 bg-[#212126] shadow-2xl"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {(Object.entries(styleLabel) as [ConnectorLineStyle, string][]).map(
            ([style, label], index) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  onChange(style);
                  syncToServer();
                  setShowFlyout(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs mono uppercase tracking-tight transition cursor-pointer ${
                  value === style
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <span>{label}</span>
                {value === style ? (
                  <span className="text-white/80">✓</span>
                ) : null}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
