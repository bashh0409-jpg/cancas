import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutNameButton } from "./SignOutNameButton";

export default async function HomePage() {
  async function createCanvas(formData: FormData) {
    "use server";

    void formData;

    redirect(`/canvas/${crypto.randomUUID()}`);
  }

  async function signOut(formData: FormData) {
    "use server";

    void formData;

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/signin");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/signin");
  }

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0].replace(/^./, (c) => c.toUpperCase()) ??
    "User";
  
  return (
    <div className="bg-black/70 p-3 h-screen">
      <div className="text-white pixel">
        Welcome,{" "}
        <SignOutNameButton firstName={firstName} signOutAction={signOut} />
        !
      </div>
      <form action={createCanvas}>
        <button className="bg-white font-mono font-semibold tracking-tight rounded-full px-2 py-1 text-sm">
          New File
        </button>
      </form>
    </div>
  );
}
