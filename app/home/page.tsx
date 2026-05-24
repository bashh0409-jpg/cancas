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

  if (!user) redirect("/signin");

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0].replace(/^./, (c) => c.toUpperCase()) ??
    "User";

  return (
    <div className="w-full mx-auto">
      <div className="bg-black/70 p-3 flex border h-screen">
        {/* Sidebar */}
        <div className="h-screen p-4 flex flex-col bg-black/40 backdrop-blur-md border-r border-white/10">
          {/* Logo */}
          <div className="text-2xl font-medium tracking-tight text-white uppercase flex items-center gap-2">
            Slate
            <span className="uppercase bg-white/10 text-[10px] text-white/60 px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
              BETA
            </span>
          </div>

          {/* Nav */}
          <div className="mt-8 flex flex-col gap-2">
            <button className="px-3 py-2 cursor-pointer rounded-lg text-sm text-white/80 bg-white/5 hover:bg-white/10 transition text-left">
              Home
            </button>
            <button className="px-3 py-2 cursor-pointer rounded-lg text-sm text-white/80 bg-white/5 hover:bg-white/10 transition text-left">
              Templates
            </button>
            <button className="px-3 py-2 cursor-pointer rounded-lg text-sm text-white/80 bg-white/5 hover:bg-white/10 transition text-left">
              Library
            </button>
            <button className="px-3 py-2 cursor-pointer rounded-lg text-sm text-white/80 bg-white/5 hover:bg-white/10 transition text-left">
              Your Account
            </button>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="text-sm text-white truncate pixel">{user.email}</div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-3 w-full flex flex-col">
          {/* Top bar: heading left, button right */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <form action={createCanvas} className="">
                <button className="bg-white/20 cursor-pointer pixel text-white rounded-lg px-2 py-2  text-sm">
                  New File
                </button>
              </form>
              <div className="text-white text-sm pixel p-2 bg-white/20 rounded-lg">
                Unlock unlimited creation
                <span className="bg-blue-500 p-1 rounded-lg ml-2">
                  Upgrade to Pro
                </span>
              </div>
            </div>
            <div className="text-white pixel">
              Welcome,{" "}
              <SignOutNameButton
                firstName={firstName}
                signOutAction={signOut}
              />
              !
            </div>
          </div>

          <div className=" p-2 text-white text-sm pixel mt-4 w-full bg-white/10 rounded-lg h-60">
            <div>
              <p>Learn how to use the canvas with our step-by-step guides.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <div className="text-white text-sm pixel mt-2 h-45 w-45 bg-white/10 rounded-lg"></div>
              <div className="text-white text-sm pixel mt-2 h-45 w-45 bg-white/10 rounded-lg"></div>
              <div className="text-white text-sm pixel mt-2 h-45 w-45 bg-white/10 rounded-lg"></div>
              <div className="text-white text-sm pixel mt-2 h-45 w-45 bg-white/10 rounded-lg"></div>
              <div className="text-white text-sm pixel mt-2 h-45 w-45 bg-white/10 rounded-lg"></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-white">
            <h2 className="text-white mt-6 mb-3 text-lg pixel">My Files</h2>
            <div className="flex items-center gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Search files..."
                  className="bg-white/20 py-1 px-4 font-medium tracking-tight rounded-full text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="hidden">grid</button>
            </div>
          </div>

          <div className=" p-2 text-white text-sm pixel mt-4 w-full bg-white/5 rounded-lg h-60">
            <div>
              <p>You don&apos;t have any projects yet</p>
            </div>
            <div className="text-white text-sm pixel mt-2"></div>
          </div>
          {/* Project grid goes here */}
        </div>
      </div>
    </div>
  );
}
