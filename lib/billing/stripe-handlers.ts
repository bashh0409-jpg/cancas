import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  activatePaidSubscription,
  grantPlanCredits,
  markSubscriptionCanceled,
  markSubscriptionPastDue,
  resolveSubscriptionForStripeInvoice,
} from "@/lib/billing/subscription-sync";
import {
  updateSubscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/lib/subscriptions/repository";

type StripeSubscriptionEventObject = Stripe.Subscription & {
  current_period_start?: number | null;
  current_period_end?: number | null;
};

type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | null | Stripe.Subscription;
  parent?: {
    subscription_details?: {
      subscription?: string | null;
    } | null;
  } | null;
};

function readStripePeriod(subscription: StripeSubscriptionEventObject) {
  return {
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : undefined,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : undefined,
  };
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "paused":
      return "paused";
    default:
      return "unpaid";
  }
}

function readPlanFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): SubscriptionPlan | undefined {
  const plan = metadata?.plan;

  if (
    plan === "starter" ||
    plan === "pro" ||
    plan === "ultra" ||
    plan === "free"
  ) {
    return plan;
  }

  return undefined;
}

function readInvoiceSubscriptionId(
  invoice: StripeInvoiceWithSubscription,
): string | null {
  if (typeof invoice.subscription === "string") {
    return invoice.subscription;
  }

  if (
    invoice.subscription &&
    typeof invoice.subscription === "object" &&
    "id" in invoice.subscription
  ) {
    return invoice.subscription.id;
  }

  const nested = invoice.parent?.subscription_details?.subscription;
  return typeof nested === "string" ? nested : null;
}

export async function handleStripeCheckoutCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  const plan = readPlanFromMetadata(session.metadata);

  if (!userId || !subscriptionId) {
    console.warn("Stripe checkout completed without user or subscription id");
    return;
  }

  await activatePaidSubscription(supabase, userId, {
    plan,
    providerSubscriptionId: subscriptionId,
    providerCustomerId: customerId,
    status: "active",
    metadata: {
      checkoutSessionId: session.id,
      lastWebhookAt: new Date().toISOString(),
    },
  });
}

export async function handleStripeSubscriptionUpdated(
  supabase: SupabaseClient,
  subscription: StripeSubscriptionEventObject,
) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn("Stripe subscription update missing userId metadata");
    return;
  }

  const { currentPeriodStart, currentPeriodEnd } =
    readStripePeriod(subscription);
  const plan = readPlanFromMetadata(subscription.metadata);

  await updateSubscription(supabase, userId, {
    provider_subscription_id: subscription.id,
    status: mapStripeSubscriptionStatus(subscription.status),
    cancel_at_period_end: subscription.cancel_at_period_end,
    ...(plan ? { plan } : {}),
    ...(currentPeriodStart
      ? { current_period_start: currentPeriodStart }
      : {}),
    ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
    metadata: {
      lastWebhookAt: new Date().toISOString(),
    },
  });
}

export async function handleStripeSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn("Stripe subscription deletion missing userId metadata");
    return;
  }

  await markSubscriptionCanceled(supabase, userId, {
    canceledViaWebhook: true,
    lastWebhookAt: new Date().toISOString(),
  });
}

export async function handleStripeInvoicePaymentSucceeded(
  supabase: SupabaseClient,
  invoice: StripeInvoiceWithSubscription,
) {
  const subscriptionId = readInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await resolveSubscriptionForStripeInvoice(
    supabase,
    subscriptionId,
    invoice.metadata?.userId ?? null,
  );

  if (!subscription) {
    console.error(
      "Unable to resolve subscription for Stripe invoice:",
      invoice.id,
    );
    return;
  }

  await activatePaidSubscription(supabase, subscription.user_id, {
    status: "active",
    providerSubscriptionId: subscriptionId,
    metadata: {
      lastPaymentSucceeded: new Date().toISOString(),
    },
  });

  await grantPlanCredits(
    supabase,
    subscription.user_id,
    subscription.plan,
    subscription.billing_cycle,
    invoice.id,
    "stripe.invoice.credit",
  );
}

export async function handleStripeInvoicePaymentFailed(
  supabase: SupabaseClient,
  invoice: StripeInvoiceWithSubscription,
) {
  const subscriptionId = readInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await resolveSubscriptionForStripeInvoice(
    supabase,
    subscriptionId,
    invoice.metadata?.userId ?? null,
  );

  if (!subscription) {
    return;
  }

  await markSubscriptionPastDue(supabase, subscription.user_id, {
    lastPaymentFailed: new Date().toISOString(),
    failedInvoiceId: invoice.id,
  });
}
