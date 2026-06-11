import { ToolbarIcon } from "./ToolbarIcon";

export function ShapeTools() {
  return (
    <div className="group relative">
      <button
        aria-label="Shape tools"
        title="Shape tools"
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-800 transition hover:bg-zinc-100"
      >
        <ToolbarIcon name="square" />
      </button>
      <div className="pointer-events-none absolute bottom-11 left-1/2 flex -translate-x-1/2 translate-y-1 items-center gap-0.5 rounded-xl border border-black/10 bg-white p-1 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.24)] transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <button
          aria-label="Rectangle"
          title="Rectangle"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-800 hover:bg-zinc-100"
        >
          <ToolbarIcon name="square" />
        </button>
        <button
          aria-label="Ellipse"
          title="Ellipse"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-800 hover:bg-zinc-100"
        >
          <ToolbarIcon name="circle" />
        </button>
        <button
          aria-label="Line"
          title="Line"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-800 hover:bg-zinc-100"
        >
          <ToolbarIcon name="line" />
        </button>
      </div>
    </div>
  );
}
