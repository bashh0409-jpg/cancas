import FloatingToolbar from "@/app/components/FloatingToolbar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type CanvasPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { id } = await params;
  void id;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/signin");
  }

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#111111]">
      <Link
        href="/home"
        className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1.5 font-mono text-sm font-semibold tracking-tight text-black transition hover:bg-white/85"
      >
        Back
      </Link>
      <FloatingToolbar />
      <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:32px_32px]" />
    </main>
  );
}
