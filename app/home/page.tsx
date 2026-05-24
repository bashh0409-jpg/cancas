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
    <div className="w-[80%]">
    <div className="bg-black/70 p-3 flex border h-screen">
      <div className="p-3 h-screen">
        <div className="text-white pixel">
          Welcome,{" "}
          <SignOutNameButton firstName={firstName} signOutAction={signOut} />!
        </div>
        <div className="mt-12 text-white flex text-base flex-col w-50 gap-2">
          <button className="px-2 py-1  bg-white/20 rounded-lg w-full">
            Home
          </button>
          <button className="px-2 py-1  bg-white/20 rounded-lg w-full">
            Templates
          </button>
          <button className="px-2 py-1 bg-white/20 rounded-lg w-full">
            Library
          </button>
          <button className="px-2 py-1  bg-white/20 rounded-lg w-full">
            Your Account
          </button>
        </div>
      </div>

      <div className="p-3 w-full flex flexlcol">
          <form action={createCanvas}>
        <button className="bg-white absolute right-4 font-mono font-semibold tracking-tight rounded-lg px-2 py-1 text-sm">
          New File
        </button>
        </form> 

        <div className="pixel text-whitz">
          <h1>My Projects</h1>
        </div>
        
      </div>


    </div></div>
  );
}
