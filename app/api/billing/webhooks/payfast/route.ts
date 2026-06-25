import { handlePayFastWebhook } from "@/lib/billing/payfast-handlers";
import { initPayFastClient } from "@/lib/billing/payfast";
import type { PayFastWebhookData } from "@/lib/billing/payfast";
import { claimWebhookEvent } from "@/lib/billing/webhook-events";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const webhookData: Record<string, string> = {};

    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    const payfast = initPayFastClient();

    if (!payfast.verifyWebhookSignature(webhookData as PayFastWebhookData)) {
      console.error("Invalid PayFast webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventId =
      webhookData.pf_payment_id ||
      webhookData.m_payment_id ||
      `${webhookData.payment_status}:${webhookData.custom_int1}:${webhookData.amount_gross}`;

    const supabase = createServiceRoleClient();
    const shouldProcess = await claimWebhookEvent(
      supabase,
      "payfast",
      eventId,
    );

    if (!shouldProcess) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    await handlePayFastWebhook(
      supabase,
      webhookData as PayFastWebhookData,
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PayFast webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const testMode = url.searchParams.get("test");

  if (testMode !== "true") {
    return NextResponse.json({ error: "Test mode disabled" }, { status: 403 });
  }

  return NextResponse.json({
    message: "PayFast webhook endpoint is ready",
    environment: process.env.NODE_ENV,
  });
}
