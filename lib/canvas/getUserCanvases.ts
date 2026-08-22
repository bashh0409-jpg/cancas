export async function getUserCanvases(
  supabase: any,
  userId: string,
): Promise<Array<{ id: string; name: string; slug: string; size_bytes: number }>> {
  const { data, error } = await supabase
    .from("canvases")
    .select("id,name,slug,content")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((canvas: any) => ({
    id: canvas.id,
    name: canvas.name,
    slug: canvas.slug,
    size_bytes: new TextEncoder().encode(
      JSON.stringify(canvas.content ?? {}),
    ).length,
  }));
}
