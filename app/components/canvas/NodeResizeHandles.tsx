import type { PointerEvent as ReactPointerEvent } from "react";

export type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type NodeResizeHandlesProps = {
  corners: readonly (readonly [ResizeCorner, string])[];
  visible: boolean;
  labelPrefix: string;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerDown: (
    corner: ResizeCorner,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function NodeResizeHandles({
  corners,
  visible,
  labelPrefix,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: NodeResizeHandlesProps) {
  return (
    <>
      {corners.map(([corner, className]) => (
        <button
          key={corner}
          aria-label={`Resize ${labelPrefix} from ${corner}`}
          className={[
            "absolute h-3 w-3 border border-[#0d99ff] bg-white transition",
            visible ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            className,
          ].join(" ")}
          type="button"
          onPointerCancel={onPointerCancel}
          onPointerDown={(event) => onPointerDown(corner, event)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      ))}
    </>
  );
}

export const IMAGE_RESIZE_CORNERS = [
  ["top-left", "-left-1.5 -top-1.5 cursor-nwse-resize"],
  ["top-right", "-right-1.5 -top-1.5 cursor-nesw-resize"],
  ["bottom-left", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
  ["bottom-right", "-bottom-1.5 -right-1.5 cursor-nwse-resize"],
] as const satisfies readonly (readonly [ResizeCorner, string])[];

export const WEB_RESIZE_CORNERS = [
  ["top-left", "-left-1.5 -top-1.5 cursor-nwse-resize"],
  ["top-right", "-right-1.5 -top-1.5 cursor-nesw-resize"],
  ["bottom-left", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
  ["bottom-right", "-bottom-1.5 -right-1.5 cursor-nwse-resize"],
] as const satisfies readonly (readonly [ResizeCorner, string])[];
