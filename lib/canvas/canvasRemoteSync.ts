import { parseCanvasContent, type CanvasContent } from "@/types/canvas";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RemoteCanvasUpdate = {
  content: CanvasContent;
  updatedAt: string;
  name: string;
};

export function subscribeToCanvasUpdates(
  supabase: SupabaseClient,
  canvasId: string,
  onUpdate: (update: RemoteCanvasUpdate) => void
) {
  const channel = supabase
    .channel(`canvas-sync:${canvasId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "canvases",
        filter: `id=eq.${canvasId}`,
      },
      (payload) => {
        const row = payload.new as {
          content?: unknown;
          updated_at?: string;
          name?: string;
        };

        const content = parseCanvasContent(row.content);

        if (!content || !row.updated_at) {
          return;
        }

        onUpdate({
          content,
          updatedAt: row.updated_at,
          name: typeof row.name === "string" ? row.name : "Untitled",
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function fetchRemoteCanvasUpdate(
  canvasId: string
): Promise<RemoteCanvasUpdate | null> {
  const response = await fetch(`/api/canvases/${canvasId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    content?: unknown;
    updated_at?: string;
    name?: string;
  };

  const content = parseCanvasContent(data.content);

  if (!content || !data.updated_at) {
    return null;
  }

  return {
    content,
    updatedAt: data.updated_at,
    name: typeof data.name === "string" ? data.name : "Untitled",
  };
}
