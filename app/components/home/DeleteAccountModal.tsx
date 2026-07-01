"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (verificationCode: string) => Promise<void>;
}) {
  const [step, setStep] = useState<"confirm" | "verify">("confirm");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSendCode() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/account/request-deletion-code", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep("verify");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(verificationCode);
      setVerificationCode("");
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded border border-white/10 bg-[#1A1D21] p-5">
        {step === "confirm" ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-white text-sm font-medium">Delete Account</h2>
              <p className="text-white/60 text-xs mono mt-1">
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
            </div>

            <div className="rounded bg-rose-500/10 border border-rose-500/30 p-3">
              <p className="text-rose-200 text-xs mono">
                ⚠️ Make sure you have saved any important files or data before
                proceeding.
              </p>
            </div>

            {error && (
              <div className="rounded bg-rose-500/10 border border-rose-500/30 p-2.5">
                <p className="text-rose-200 text-xs">{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded cursor-pointer bg-white/10 px-3 text-xs text-white hover:bg-white/15 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="h-9 rounded cursor-pointer bg-rose-500 px-3 text-xs font-medium text-white transition disabled:opacity-40 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-white text-sm font-medium">
                Verify Your Identity
              </h2>
              <p className="text-white/60 text-xs mono mt-1">
                We&apos;ve sent a verification code to your email. Enter it
                below to confirm account deletion.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs mono tracking-tight text-white">
                Verification Code
              </label>
              <input
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Enter 6-digit code"
                className="h-9 rounded bg-[#212529] px-3 text-xs text-white outline-none border border-transparent focus:border-white/10 font-mono tracking-wider"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="rounded bg-rose-500/10 border border-rose-500/30 p-2.5">
                <p className="text-rose-200 text-xs">{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setStep("confirm");
                  setVerificationCode("");
                  setError(null);
                }}
                className="h-9 rounded cursor-pointer bg-white/10 px-3 text-xs text-white hover:bg-white/15 transition"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleVerify}
                disabled={verificationCode.length < 6 || loading}
                className="h-9 rounded cursor-pointer bg-rose-500 px-3 text-xs font-medium text-white transition disabled:opacity-40 flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
