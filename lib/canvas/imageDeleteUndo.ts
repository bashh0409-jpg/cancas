export const IMAGE_DELETE_UNDO_LIMIT = 50;

export type PendingUploadSnapshot = {
  file: File;
  blobUrl: string;
};

export type ImageDeleteUndoEntry = {
  nodes: Array<{
    id: string;
    fileName: string;
    url: string;
    storagePath?: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
  }>;
  selectedIds: string[];
  pendingByNodeId: Record<string, PendingUploadSnapshot>;
};
