import { ToolbarButton } from "./ToolbarButton";

export function ZoomControls() {
  return (
    <div className="flex items-center gap-0.5 px-0.5">
      <ToolbarButton icon="minus" label="Zoom out" />
      <div className="min-w-12 select-none text-center font-mono text-[11px] font-semibold text-zinc-700">
        100%
      </div>
      <ToolbarButton icon="plus" label="Zoom in" />
    </div>
  );
}
