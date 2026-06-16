import { create } from "zustand";

export type GridSettings = {
  enabled: boolean;
  color: string;
  background: string;
  lineType: "solid" | "dotted";
  size: number;
};

type GridStore = {
  settings: GridSettings;
  updateSettings: (updates: Partial<GridSettings>) => void;
  resetSettings: () => void;
};

const DEFAULT_GRID_SETTINGS: GridSettings = {
  enabled: true,
  color: "#ffffff",
  background: "#111111",
  lineType: "solid",
  size: 20,
};

export const useGridStore = create<GridStore>((set) => ({
  settings: DEFAULT_GRID_SETTINGS,
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),
  resetSettings: () =>
    set({
      settings: DEFAULT_GRID_SETTINGS,
    }),
}));
