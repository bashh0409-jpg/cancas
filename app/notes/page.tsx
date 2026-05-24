import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function HomePage() {
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
    <div className="flex min-h-screen w-full bg-black dark:bg-black text-zinc-950 dark:text-zinc-50">
      <aside className="min-h-screen w-[320px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-black/90 dark:bg-black p-6">
        <h1 className="geom hidden font-semibold tracking-tight">SLATE</h1>
        <div className="flex flex-row items-center gap-2 w-fit py-1.5 px-2 text-sm rounded-lg">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white transition hover:bg-zinc-100">
            <Image
              src="https://lh3.googleusercontent.com/a/ACg8ocK-OFyiW8vTiD6rnmaVc8GUWj2z8OrrY9G35nHENdvAwPhX-w=s96-c"
              alt="Terminal icon"
              width={100}
              height={100}
              className="rounded-full"
            />
          </div>
          <div className="text-sm font-medium tracking-tight">{firstName}</div>
        </div>

        <button className="mt-4 flex items-center gap-2 rounded-sm lime py-1.5 px-3">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#0d0c0d"
              viewBox="0 0 256 256"
            >
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
            </svg>
          </span>
          <span className="text-sm font-medium tracking-tight">
            Create New File
          </span>
        </button>

        <div className="flex mt-4 flex-row items-center gap-2 py-1.5 px-2 text-sm rounded-full border border-zinc-200 dark:border-zinc-700 w-full">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="text-sm font-medium tracking-tight bg-transparent focus:outline-none text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
      </aside>

      <main className="min-h-screen w-full flex flex-col">
        <div className="flex items-center justify-end gap-2 p-1">
          <button className="flex items-center gap-2 rounded-sm lime py-1.5 px-3">
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="#0d0c0d"
                viewBox="0 0 256 256"
              >
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
              </svg>
            </span>
            <span className="text-sm font-medium tracking-tight">
              Create New File
            </span>
          </button>

          <button
            type="button"
            aria-label="Import"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-black dark:text-white"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9.5a.5.5 0 0 0-1 0V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3a.5.5 0 0 0 0-1zm9 0a5.5 5.5 0 0 0-5.5 5.5v1.793l-1.646-1.647a.5.5 0 0 0-.708.708l2.5 2.5a.5.5 0 0 0 .708 0l2.5-2.5a.5.5 0 0 0-.708-.708L12.5 13.293V11.5A4.5 4.5 0 0 1 17 7h.5a.5.5 0 0 0 0-1z"
              />
            </svg>
          </button>
        </div>

        <div className="h-full w-full bg-zinc-50 dark:bg-zinc-900"></div>
      </main>
    </div>
  );
}
