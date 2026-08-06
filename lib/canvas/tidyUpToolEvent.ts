export type TidyUpMode = "grid" | "grouped";

export const CANVAS_TIDY_UP_TOOL_EVENT = "canvasai:tidy-up-tool";

export function activateCanvasTidyUpTool(mode: TidyUpMode = "grouped") {
  window.dispatchEvent(
    new CustomEvent(CANVAS_TIDY_UP_TOOL_EVENT, {
      detail: { mode },
    }),
  );
}
