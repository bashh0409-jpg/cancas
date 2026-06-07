import { AddFileButton } from "./AddFileButton";
import { AIActionButton } from "./AIActionButton";
import { CanvasModeControls } from "./CanvasModeControls";
import { ShapeTools } from "./ShapeTools";
import { ToolGroup } from "./ToolGroup";
import { ToolbarSeparator } from "./ToolbarSeparator";
import { VoiceNoteToolButton } from "./VoiceNoteToolButton";

type FloatingToolbarProps = {};

export default function FloatingToolbar() {
  return (
    <div
      aria-label="Canvas tools"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-lg border border-black/10 bg-white p-0.5 text-black shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
      role="toolbar"
    >
      <ToolGroup>
        <CanvasModeControls />
      </ToolGroup>
      <ToolbarSeparator />
      <ToolGroup>
        <AddFileButton />
        <ShapeTools />
        <VoiceNoteToolButton />
        <AIActionButton />
      </ToolGroup>
    </div>
  );
}
