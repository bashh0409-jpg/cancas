import type { CanvasContent, CanvasListItem, CanvasRecord } from "@/types/canvas";
import { parseCanvasContent } from "@/types/canvas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid, slugifyCanvasName } from "./slug";

async function createUniqueCanvasSlug(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  excludeCanvasId?: string
) {
  const baseSlug = slugifyCanvasName(name);

  for (let index = 0; index < 100; index += 1) {
    const slug = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    let query = supabase
      .from("canvases")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", slug)
      .limit(1);

    if (excludeCanvasId) {
      query = query.neq("id", excludeCanvasId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return slug;
    }
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function listUserCanvases(
  supabase: SupabaseClient,
  userId: string
): Promise<CanvasListItem[]> {
  const { data, error } = await supabase
    .from("canvases")
    .select("id, slug, name, created_at, updated_at")
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
  const slug = await createUniqueCanvasSlug(supabase, userId, name);
  const { data, error } = await supabase
    .from("canvases")
    .insert({
      user_id: userId,
      name,
      slug,
    })
    .select("slug")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create canvas");
  }

  return data.slug;
}

export async function getUserCanvas(
  supabase: SupabaseClient,
  userId: string,
  identifier: string
): Promise<CanvasRecord | null> {
  let query = supabase
    .from("canvases")
    .select("id, slug, name, content, created_at, updated_at")
    .eq("user_id", userId);

  query = isUuid(identifier)
    ? query.eq("id", identifier)
    : query.eq("slug", identifier);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const parsedContent = parseCanvasContent(data.content);

  return {
    id: data.id,
    slug: data.slug,
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
): Promise<{ updated_at: string }> {
  const updated_at = new Date().toISOString();
  const payload: {
    content: CanvasContent;
    updated_at: string;
    name?: string;
  } = {
    content,
    updated_at,
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

  return { updated_at };
}

export async function updateUserCanvasName(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  name: string
): Promise<{ updated_at: string; slug: string }> {
  const updated_at = new Date().toISOString();
  const slug = await createUniqueCanvasSlug(supabase, userId, name, canvasId);
  const { error } = await supabase
    .from("canvases")
    .update({
      name,
      slug,
      updated_at,
    })
    .eq("id", canvasId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return { updated_at, slug };
}

export async function deleteUserCanvas(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string
) {
  const rootPath = `${userId}/${canvasId}`;
  const { data: nodeFolders, error: listError } = await supabase.storage
    .from("canvas-files")
    .list(rootPath);

  if (listError) {
    throw listError;
  }

  const pathsToRemove: string[] = [];

  for (const entry of nodeFolders ?? []) {
    if (!entry.name) {
      continue;
    }

    const nodePath = `${rootPath}/${entry.name}`;
    const { data: files } = await supabase.storage
      .from("canvas-files")
      .list(nodePath);

    for (const file of files ?? []) {
      if (file.name) {
        pathsToRemove.push(`${nodePath}/${file.name}`);
      }
    }
  }

  if (pathsToRemove.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("canvas-files")
      .remove(pathsToRemove);

    if (removeError) {
      throw removeError;
    }
  }

  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", canvasId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
