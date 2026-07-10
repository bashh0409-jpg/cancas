/**
 * Custom event name for triggering sidebar panel opens from anywhere.
 * Detail should be the PanelType string (e.g. "layers", "search", "tools", etc.)
 */
export const SIDEBAR_PANEL_EVENT = "canvasai:open-sidebar-panel";

export function dispatchOpenSidebarPanel(panel: string) {
  window.dispatchEvent(
    new CustomEvent(SIDEBAR_PANEL_EVENT, { detail: panel }),
  );
}