import type { Metadata } from "next";
import { ClearLocalDataOnQuery } from "@/app/components/home/ClearLocalDataOnQuery";
import { CreditNotifier } from "@/app/components/home/CreditNotifier";
import { createCanvasAction } from "@/app/home/actions";
import { listUserCanvases } from "@/lib/canvas/repository";
import { getUserCredits } from "@/lib/credits/repository";
import {
  getUserSettings,
  type UserSettings,
} from "@/lib/user/settingsRepository";
import { createClient } from "@/lib/supabase/server";
import type { CanvasListItem } from "@/types/canvas";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import MobileNotifier from "@/app/components/home/MobileNotifier";
import { HomeShell } from "@/app/components/home/HomeShell";
import { updateNicknameAction } from "@/app/actions/updateNicknameAction";
import { updateSettingsAction } from "@/app/actions/updateSettingsAction";
import { deleteAccountAction } from "@/app/actions/account/deleteAccountAction";
import NewReleaseUpdate from "@/app/components/home/NewReleasUpdate";

export const metadata: Metadata = {
  title: "REFLOW",
  description:
    "discover the power of collaborative creativity with Reflow, the ultimate canvas for your ideas.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const errorMessage =
    resolvedSearchParams.error === "no_credits"
      ? "You’ve run out of credits."
      : undefined;

  async function signOut() {
    "use server";
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
  const photoUrl = user.user_metadata?.avatar_url as string | undefined;

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
    projectsError = "Something went wrong. Please refresh to try again.";
  }

  try {
    credits = await getUserCredits(supabase, user.id);
  } catch {
    // Silently fail
  }

  let settings: UserSettings = {
    product_updates: true,
    canvas_activity: true,
  };

  try {
    settings = await getUserSettings(supabase, user.id);
  } catch {
    // Silently fail and fall back to defaults.
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-black/70">
      <MobileNotifier
        fullName={user?.user_metadata?.full_name}
        email={user?.email}
        photoUrl={photoUrl}
        credits={credits}
        signOut={signOut}
        setActivePage={setActivePage}
      />
      <div className="hidden md:block">
        <CreditNotifier message={errorMessage} />
        <Suspense fallback={null}>
          <ClearLocalDataOnQuery />
        </Suspense>
        <div className="absolute z-50 w-full">
          <NewReleaseUpdate userId={user.id} />
        </div>

        <HomeShell
          firstName={firstName}
          lastName={lastName}
          photoUrl={photoUrl}
          canvases={canvases}
          credits={credits}
          projectsError={projectsError}
          errorMessage={errorMessage}
          createCanvasAction={createCanvasAction}
          signOut={signOut}
          deleteAccountAction={deleteAccountAction}
          profile={{
            firstName,
            lastName,
            email: user.email ?? "",
            nickname: profile?.nickname ?? "",
          }}
          updateNicknameAction={updateNicknameAction}
          updateSettingsAction={updateSettingsAction}
          userSettings={settings}
        />
      </div>
    </div>
  );
}
