import type { CanvasImageNode } from "@/types/canvas";

function hasDisplayableUrl(node: CanvasImageNode) {
  return node.url.trim().length > 0;
}

/** Keep in-browser blob previews when the server copy is still uploading (empty url). */
export function mergeRemoteImageNodes(
  localNodes: CanvasImageNode[],
  remoteNodes: CanvasImageNode[]
): CanvasImageNode[] {
  const localById = new Map(localNodes.map((node) => [node.id, node]));
  const remoteIds = new Set(remoteNodes.map((node) => node.id));

  const merged = remoteNodes.map((remote) => {
    const local = localById.get(remote.id);

    if (!local) {
      return remote;
    }

    if (remote.storagePath) {
      return remote;
    }

    if (hasDisplayableUrl(local) && !hasDisplayableUrl(remote)) {
      return {
        ...remote,
        url: local.url,
        fileName: local.fileName || remote.fileName,
      };
    }

    return remote;
  });

  for (const local of localNodes) {
    if (!remoteIds.has(local.id) && !local.storagePath) {
      merged.push(local);
    }
  }

  return merged.sort((a, b) => a.zIndex - b.zIndex);
}
