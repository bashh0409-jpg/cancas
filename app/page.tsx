import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";

export default async function Home() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  return <HomeClient user={user} />;
}
