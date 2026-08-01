"use client";

type Point = {
  x: number;
  y: number;
};

type WireType = "line" | "elbow" | "bezier";

type ElbowConnectorProps = {
  from: Point;
  to: Point;
  fromSize: { width: number; height: number };
  toSize: { width: number; height: number };
  wireType?: WireType;
  color?: string;
  strokeWidth?: number;
};

function getElbowPath(from: Point, to: Point): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
}

function getLinePath(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

function getBezierPath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const controlOffsetX = dx * 0.5;
  return `M ${from.x} ${from.y} C ${from.x + controlOffsetX} ${from.y} ${to.x - controlOffsetX} ${to.y} ${to.x} ${to.y}`;
}

export function ElbowConnector({
  from,
  to,
  fromSize,
  toSize,
  wireType = "elbow",
  color = "rgba(255,255,255,0.3)",
  strokeWidth = 3,
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

  const toEdge = {
    x: to.x,
    y: to.y + toSize.height / 2,
  };

  const minX = Math.min(fromCenter.x, toCenter.x, toEdge.x) - 160;
  const minY = Math.min(fromCenter.y, toCenter.y, toEdge.y) - 160;
  const maxX = Math.max(fromCenter.x, toCenter.x, toEdge.x) + 160;
  const maxY = Math.max(fromCenter.y, toCenter.y, toEdge.y) + 160;

  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;

  if (svgWidth <= 0 || svgHeight <= 0) {
    return null;
  }

  const sourcePoint = { x: fromEdge.x - minX, y: fromEdge.y - minY };
  const targetPoint = { x: toEdge.x - minX, y: toEdge.y - minY };
  const path =
    wireType === "line"
      ? getLinePath(sourcePoint, targetPoint)
      : wireType === "bezier"
        ? getBezierPath(sourcePoint, targetPoint)
        : getElbowPath(sourcePoint, targetPoint);

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
