import { create } from "zustand";

export type CanvasLayer = {
  id: string;
  name: string;
  type: "image" | "web" | "voice" | "text";
  visible: boolean;
  locked: boolean;
  zIndex: number;
};

type LayerActions = {
  onSelectLayer?: (id: string | null) => void;
  onToggleLayerVisibility?: (id: string) => void;
  onToggleLayerLocked?: (id: string) => void;
  onRenameLayer?: (id: string, name: string) => void;
  onDeleteLayer?: (id: string) => void;
};

type LayersStore = {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  actions: LayerActions;
  updateLayers: (layers: CanvasLayer[]) => void;
  registerLayerActions: (actions: LayerActions) => void;
  clearLayerActions: () => void;
  syncSelectedLayer: (id: string | null) => void;
  selectLayer: (id: string | null) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLocked: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  deleteLayer: (id: string) => void;
};

export const useLayersStore = create<LayersStore>((set) => ({
  layers: [],
  selectedLayerId: null,
  actions: {},
  updateLayers: (layers) =>
    set((state) => ({
      layers,
      selectedLayerId:
        state.selectedLayerId &&
        layers.some((layer) => layer.id === state.selectedLayerId)
          ? state.selectedLayerId
          : null,
    })),
  registerLayerActions: (actions) => set({ actions }),
  clearLayerActions: () =>
    set({ actions: {}, layers: [], selectedLayerId: null }),
  syncSelectedLayer: (id) =>
    set({
      selectedLayerId: id,
    }),
  selectLayer: (id) =>
    set((state) => {
      state.actions.onSelectLayer?.(id);

      return {
        selectedLayerId: id,
      };
    }),
  toggleLayerVisibility: (id) =>
    set((state) => {
      state.actions.onToggleLayerVisibility?.(id);

      return {
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, visible: !layer.visible } : layer,
        ),
      };
    }),
  toggleLayerLocked: (id) =>
    set((state) => {
      state.actions.onToggleLayerLocked?.(id);

      return {
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, locked: !layer.locked } : layer,
        ),
      };
    }),
  renameLayer: (id, name) =>
    set((state) => {
      state.actions.onRenameLayer?.(id, name);

      return {
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, name } : layer,
        ),
      };
    }),
  deleteLayer: (id) =>
    set((state) => {
      const layer = state.layers.find((entry) => entry.id === id);

      if (layer?.locked) {
        return state;
      }

      state.actions.onDeleteLayer?.(id);

      return {
        layers: state.layers.filter((layer) => layer.id !== id),
        selectedLayerId:
          state.selectedLayerId === id ? null : state.selectedLayerId,
      };
    }),
}));
