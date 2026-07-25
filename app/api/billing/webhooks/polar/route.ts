import { createServiceRoleClient } from "@/lib/supabase/admin";
import { grantPlanCredits } from "@/lib/billing/subscription-sync";
import { updateSubscription } from "@/lib/subscriptions/repository";
import { NextResponse } from "next/server";

function extractValue(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function extractUserId(payload: Record<string, unknown>): string | undefined {
  const candidates = [
    payload?.metadata,
    payload?.data,
    payload?.object,
    payload?.customer,
  ].filter((item): item is Record<string, unknown> => !!item && typeof item === "object");

  for (const candidate of candidates) {
    const userId = extractValue(candidate.userId ?? candidate.user_id ?? candidate.external_id);
    if (userId) {
      return userId;
    }
  }

  return undefined;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const eventId =
      extractValue((payload as Record<string, unknown>).id) ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const eventType = extractValue((payload as Record<string, unknown>).type);
    const data = ((payload as Record<string, unknown>).data ?? payload) as Record<string, unknown>;
    const userId = extractUserId({ ...payload, ...data } as Record<string, unknown>);

    if (userId) {
      const supabase = createServiceRoleClient();
      const status =
        eventType?.includes("canceled") || data.status === "canceled"
          ? "canceled"
          : eventType?.includes("failed") || data.status === "failed"
            ? "past_due"
            : "active";

      const customer = data.customer as Record<string, unknown> | undefined;
      const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
      const subscriptionId = extractValue(data.subscription_id ?? data.id);
      const providerCustomerId = extractValue(
        (data.customer_id as string | undefined) ?? customer?.id,
      );
      const plan = extractValue(
        (data.plan as string | undefined) ??
          (metadata.plan as string | undefined) ??
          (metadata.product as string | undefined),
      );
      const billingCycle = extractValue(
        (data.billing_cycle as string | undefined) ??
          (metadata.billingCycle as string | undefined),
      );

      await updateSubscription(supabase, userId, {
        status,
        plan: (plan?.toLowerCase() as "starter" | "pro" | "ultra" | undefined) ?? undefined,
        billing_cycle: (billingCycle?.toLowerCase() as "monthly" | "annual" | undefined) ?? undefined,
        provider_subscription_id: subscriptionId,
        provider_customer_id: providerCustomerId,
        metadata: {
          lastPolarEventType: eventType ?? "unknown",
          lastPolarEventId: eventId,
          ...(plan ? { plan } : {}),
          ...(billingCycle ? { billingCycle } : {}),
        },
      });

      if (status === "active" && plan) {
        await grantPlanCredits(
          supabase,
          userId,
          plan.toLowerCase() as "starter" | "pro" | "ultra",
          (billingCycle?.toLowerCase() as "monthly" | "annual") ?? "monthly",
          subscriptionId ?? eventId,
          "polar.checkout.credit",
        );
      }
    }

    console.info("Polar webhook received", { eventId, type: eventType });

    return NextResponse.json({ received: true, eventId });
  } catch (error) {
    console.error("Polar webhook error:", error);
    return NextResponse.json({ error: "Polar webhook failed" }, { status: 500 });
  }
}
