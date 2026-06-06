export type LayoutKind = "grid" | "pinterest";

export type LayoutDirection = "vertical" | "horizontal";

export type LayoutPoint = {
  x: number;
  y: number;
};

export type LayoutSize = {
  width: number;
  height: number;
};

export type LayoutImageInput = {
  id: string;
  width: number;
  height: number;
};

export type LayoutImageOutput = {
  id: string;
  position: LayoutPoint;
  size: LayoutSize;
};

export type ArrangeImagesOptions = {
  origin: LayoutPoint;
  direction?: LayoutDirection;
  gap?: number;
  /** Columns for vertical layouts, rows for horizontal layouts */
  tracks?: number;
  /** Grid cell edge length */
  cellSize?: number;
  /** Pinterest column width (vertical) */
  columnWidth?: number;
  /** Pinterest row height (horizontal) */
  rowHeight?: number;
};

export type LayoutArrangeRequest = {
  kind: LayoutKind;
  direction: LayoutDirection;
  size: number;
  tracks: number;
  gap?: number;
};

const DEFAULT_GAP = 16;
const DEFAULT_CELL = 200;
const DEFAULT_COLUMN = 220;
const DEFAULT_ROW = 180;

function fitInsideCell(
  width: number,
  height: number,
  cellSize: number,
): LayoutSize {
  const aspect = width / height;

  if (aspect >= 1) {
    const nextWidth = cellSize;
    const nextHeight = Math.max(1, Math.round(cellSize / aspect));

    if (nextHeight <= cellSize) {
      return { width: nextWidth, height: nextHeight };
    }
  }

  const nextHeight = cellSize;
  const nextWidth = Math.max(1, Math.round(cellSize * aspect));

  return { width: nextWidth, height: nextHeight };
}

export function getDefaultTrackCount(count: number, maxTracks: number) {
  return Math.min(maxTracks, Math.max(1, Math.ceil(Math.sqrt(count))));
}

export function getDefaultLayoutSize(
  kind: LayoutKind,
  direction: LayoutDirection,
) {
  if (kind === "grid") {
    return DEFAULT_CELL;
  }

  return direction === "horizontal" ? DEFAULT_ROW : DEFAULT_COLUMN;
}

function resolveTracks(
  count: number,
  tracks: number | undefined,
  maxTracks: number,
) {
  return tracks ?? getDefaultTrackCount(count, maxTracks);
}

export function arrangeImagesGrid(
  nodes: LayoutImageInput[],
  options: ArrangeImagesOptions,
): LayoutImageOutput[] {
  const gap = options.gap ?? DEFAULT_GAP;
  const cellSize = options.cellSize ?? DEFAULT_CELL;
  const direction = options.direction ?? "vertical";
  const { origin } = options;

  if (direction === "horizontal") {
    const rows = resolveTracks(nodes.length, options.tracks, 6);

    return nodes.map((node, index) => {
      const row = index % rows;
      const column = Math.floor(index / rows);
      const size = fitInsideCell(node.width, node.height, cellSize);

      return {
        id: node.id,
        position: {
          x: origin.x + column * (cellSize + gap),
          y: origin.y + row * (cellSize + gap),
        },
        size,
      };
    });
  }

  const columns = resolveTracks(nodes.length, options.tracks, 6);

  return nodes.map((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const size = fitInsideCell(node.width, node.height, cellSize);

    return {
      id: node.id,
      position: {
        x: origin.x + column * (cellSize + gap),
        y: origin.y + row * (cellSize + gap),
      },
      size,
    };
  });
}

export function arrangeImagesPinterest(
  nodes: LayoutImageInput[],
  options: ArrangeImagesOptions,
): LayoutImageOutput[] {
  const gap = options.gap ?? 12;
  const direction = options.direction ?? "vertical";
  const { origin } = options;

  if (direction === "horizontal") {
    const rowHeight = options.rowHeight ?? DEFAULT_ROW;
    const rows = resolveTracks(nodes.length, options.tracks, 5);
    const rowWidths = Array.from({ length: rows }, () => 0);

    // Sort by aspect ratio but distribute to avoid clustering similar sizes
    const sorted = [...nodes].sort(
      (a, b) => b.width / b.height - a.width / a.height,
    );

    // Round-robin assignment with aspect ratio awareness
    const assigned = sorted.map((node, index) => ({
      node,
      row: index % rows,
    }));

    // Sort by assigned row, then by aspect ratio within row for balance
    assigned.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return b.node.width / b.node.height - a.node.width / a.node.height;
    });

    return assigned.map(({ node }) => {
      const aspect = node.width / node.height;
      const width = Math.max(1, Math.round(rowHeight * aspect));
      const row = rowWidths.indexOf(Math.min(...rowWidths));
      const y = origin.y + row * (rowHeight + gap);
      const x = origin.x + rowWidths[row];

      rowWidths[row] += width + gap;

      return {
        id: node.id,
        position: { x, y },
        size: { width, height: rowHeight },
      };
    });
  }

  const columnWidth = options.columnWidth ?? DEFAULT_COLUMN;
  const columns = resolveTracks(nodes.length, options.tracks, 5);
  const columnHeights = Array.from({ length: columns }, () => 0);

  // Sort by aspect ratio but distribute to avoid clustering similar sizes
  const sorted = [...nodes].sort(
    (a, b) => b.height / b.width - a.height / a.width,
  );

  // Round-robin assignment with aspect ratio awareness
  const assigned = sorted.map((node, index) => ({
    node,
    column: index % columns,
  }));

  // Sort by assigned column, then by aspect ratio within column for balance
  assigned.sort((a, b) => {
    if (a.column !== b.column) return a.column - b.column;
    return b.node.height / b.node.width - a.node.height / a.node.width;
  });

  return assigned.map(({ node }) => {
    const aspect = node.width / node.height;
    const height = Math.max(1, Math.round(columnWidth / aspect));
    const column = columnHeights.indexOf(Math.min(...columnHeights));
    const x = origin.x + column * (columnWidth + gap);
    const y = origin.y + columnHeights[column];

    columnHeights[column] += height + gap;

    return {
      id: node.id,
      position: { x, y },
      size: { width: columnWidth, height },
    };
  });
}

export function arrangeImages(
  nodes: LayoutImageInput[],
  kind: LayoutKind,
  options: ArrangeImagesOptions,
): LayoutImageOutput[] {
  if (nodes.length === 0) {
    return [];
  }

  if (kind === "pinterest") {
    return arrangeImagesPinterest(nodes, options);
  }

  return arrangeImagesGrid(nodes, options);
}

export function arrangeImagesFromRequest(
  nodes: LayoutImageInput[],
  origin: LayoutPoint,
  request: LayoutArrangeRequest,
): LayoutImageOutput[] {
  const baseOptions: ArrangeImagesOptions = {
    origin,
    direction: request.direction,
    tracks: request.tracks,
    gap: request.gap,
  };

  if (request.kind === "grid") {
    return arrangeImages(nodes, "grid", {
      ...baseOptions,
      cellSize: request.size,
    });
  }

  if (request.direction === "horizontal") {
    return arrangeImages(nodes, "pinterest", {
      ...baseOptions,
      rowHeight: request.size,
    });
  }

  return arrangeImages(nodes, "pinterest", {
    ...baseOptions,
    columnWidth: request.size,
  });
}

export function getSelectionOrigin(
  nodes: { position: LayoutPoint }[],
): LayoutPoint {
  return {
    x: Math.min(...nodes.map((node) => node.position.x)),
    y: Math.min(...nodes.map((node) => node.position.y)),
  };
}
