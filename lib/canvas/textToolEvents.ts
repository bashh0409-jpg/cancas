export const CANVAS_TEXT_TOOL_EVENT = "canvasai:text-tool";

export function activateCanvasTextTool() {
  window.dispatchEvent(new CustomEvent(CANVAS_TEXT_TOOL_EVENT));
}
