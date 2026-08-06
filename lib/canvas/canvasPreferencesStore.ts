import { create } from "zustand";
import { persist } from "zustand/middleware";

type CanvasPreferences = {
  rightClickMenu: boolean;
  snapToGrid: boolean;
  wireType: "line" | "elbow" | "bezier";
  connectorLineStyle: "solid" | "dashed";
  keepOriginalImageOnRemoveBg: boolean;
};

type CanvasPreferencesStore = CanvasPreferences & {
  setRightClickMenu: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setWireType: (type: CanvasPreferences["wireType"]) => void;
  setConnectorLineStyle: (style: CanvasPreferences["connectorLineStyle"]) => void;
  setKeepOriginalImageOnRemoveBg: (enabled: boolean) => void;
  syncFromServer: () => Promise<void>;
  syncToServer: () => Promise<void>;
};

export const useCanvasPreferencesStore = create<CanvasPreferencesStore>()(
  persist(
    (set, get) => ({
      rightClickMenu: false,
      snapToGrid: false,
      wireType: "elbow",
      connectorLineStyle: "dashed",
      keepOriginalImageOnRemoveBg: false,

      setRightClickMenu: (rightClickMenu) => set({ rightClickMenu }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setWireType: (wireType) => set({ wireType }),
      setConnectorLineStyle: (connectorLineStyle) => set({ connectorLineStyle }),
      setKeepOriginalImageOnRemoveBg: (keepOriginalImageOnRemoveBg) =>
        set({ keepOriginalImageOnRemoveBg }),

      syncFromServer: async () => {
        try {
          const response = await fetch("/api/settings");
          if (!response.ok) return;
          const data = (await response.json()) as {
            settings?: Partial<CanvasPreferences>;
          };

          if (data.settings) {
            set({
              rightClickMenu:
                data.settings.rightClickMenu ?? get().rightClickMenu,
              snapToGrid: data.settings.snapToGrid ?? get().snapToGrid,
              wireType: data.settings.wireType ?? get().wireType,
              connectorLineStyle:
                data.settings.connectorLineStyle ?? get().connectorLineStyle,
              keepOriginalImageOnRemoveBg:
                data.settings.keepOriginalImageOnRemoveBg ??
                get().keepOriginalImageOnRemoveBg,
            });
          }
        } catch {
          // Silently fail — local defaults are used as fallback
        }
      },

      syncToServer: async () => {
        try {
          const {
            rightClickMenu,
            snapToGrid,
            wireType,
            connectorLineStyle,
            keepOriginalImageOnRemoveBg,
          } = get();

          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              settings: {
                rightClickMenu,
                snapToGrid,
                wireType,
                connectorLineStyle,
                keepOriginalImageOnRemoveBg,
              },
            }),
          });
        } catch {
          // Silently fail — will retry on next change
        }
      },
    }),
    { name: "canvasai:preferences" },
  ),
);