"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import type { UserSubscription } from "@/lib/subscriptions/repository";

interface BillingDashboardProps {
  userId: string;
}

export function BillingDashboard({ userId }: BillingDashboardProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/billing/subscription/${userId}`);
      if (!response.ok) throw new Error("Failed to load subscription");
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription",
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSubscription();
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
    subscription.status === "active" &&
    subscription.cancel_at_period_end;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Current Plan</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Plan</div>
            <div className="text-2xl font-bold capitalize">
              {subscription.plan}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Provider</div>
            <div className="text-lg capitalize">{subscription.provider}</div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div
              className={`font-medium ${statusColors[subscription.status] || ""}`}
            >
              {subscription.status}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-1">Billing Cycle</div>
            <div className="capitalize">{subscription.billing_cycle}</div>
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
                {showExpiringWarning
                  ? "Scheduled for cancellation"
                  : "Active"}
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

      {/* Actions */}
      <div className="flex gap-3">
        <a
          href="/billing/checkout"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
        >
          Change Plan
        </a>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-100 font-medium"
        >
          Cancel Subscription
        </button>
      </div>

      {/* Cancel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Cancel Subscription?</h3>

            <p className="text-gray-300 mb-6">
              Your subscription will continue until the end of the current
              billing period. You can reactivate at any time.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleCancel(false)}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium"
              >
                Cancel at End of Period
              </button>

              <button
                onClick={() => handleCancel(true)}
                className="w-full px-4 py-2 bg-red-900 hover:bg-red-800 rounded text-red-200 font-medium"
              >
                Cancel Immediately
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium"
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