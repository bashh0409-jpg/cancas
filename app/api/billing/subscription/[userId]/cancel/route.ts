import { cancelBillingSubscription } from "@/lib/billing/cancel-service";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
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
    const user = await getAuthenticatedUser(supabase);

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createServiceRoleClient();
    const subscription = await cancelBillingSubscription(
      adminSupabase,
      userId,
      immediate,
    );

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
