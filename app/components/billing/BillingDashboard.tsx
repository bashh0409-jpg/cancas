"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  WalletCards,
  Icon,
} from "lucide-react";
import { formatCredits } from "@/lib/credits/format";
import type { UserSubscription } from "@/lib/subscriptions/repository";

interface BillingDashboardProps {
  userId: string;
}

export function BillingDashboard({ userId }: BillingDashboardProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/billing/subscription/${userId}`);
      if (!response.ok) throw new Error("Failed to load subscription");
      const data = await response.json();
      const nextSubscription = data.subscription ?? data;
      setSubscription(nextSubscription);
      setCredits(typeof data.credits === "number" ? data.credits : null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription",
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const handleCancel = async (immediate = false) => {
    try {
      const response = await fetch(
        `/api/billing/subscription/${userId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ immediate }),
        },
      );

      if (!response.ok) throw new Error("Failed to cancel subscription");

      setIsModalOpen(false);
      await loadSubscription();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-200 flex items-gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No active subscription</p>
        <a
          href="/billing/checkout"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
        >
          Upgrade Now
        </a>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "text-green-400",
    trialing: "text-blue-400",
    canceled: "text-red-400",
    past_due: "text-yellow-400",
    unpaid: "text-red-400",
    expired: "text-gray-400",
    paused: "text-yellow-400",
  };

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  const showExpiringWarning =
    subscription.status === "active" && subscription.cancel_at_period_end;

  return (
    <div className="space-y-6 mono">
      <a
        href="/work"
        className="w-fit absolute top-2 left-2 p-2 lime flex items-center justify-center rounded text-black uppercase tracking-tight text-xs"
      >
        <X className="w-4 h-4" />
      </a>
      {/* Actions */}
      <div className="flex gap-2">
        <a
          href="/billing/checkout"
          className="w-fit p-2 px-4 lime flex items-center justify-center rounded text-black uppercase tracking-tight text-xs"
        >
          Change Plan
        </a>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-fit p-2 px-4 lime cursor-pointer flex items-center justify-center rounded text-black uppercase tracking-tight text-xs"
        >
          Cancel Subscription
        </button>
      </div>

      {/* Current Plan */}
      <div className="bg-white/10 uppercase p-6 rounded">
        <h3 className="text-sm uppercase tracking-tight mb-4">Current Plan</h3>

        <div className="grid uppercase md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-white/60  uppercase tracking-tight mb-1">
              Plan
            </div>
            <div className="text-md uppercase tracking-tight  capitalize">
              {subscription.plan}
            </div>
          </div>

          <div>
            <div className="text-xs text-white/60  uppercase tracking-tight mb-1">
              Provider
            </div>
            <div className="text-md uppercase tracking-tight  capitalize">
              {subscription.provider}
            </div>
          </div>

          <div>
            <div className="text-xs text-white/60  uppercase tracking-tight mb-1">
              Status
            </div>
            <div
              className={`tracking-tight uppercase capitalize ${statusColors[subscription.status] || ""}`}
            >
              {subscription.status}
            </div>
          </div>

          <div>
            <div className="text-xs text-white/60  uppercase tracking-tight mb-1">
              Billing Cycle
            </div>
            <div className="uppercase">{subscription.billing_cycle}</div>
          </div>

          <div>
            <div className="text-xs text-white/60  uppercase tracking-tight mb-1">
              Credits
            </div>
            <div className="tracking-tight text-sm flex  items-center grotesk">
              <CredIcon  />
              {typeof credits === "number" ? formatCredits(credits) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Period Information */}
      {currentPeriodEnd && (
        <div
          className={`rounded-lg p-4 border ${
            showExpiringWarning
              ? "bg-yellow-900/30 border-yellow-600"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="flex items-start gap-3">
            {showExpiringWarning ? (
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-medium mb-1">
                {showExpiringWarning ? "Scheduled for cancellation" : "Active"}
              </div>
              <div className="text-gray-300">
                {currentPeriodEnd.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 text-white tracking-tight rounded-lg p-6 max-w-md w-full ">
            <h3 className="text-lg uppercase mb-4">Cancel Subscription?</h3>

            <p className="text-gray-300 text-xs uppercase mb-6">
              Your subscription will continue until the end of the current
              billing period. You can reactivate at any time.
            </p>

            <div className="space-y-1">
              <button
                onClick={() => handleCancel(false)}
                className="w-full cursor-pointer  px-4 uppercase text-xs py-2 bg-red-700 rounded text-white "
              >
                Cancel at End of Period
              </button>

              <button
                onClick={() => handleCancel(true)}
                className="w-full  cursor-pointer px-4 uppercase text-xs py-2 bg-red-700 rounded "
              >
                Cancel Immediately
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full cursor-pointer  px-4 uppercase text-xs py-2 lime text-black rounded"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CredIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3.75V20.25" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 7.5L19.5 16.5" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 16.5L19.5 7.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}