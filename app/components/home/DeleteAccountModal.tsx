"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";

const VERIFICATION_CODE_LENGTH = 6;

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
  const [codeDigits, setCodeDigits] = useState<string[]>(
    Array.from({ length: VERIFICATION_CODE_LENGTH }, () => ""),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  if (!open) return null;

  const verificationCode = codeDigits.join("");

  function focusCodeInput(index: number) {
    codeInputRefs.current[index]?.focus();
    codeInputRefs.current[index]?.select();
  }

  function updateCodeDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...codeDigits];
    nextDigits[index] = digit;
    setCodeDigits(nextDigits);
    setError(null);

    if (digit && index < VERIFICATION_CODE_LENGTH - 1) {
      focusCodeInput(index + 1);
    }
  }

  function handleCodeKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      event.preventDefault();
      const nextDigits = [...codeDigits];
      nextDigits[index - 1] = "";
      setCodeDigits(nextDigits);
      focusCodeInput(index - 1);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusCodeInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < VERIFICATION_CODE_LENGTH - 1) {
      event.preventDefault();
      focusCodeInput(index + 1);
    }
  }

  function handleCodePaste(
    index: number,
    event: ClipboardEvent<HTMLInputElement>,
  ) {
    event.preventDefault();
    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, VERIFICATION_CODE_LENGTH - index);

    if (!pastedCode) return;

    const nextDigits = [...codeDigits];
    pastedCode.split("").forEach((digit, pastedIndex) => {
      nextDigits[index + pastedIndex] = digit;
    });
    setCodeDigits(nextDigits);
    setError(null);
    focusCodeInput(
      Math.min(index + pastedCode.length, VERIFICATION_CODE_LENGTH) - 1,
    );
  }

  function resetCode() {
    setCodeDigits(Array.from({ length: VERIFICATION_CODE_LENGTH }, () => ""));
  }

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

    if (verificationCode.length < VERIFICATION_CODE_LENGTH) {
      setError("Please enter the full verification code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(verificationCode);
      resetCode();
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
                ⚠️ Deleting your account will permanently remove all your data, including canvases, credits, and profile information. This action cannot be undone.
              </p>
              <p className="text-rose-200 mt-2 text-xs mono">
                Make sure you have saved any important files or data before
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
              <div className="grid grid-cols-6 gap-2">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      codeInputRefs.current[index] = node;
                    }}
                    value={digit}
                    onChange={(event) =>
                      updateCodeDigit(index, event.currentTarget.value)
                    }
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                    onPaste={(event) => handleCodePaste(index, event)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Verification code digit ${index + 1}`}
                    className="aspect-square w-full rounded bg-[#212529] text-center text-base font-semibold text-white outline-none border border-white/10 focus:border-rose-400 focus:bg-[#252a30] font-mono transition"
                    maxLength={1}
                  />
                ))}
              </div>
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
                  resetCode();
                  setError(null);
                }}
                className="h-9 rounded cursor-pointer bg-white/10 px-3 text-xs text-white hover:bg-white/15 transition"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleVerify}
                disabled={
                  verificationCode.length < VERIFICATION_CODE_LENGTH || loading
                }
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
