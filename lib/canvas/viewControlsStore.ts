import { create } from "zustand";

type ViewControlActions = {
  onFitToScreen?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
};

type ViewControlsStore = {
  actions: ViewControlActions;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomPercent: string;
  registerViewControls: (actions: ViewControlActions) => void;
  clearViewControls: () => void;
  updateViewControlState: (state: {
    canZoomIn: boolean;
    canZoomOut: boolean;
    zoomPercent: string;
  }) => void;
  fitToScreen: () => void;
  zoomIn: () => void;
  resetZoom: () => void;
  zoomOut: () => void;
};

export const useViewControlsStore = create<ViewControlsStore>((set, get) => ({
  actions: {},
  canZoomIn: true,
  canZoomOut: true,
  zoomPercent: "100%",
  registerViewControls: (actions) => set({ actions }),
  clearViewControls: () => set({ actions: {} }),
  updateViewControlState: (state) => set(state),
  fitToScreen: () => get().actions.onFitToScreen?.(),
  zoomIn: () => get().actions.onZoomIn?.(),
  resetZoom: () => get().actions.onResetZoom?.(),
  zoomOut: () => get().actions.onZoomOut?.(),
}));
