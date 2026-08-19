import { getUserCanvas, getUserCanvases } from "@/lib/canvas/repository";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { EMPTY_CANVAS_CONTENT, parseCanvasContent } from "@/types/canvas";
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
  const user = await getAuthenticatedUser(supabase);

  if (!user) redirect("/signin");

  const canvas = await getUserCanvas(supabase, user.id, id);

  if (!canvas) notFound();

  if (id !== canvas.slug) {
    redirect(`/canvas/${canvas.slug}`);
  }

  const initialContent =
    parseCanvasContent(canvas.content) ?? EMPTY_CANVAS_CONTENT;

  const baseName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")?.[0] ??
    user.email?.split("@")[0] ??
    "User";
  const countryCode = (user.user_metadata?.country as string | undefined) ?? "ZA";

  return (
    <CanvasPageClient
      canvasId={canvas.id}
      canvasName={canvas.name}
      canvases={[]}
      credits={0}
      firstName={baseName}
      lastName={baseName}
      initialContent={initialContent}
      serverUpdatedAt={canvas.updated_at}
      signOutAction={signOut}
      userId={user.id}
      countryCode={countryCode}
    />
  );
}
