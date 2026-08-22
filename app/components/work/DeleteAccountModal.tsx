"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Loader2 } from "lucide-react";

const VERIFICATION_CODE_LENGTH = 6;
const AUTO_SUBMIT_DELAY_MS = 3000;

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
  const autoSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const verificationCode = codeDigits.join("");
  const isCodeComplete = verificationCode.length === VERIFICATION_CODE_LENGTH;

  useEffect(() => {
    if (step !== "verify" || !isCodeComplete || loading) return;

    autoSubmitTimeoutRef.current = setTimeout(() => {
      void handleVerify();
    }, AUTO_SUBMIT_DELAY_MS);

    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCodeComplete, step]);

  function cancelAutoSubmit() {
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }
  }

  if (!open) return null;

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
    cancelAutoSubmit();

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
      cancelAutoSubmit();
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
    <div className="flex w-full justify-center px-0">
      <div className="w-full  bg-white p-6 text-center text-black">
        {step === "confirm" ? (
          <>
            <h2 className="text-xl uppercase tracking-tight mono mb-2">
              Delete Account
            </h2>

            <p className="mt-2 font-mono text-sm tracking-tight uppercase text-black/60">
              This permanently deletes your account and{" "}
              <span className="text-black">all associated data</span>. Save
              anything important before continuing — this can&apos;t be undone.
            </p>

            {error && (
              <p className="mt-3 font-mono text-xs uppercase tracking-tight text-rose-600">
                {error}
              </p>
            )}

            <div className="flex justify-center items-center mt-4 text-sm mono gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center cursor-pointer w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="flex items-center cursor-pointer gap-1.5 w-fit p-1.5 text-sm px-3 hover:bg-rose-700 uppercase text-white bg-rose-600 rounded-full transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl uppercase tracking-tight mono mb-2">
              Verify It&apos;s You
            </h2>

            <p className="mt-2 font-mono tracking-tight uppercase text-black/60">
              Enter the code sent to your email. Deletion starts automatically
              once it&apos;s complete.
            </p>

            {/* fixed grid keeps 6 inputs aligned regardless of container width */}
            <div className="grid grid-cols-6 gap-2 mt-4">
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
                  maxLength={1}
                  disabled={loading}
                  className="aspect-square w-full grotesk mono text-center text-3xl font-medium text-black bg-black/6 outline-none rounded-lg focus:bg-black/10 transition-colors disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <p className="mt-3 font-mono text-xs uppercase tracking-tight text-rose-600">
                {error}
              </p>
            )}
            {loading && (
              <span className="flex justify-center mt-4 items-center gap-1.5 text-sm mono uppercase text-rose-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                
              </span>
            )}

            <div className="flex justify-center items-center mt-4 text-sm mono gap-2">
              <button
                type="button"
                onClick={() => {
                  cancelAutoSubmit();
                  setStep("confirm");
                  resetCode();
                  setError(null);
                }}
                disabled={loading}
                className="flex items-center cursor-pointer w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full transition-colors disabled:opacity-40"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
