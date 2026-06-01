"use client";

import { activateCanvasTextTool } from "@/lib/canvas/textToolEvents";
import { ToolbarButton } from "./ToolbarButton";

export function TextToolButton() {
  return (
    <ToolbarButton
      icon="text"
      label="Text"
      onClick={activateCanvasTextTool}
    />
  );
}
