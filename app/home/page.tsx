import { ClearLocalDataOnQuery } from "@/app/components/home/ClearLocalDataOnQuery";
import { CreditNotifier } from "@/app/components/home/CreditNotifier";
import { createCanvasAction } from "@/app/home/actions";
import { listUserCanvases } from "@/lib/canvas/repository";
import { getUserCredits } from "@/lib/credits/repository";
import { createClient } from "@/lib/supabase/server";
import type { CanvasListItem } from "@/types/canvas";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import MobileNotifier from "@/app/components/home/MobileNotifier";
import { HomeShell } from "@/app/components/home/HomeShell";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { error?: string | string[] };
}) {
  const errorMessage =
    searchParams.error === "no_credits"
      ? "No credits available. Unable to create a new file."
      : undefined;

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
  const lastName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[1] ??
    "User";
  const fullName = `${firstName} ${lastName}`;

  let canvases: CanvasListItem[] = [];
  let projectsError: string | null = null;
  let credits = 0;

  const setActivePage = async (page: string) => {
    "use server";
    void page;
  };
  
  try {
    canvases = await listUserCanvases(supabase, user.id);
  } catch {
    projectsError =
      "Could not load projects. Refresh this page.";
  }

  try {
    credits = await getUserCredits(supabase, user.id);
  } catch {
    // Silently fail
  }

  return (
    <div className="min-h-screen bg-black/70">
      <MobileNotifier
        fullName={user?.user_metadata?.full_name}
        email={user?.email}
        credits={credits}
        signOut={signOut}
        setActivePage={setActivePage}
      />
      <div className="hidden md:block">
        <CreditNotifier message={errorMessage} />
        <Suspense fallback={null}>
          <ClearLocalDataOnQuery />
        </Suspense>

        <HomeShell
          firstName={firstName}
          lastName={lastName}
          canvases={canvases}
          credits={credits}
          projectsError={projectsError}
          errorMessage={errorMessage}
          createCanvasAction={createCanvasAction}
          signOut={signOut}
        />
      </div>
    </div>
  );
}
