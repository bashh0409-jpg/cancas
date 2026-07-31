import { create } from "zustand";
import { persist } from "zustand/middleware";

type CanvasPreferences = {
  rightClickMenu: boolean;
  snapToGrid: boolean;
  wireType: "line" | "elbow" | "bezier";
  keepOriginalImageOnRemoveBg: boolean;
};

type CanvasPreferencesStore = CanvasPreferences & {
  setRightClickMenu: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setWireType: (type: CanvasPreferences["wireType"]) => void;
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
      keepOriginalImageOnRemoveBg: false,

      setRightClickMenu: (rightClickMenu) => set({ rightClickMenu }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setWireType: (wireType) => set({ wireType }),
      setKeepOriginalImageOnRemoveBg: (keepOriginalImageOnRemoveBg) =>
        set({ keepOriginalImageOnRemoveBg }),

      syncFromServer: async () => {
        try {
          const response = await fetch("/api/settings");
          if (!response.ok) return;
          const data = (await response.json()) as {
            settings?: { keepOriginalImageOnRemoveBg?: boolean };
          };
          if (data.settings?.keepOriginalImageOnRemoveBg !== undefined) {
            set({
              keepOriginalImageOnRemoveBg:
                data.settings.keepOriginalImageOnRemoveBg,
            });
          }
        } catch {
          // Silently fail — local defaults are used as fallback
        }
      },

      syncToServer: async () => {
        try {
          const { keepOriginalImageOnRemoveBg } = get();
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              settings: { keepOriginalImageOnRemoveBg },
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