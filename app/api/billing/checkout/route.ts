import { createBillingCheckout } from "@/lib/billing/checkout-service";
import {
  IdempotencyKeyError,
  requireIdempotencyKey,
  userScopedIdempotencyKey,
} from "@/lib/idempotency";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      plan,
      billingCycle = "monthly",
      countryCode,
      returnUrl,
      cancelUrl,
      idempotencyKey,
    } = body;

    const normalizedIdempotencyKey = userScopedIdempotencyKey(
      user.id,
      requireIdempotencyKey(idempotencyKey),
    );

    const normalizedBillingCycle =
      billingCycle === "annually" ? "annual" : billingCycle;

    if (!plan || !countryCode) {
      return NextResponse.json(
        { error: "Missing required fields: plan, countryCode" },
        { status: 400 },
      );
    }

    if (!["starter", "pro", "ultra"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!["monthly", "annual"].includes(normalizedBillingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle" },
        { status: 400 },
      );
    }

    const fullName =
      (user.user_metadata?.full_name as string | undefined) ?? "User";
    const [firstName, ...lastParts] = fullName.split(" ");

    const adminSupabase = createServiceRoleClient();
    const result = await createBillingCheckout(adminSupabase, {
      userId: user.id,
      userEmail: user.email ?? "",
      firstName: firstName || "User",
      lastName: lastParts.join(" "),
      plan,
      billingCycle: normalizedBillingCycle,
      countryCode,
      returnUrl,
      cancelUrl,
      idempotencyKey: normalizedIdempotencyKey,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      provider: result.provider,
      subscriptionId: user.id,
    });
  } catch (error) {
    if (error instanceof IdempotencyKeyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Checkout error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to initialize checkout";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
