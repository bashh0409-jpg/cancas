import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deleteAccountAction } from "@/app/actions/account/deleteAccountAction";
import DeleteAccountPage from "./DeleteAccountPage";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Delete account",
  robots: { index: false, follow: false },
};

export default async function AccountDeletePage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) redirect("/signin");

  const username =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "user";

  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
  }

  return (
    <DeleteAccountPage
      username={username}
      deleteAccountAction={deleteAccountAction}
      signOut={signOut}
    />
  );
}
