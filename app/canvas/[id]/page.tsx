import FloatingToolbar from "@/app/components/FloatingToolbar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import CanvasWorkspace from "./CanvasWorkspace";
import { SignOutNameButton } from "../../home/SignOutNameButton";

type CanvasPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CanvasPage({ params }: CanvasPageProps) {
  async function signOut(formData: FormData) {
    "use server";

    void formData;

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/signin");
  }

  const { id } = await params;
  void id;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/signin");
  }

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0].replace(/^./, (c) => c.toUpperCase()) ??
    "User";
  
  const credits = 2332; // TODO: Fetch from Supabase

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#111111]">
      <CanvasWorkspace />
      <div className="absolute left-0 top-0 z-50 flex w-full items-center justify-between p-4">
        <Link
          href="/home"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 border border-white/15 transition hover:bg-white/15"
        >
          <svg
            fill="currentColor"
            width="20"
            height="20"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M26.025 14.496l-14.286-.001 6.366-6.366L15.979 6 5.975 16.003 15.971 26l2.129-2.129-6.367-6.366h14.29z" />
          </svg>
        </Link>
        <div className="pixel text-sm tracking-tight text-white">
          You have {credits} credits left.
        </div>
      </div>

      <div className="absolute left-0 bottom-0 z-50 flex w-full items-center justify-between p-4">
        <div className="pixel text-sm tracking-tight text-white">
          Auto-saving is on.
        </div>
        <div className="pixel text-sm tracking-tight text-white">
          Let&apos;s do this thing{" "}
          <SignOutNameButton firstName={firstName} signOutAction={signOut} />
        </div>
      </div>

      <FloatingToolbar />
    </main>
  );
}
