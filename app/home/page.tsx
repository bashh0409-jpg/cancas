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

  // At the top of the file, add this above the component:
  const TUTORIAL_VIDEOS = [
    { id: "dQw4w9WgXcQ", title: "Getting Started with Slate" },
    { id: "jNQXAC9IVRw", title: "Canvas Basics" },
    { id: "9bZkp7q19f0", title: "Shapes & Layers" },
    { id: "kJQP7kiw5Fk", title: "Text & Typography" },
    { id: "OPf0YbXqDm0", title: "Exporting Your Work" },
  ];

  return (
    <div className="min-h-screen bg-black/70">
      {/* Mobile top bar — only visible on small screens */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="text-xl font-medium tracking-tight text-white uppercase flex items-center gap-2">
          Slate
          <span className="uppercase bg-white/10 text-[10px] text-white/60 px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
            BETA
          </span>
        </div>
        <div className="text-white pixel text-sm truncate max-w-[140px]">
          {user.email}
        </div>
      </div>

      <div className="flex h-[calc(100vh-49px)] md:h-screen border border-white/10">
        {/* Sidebar — hidden on mobile, fixed width on md+ */}
        <aside className="hidden md:flex w-52 shrink-0 flex-col p-4 bg-black/40 backdrop-blur-md border-r border-white/10">
          <div className="text-2xl font-medium tracking-tight text-white uppercase flex items-center gap-2">
            Slate
            <span className="uppercase bg-white/10 text-[10px] text-white/60 px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
              BETA
            </span>
          </div>

          <nav className="mt-8 flex flex-col gap-2">
            {["Home", "Templates", "Library", "Your Account"].map((label) => (
              <button
                key={label}
                className="px-3 py-2 cursor-pointer rounded-lg text-sm text-white/80 bg-white/5 hover:bg-white/10 transition text-left"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="text-sm text-white truncate pixel">
              {user.email}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 md:p-4 flex flex-col gap-4">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <form action={createCanvas}>
                <button className="bg-white/20 cursor-pointer pixel text-white rounded-lg px-3 py-2 text-sm">
                  New File
                </button>
              </form>
              <div className="text-white text-sm pixel px-3 py-2 bg-white/20 rounded-lg flex items-center gap-2 flex-wrap">
                Unlock unlimited creation
                <span className="bg-blue-500 px-2 py-1 rounded-lg text-xs">
                  Upgrade to Pro
                </span>
              </div>
            </div>
            <div className="text-white pixel text-sm">
              Welcome,{" "}
              <SignOutNameButton
                firstName={firstName}
                signOutAction={signOut}
              />
              !
            </div>
          </div>

          {/* Tutorial banner */}
          <div className="p-3 text-white text-sm pixel bg-white/10 rounded-lg">
            <p className="mb-3">
              Learn how to use the canvas with our step-by-step guides.
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  // min-w so cards don't shrink on small screens
                  className="shrink-0 min-w-[200px] h-36 bg-white/10 rounded-lg"
                />
              ))}
            </div>
          </div>

          {/* My Files header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <h2 className="text-white text-lg pixel">My Files</h2>
            <input
              type="text"
              placeholder="Search files..."
              className="bg-white/20 py-1 px-4 font-medium tracking-tight rounded-full text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
            />
          </div>

          {/* Empty state */}
          <div className="p-3 text-white text-sm pixel bg-white/5 rounded-lg min-h-[200px] flex items-start">
            <p>You don&apos;t have any projects yet</p>
          </div>
        </main>
      </div>
    </div>
  );
}
