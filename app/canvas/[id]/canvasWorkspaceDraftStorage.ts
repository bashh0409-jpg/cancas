import { parseCanvasContent, type CanvasContent } from "@/types/canvas";
import type { LocalCanvasDraft } from "./canvasWorkspaceTypes";

export function getLocalDraftKey(canvasId: string) {
  return `canvasai:canvas:${canvasId}:draft`;
}

export function readLocalCanvasDraft(
  canvasId: string,
  serverUpdatedAt: string,
): LocalCanvasDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(getLocalDraftKey(canvasId));

    if (!rawDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(rawDraft) as Record<string, unknown>;
    const content = parseCanvasContent(parsedDraft.content);
    const savedAt =
      typeof parsedDraft.savedAt === "string" ? parsedDraft.savedAt : null;
    const draftServerUpdatedAt =
      typeof parsedDraft.serverUpdatedAt === "string"
        ? parsedDraft.serverUpdatedAt
        : "";
    const syncedAt =
      typeof parsedDraft.syncedAt === "string"
        ? parsedDraft.syncedAt
        : undefined;

    if (!content || !savedAt) {
      return null;
    }

    const savedTime = Date.parse(savedAt);
    const syncedTime = syncedAt ? Date.parse(syncedAt) : 0;
    const serverTime = Date.parse(serverUpdatedAt);

    if (Number.isNaN(savedTime)) {
      return null;
    }

    const hasUnsyncedChanges = !syncedAt || savedTime > syncedTime;
    const isNewerThanServer =
      Number.isNaN(serverTime) || savedTime > serverTime;

    if (!hasUnsyncedChanges && !isNewerThanServer) {
      return null;
    }

    return {
      content,
      savedAt,
      serverUpdatedAt: draftServerUpdatedAt,
      syncedAt,
    };
  } catch {
    return null;
  }
}

export function writeLocalCanvasDraft(
  canvasId: string,
  content: CanvasContent,
  serverUpdatedAt: string,
  syncedAt?: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const savedAt = new Date().toISOString();
    const draft: LocalCanvasDraft = {
      content,
      savedAt,
      serverUpdatedAt,
      syncedAt,
    };

    window.localStorage.setItem(
      getLocalDraftKey(canvasId),
      JSON.stringify(draft),
    );
  } catch {
    // localStorage can be full or unavailable; Supabase autosave still runs.
  }
}

export function markLocalCanvasDraftSynced(
  canvasId: string,
  content: CanvasContent,
  serverUpdatedAt: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const syncedAt = new Date().toISOString();
    const draft: LocalCanvasDraft = {
      content,
      savedAt: syncedAt,
      serverUpdatedAt,
      syncedAt,
    };

    window.localStorage.setItem(
      getLocalDraftKey(canvasId),
      JSON.stringify(draft),
    );
  } catch {
    // Best-effort backup only.
  }
}
