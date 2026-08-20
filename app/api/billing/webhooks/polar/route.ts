import { createServiceRoleClient } from "@/lib/supabase/admin";
import { grantPlanCredits } from "@/lib/billing/subscription-sync";
import { claimWebhookEvent } from "@/lib/billing/webhook-events";
import { updateSubscription } from "@/lib/subscriptions/repository";
import { WebhookVerificationError, validateEvent } from "@polar-sh/sdk/webhooks";
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

function extractSubscriptionId(data: Record<string, unknown>): string | undefined {
  const subscription = data.subscription;

  return (
    extractValue(data.subscription_id) ??
    extractValue(data.id) ??
    (subscription && typeof subscription === "object"
      ? extractValue((subscription as Record<string, unknown>).id)
      : undefined)
  );
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const body = await req.text();
    const headers = {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    };

    let payload: Record<string, unknown>;

    try {
      payload = (validateEvent(body, headers, webhookSecret) ?? {}) as Record<
        string,
        unknown
      >;
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error("Invalid Polar webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      throw error;
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const eventId =
      extractValue(payload.id) ?? headers["webhook-id"];
    const eventType = extractValue(payload.type);
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const supabase = createServiceRoleClient();
    const shouldProcess = await claimWebhookEvent(supabase, "polar", eventId);

    if (!shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true, eventId });
    }

    if (!eventType?.startsWith("subscription.")) {
      console.info("Polar webhook acknowledged", { eventId, type: eventType });
      return NextResponse.json({ received: true, eventId });
    }

    const userId = extractUserId({ ...payload, ...data } as Record<string, unknown>);

    if (userId) {
      const status =
        eventType?.includes("canceled") || data.status === "canceled"
          ? "canceled"
          : eventType?.includes("failed") || data.status === "failed"
            ? "past_due"
            : "active";

      const customer = data.customer as Record<string, unknown> | undefined;
      const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
      const subscriptionId = extractSubscriptionId(data);
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

      const shouldGrantCredits =
        eventType === "subscription.active" ||
        eventType === "subscription.updated";
      const periodStart = extractValue(
        data.current_period_start ??
          data.period_start ??
          (data.current_period && typeof data.current_period === "object"
            ? (data.current_period as Record<string, unknown>).start
            : undefined),
      );

      if (status === "active" && plan && subscriptionId && shouldGrantCredits) {
        await grantPlanCredits(
          supabase,
          userId,
          plan.toLowerCase() as "starter" | "pro" | "ultra",
          (billingCycle?.toLowerCase() as "monthly" | "annual") ?? "monthly",
          periodStart
            ? `${subscriptionId}:${periodStart}`
            : subscriptionId,
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
