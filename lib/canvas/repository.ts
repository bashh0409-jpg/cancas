import type {
  CanvasContent,
  CanvasListItem,
  CanvasRecord,
} from "@/types/canvas";
import { parseCanvasContent } from "@/types/canvas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid, slugifyCanvasName } from "./slug";

async function createUniqueCanvasSlug(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  excludeCanvasId?: string,
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

function readErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
}

function readErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
}

function readErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  return typeof error.status === "number" ? error.status : null;
}

function isMissingDeletedAtColumn(error: unknown) {
  return (
    readErrorCode(error) === "42703" ||
    /deleted_at/.test(readErrorMessage(error))
  );
}

export async function listUserCanvases(
  supabase: SupabaseClient,
  userId: string,
): Promise<CanvasListItem[]> {
  try {
    const { data, error } = await supabase
      .from("canvases")
      .select("id, slug, name, created_at, updated_at, deleted_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (err: unknown) {
    // If the deleted_at column doesn't exist, fall back to querying without it.
    if (isMissingDeletedAtColumn(err)) {
      const { data, error } = await supabase
        .from("canvases")
        .select("id, slug, name, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    }

    throw err;
  }
}

export async function createUserCanvas(
  supabase: SupabaseClient,
  userId: string,
  name = "Untitled",
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

export async function createUserCanvasWithCreditOnce(
  supabase: SupabaseClient,
  userId: string,
  idempotencyKey: string,
  name = "Untitled",
  creditAmount = 2,
): Promise<{ slug?: string; insufficientCredits: boolean }> {
  const { data, error } = await supabase.rpc(
    "create_user_canvas_with_credit_once",
    {
      p_user_id: userId,
      p_name: name,
      p_credit_amount: creditAmount,
      p_idempotency_key: idempotencyKey,
    },
  );

  if (error) {
    throw error;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Unable to create canvas");
  }

  const response = data as Record<string, unknown>;

  if (response.success !== true) {
    return { insufficientCredits: true };
  }

  if (typeof response.slug !== "string" || response.slug.length === 0) {
    throw new Error("Canvas creation did not return a slug");
  }

  return { slug: response.slug, insufficientCredits: false };
}

export async function getUserCanvas(
  supabase: SupabaseClient,
  userId: string,
  identifier: string,
): Promise<CanvasRecord | null> {
  try {
    let query = supabase
      .from("canvases")
      .select("id, slug, name, content, created_at, updated_at, deleted_at")
      .eq("user_id", userId)
      .is("deleted_at", null);

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
  } catch (err: unknown) {
    if (isMissingDeletedAtColumn(err)) {
      let query = supabase
        .from("canvases")
        .select("id, slug, name, content, created_at, updated_at")
        .eq("user_id", userId);

      query = isUuid(identifier)
        ? query.eq("id", identifier)
        : query.eq("slug", identifier);

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) return null;

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

    throw err;
  }
}

export async function saveUserCanvasContent(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
  content: CanvasContent,
  name?: string,
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
  name: string,
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
  canvasId: string,
) {
  const rootPath = `${userId}/${canvasId}`;

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function listWithRetry(path: string) {
    const bucket = "canvas-files";
    let attempt = 0;
    let delay = 500;

    while (attempt < 6) {
      const { data, error } = await supabase.storage.from(bucket).list(path);

      if (!error) return data ?? [];

      const status = readErrorStatus(error);

      if (status === 429 || status === 503) {
        attempt += 1;
        await wait(delay);
        delay = Math.min(5000, delay * 2);
        continue;
      }

      throw error;
    }

    throw new Error("Exceeded retries listing storage path");
  }

  async function removeWithRetry(paths: string[]) {
    const bucket = "canvas-files";
    let attempt = 0;
    let delay = 500;

    while (attempt < 6) {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      if (!error) return;

      const status = readErrorStatus(error);

      if (status === 429 || status === 503) {
        attempt += 1;
        await wait(delay);
        delay = Math.min(5000, delay * 2);
        continue;
      }

      throw error;
    }

    throw new Error("Exceeded retries removing storage objects");
  }

  const nodeFolders = await listWithRetry(rootPath);

  const pathsToRemove: string[] = [];

  for (const entry of nodeFolders ?? []) {
    if (!entry.name) {
      continue;
    }

    const nodePath = `${rootPath}/${entry.name}`;
    const files = await listWithRetry(nodePath);

    for (const file of files ?? []) {
      if (file.name) {
        pathsToRemove.push(`${nodePath}/${file.name}`);
      }
    }
  }

  if (pathsToRemove.length > 0) {
    await removeWithRetry(pathsToRemove);
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

export async function getUserCanvases(
  supabase: SupabaseClient,
  userId: string,
) {
  try {
    const { data, error } = await supabase
      .from("canvases")
      .select("id,name,slug,deleted_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err: unknown) {
    if (isMissingDeletedAtColumn(err)) {
      const { data, error } = await supabase
        .from("canvases")
        .select("id,name,slug")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    }

    throw err;
  }
}

export async function listUserTrashedCanvases(
  supabase: SupabaseClient,
  userId: string,
): Promise<CanvasListItem[]> {
  try {
    const { data, error } = await supabase
      .from("canvases")
      .select("id,slug,name,created_at,updated_at,deleted_at")
      .eq("user_id", userId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err: unknown) {
    // If deleted_at doesn't exist yet, return empty
    if (isMissingDeletedAtColumn(err)) {
      return [];
    }
    throw err;
  }
}

export async function moveUserCanvasToTrash(
  supabase: SupabaseClient,
  userId: string,
  canvasId: string,
) {
  const deleted_at = new Date().toISOString();

  const { error } = await supabase
    .from("canvases")
    .update({ deleted_at })
    .eq("id", canvasId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function purgeTrashedCanvases(
  supabase: SupabaseClient,
  olderThanDays = 30,
) {
  const cutoff = new Date(
    Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: canvases, error: listError } = await supabase
    .from("canvases")
    .select("id, user_id")
    .lte("deleted_at", cutoff);

  if (listError) {
    throw listError;
  }

  const purged: Array<{ id: string; user_id: string }> = canvases ?? [];

  for (const c of purged) {
    try {
      await deleteUserCanvas(supabase, c.user_id, c.id);
    } catch (e) {
      // continue with others, but surface the error at the end if needed
      console.error("Failed to purge canvas", c.id, e);
    }
  }

  return purged.map((p) => p.id);
}
