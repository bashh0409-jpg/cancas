import { create } from "zustand";
import { persist } from "zustand/middleware";

type CanvasPreferences = {
  rightClickMenu: boolean;
  snapToGrid: boolean;
  wireType: "line" | "elbow" | "bezier";
};

type CanvasPreferencesStore = CanvasPreferences & {
  setRightClickMenu: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setWireType: (type: CanvasPreferences["wireType"]) => void;
};

export const useCanvasPreferencesStore = create<CanvasPreferencesStore>()(
  persist(
    (set) => ({
      rightClickMenu: false,
      snapToGrid: false,
      wireType: "elbow",

      setRightClickMenu: (rightClickMenu) => set({ rightClickMenu }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setWireType: (wireType) => set({ wireType }),
    }),
    { name: "canvasai:preferences" },
  ),
);