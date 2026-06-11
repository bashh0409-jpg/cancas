import { ToolbarButton } from "./ToolbarButton";

export function CanvasModeControls() {
  return (
    <>
      <ToolbarButton active icon="arrow" label="Select" />
      <ToolbarButton icon="hand" label="Pan" />
      <ToolbarButton icon="frame" label="Frame" />
    </>
  );
}
