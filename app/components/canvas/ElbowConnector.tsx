"use client";

type Point = {
  x: number;
  y: number;
};

type ElbowConnectorProps = {
  from: Point;
  to: Point;
  fromSize: { width: number; height: number };
  toSize: { width: number; height: number };
  color?: string;
  strokeWidth?: number;
};

function getElbowPath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Determine if we route right or left from source
  const fromExitX = from.x;
  const fromExitY = from.y;

  // Simple vertical-then-horizontal elbow
  const midY = (fromExitY + to.y) / 2;

  return `M ${fromExitX} ${fromExitY} L ${fromExitX} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
}

export function ElbowConnector({
  from,
  to,
  fromSize,
  toSize,
  color = "rgba(255,255,255,0.3)",
  strokeWidth = 1.5,
}: ElbowConnectorProps) {
  const fromCenter = {
    x: from.x + fromSize.width / 2,
    y: from.y + fromSize.height / 2,
  };
  const toCenter = {
    x: to.x + toSize.width / 2,
    y: to.y + toSize.height / 2,
  };

  const fromEdge = {
    x: from.x + fromSize.width,
    y: from.y + fromSize.height / 2,
  };

  const minX = Math.min(fromCenter.x, toCenter.x) - 160;
  const minY = Math.min(fromCenter.y, toCenter.y) - 160;
  const maxX = Math.max(fromCenter.x, toCenter.x) + 160;
  const maxY = Math.max(fromCenter.y, toCenter.y) + 160;

  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;

  if (svgWidth <= 0 || svgHeight <= 0) {
    return null;
  }

  const path = getElbowPath(
    { x: fromEdge.x - minX, y: fromEdge.y - minY },
    { x: toCenter.x - minX, y: to.y - minY },
  );

  return (
    <svg
      style={{
        position: "absolute",
        left: minX,
        top: minY,
        width: svgWidth,
        height: svgHeight,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "visible",
      }}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="4 3"
      />
    </svg>
  );
}