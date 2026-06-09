import { createClient } from "@/lib/supabase/server";
import { cancelSubscription } from "@/lib/subscriptions/repository";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = await req.json();
    const { immediate = false } = body;

    const supabase = await createClient();

    // Verify the requesting user owns this subscription
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await cancelSubscription(supabase, userId, immediate);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
