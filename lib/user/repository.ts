export async function updateNickname(
  supabase: any,
  userId: string,
  nickname: string,
) {
  const trimmedNickname = nickname.trim();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      nickname: trimmedNickname,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    console.error(error);
    throw error;
  }
}
