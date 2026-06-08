export async function getUserCanvases(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("canvases")
    .select("id,name,slug")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
