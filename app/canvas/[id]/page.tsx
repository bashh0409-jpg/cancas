import { getUserCanvas } from "@/lib/canvas/repository";
import { getUserCredits } from "@/lib/credits/repository";
import { createClient } from "@/lib/supabase/server";
import {
  EMPTY_CANVAS_CONTENT,
  parseCanvasContent,
} from "@/types/canvas";
import { notFound, redirect } from "next/navigation";
import CanvasPageClient from "./CanvasPageClient";

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

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/signin");
  }

  let canvas;

  try {
    canvas = await getUserCanvas(supabase, user.id, id);
  } catch {
    notFound();
  }

  if (!canvas) {
    notFound();
  }

  if (id !== canvas.slug) {
    redirect(`/canvas/${canvas.slug}`);
  }

  const initialContent =
    parseCanvasContent(canvas.content) ?? EMPTY_CANVAS_CONTENT;

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0].replace(/^./, (c) => c.toUpperCase()) ??
    "User";

  const credits = await getUserCredits(supabase, user.id);

  return (
    <CanvasPageClient
      canvasId={canvas.id}
      canvasName={canvas.name}
      credits={credits}
      firstName={firstName}
      initialContent={initialContent}
      serverUpdatedAt={canvas.updated_at}
      signOutAction={signOut}
      userId={user.id}
    />
  );
}
