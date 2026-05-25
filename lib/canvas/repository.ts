import type { CanvasContent, CanvasListItem, CanvasRecord } from "@/types/canvas";
import { parseCanvasContent } from "@/types/canvas";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function listUserCanvases(
  supabase: SupabaseClient,
  userId: string
): Promise<CanvasListItem[]> {
  const { data, error } = await supabase
    .from("canvases")
    .select("id, name, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createUserCanvas(
  supabase: SupabaseClient,
  userId: string,
  name = "Untitled"
): Promise<string> {
  const { data, error } = await supabase
    .from("canvases")
    .insert({
      user_id: userId,
      name,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create canvas");
  }

  return data.id;
}

export async function getUserCanvas(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string
): Promise<CanvasRecord | null> {
  const { data, error } = await supabase
    .from("canvases")
    .select("id, name, content, created_at, updated_at")
    .eq("id", canvasId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const parsedContent = parseCanvasContent(data.content);

  return {
    id: data.id,
    name: data.name,
    content: parsedContent ?? {},
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function saveUserCanvasContent(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  content: CanvasContent,
  name?: string
) {
  const payload: {
    content: CanvasContent;
    updated_at: string;
    name?: string;
  } = {
    content,
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) {
    payload.name = name;
  }

  const { error } = await supabase
    .from("canvases")
    .update(payload)
    .eq("id", canvasId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
