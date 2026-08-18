"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

type FeedbackPayload = {
  message: string;
  email?: string;
};

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (message.trim().length < 5) return;

    setLoading(true);
    setError(null);

    const payload: FeedbackPayload = {
      message: message.trim(),
      email: email.trim() || undefined,
    };

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center flex-col justify-center bg-white text-black">
        <div className="text-center flex flex-col items-center">
          <img
            src="/images/Re.svg"
            alt=""
            className="h-6 text-black mix-blend-difference w-6"
          />{" "}
          <p className="mt-2 font-mono tracking-tight uppercase text-black/60">
            We&apos;ve received your feedback.
          </p>
          <p className="mt- font-mono tracking-tight uppercase text-black/60">
            thank you.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-black">
      {loading ? (
        <div className="flex flex-col gap-2 h-full text-2xl w-full items-center justify-center font-mono text-xs uppercase tracking-tight">
          <Loader2 className="w-6 text-black-50 h-6 animate-spin" /> Uploading
          response
        </div>
      ) : (
        <div className="w-full max-w-md rounded-lg bg-black/[0.05] p-4 font-mono tracking-tight">
          <img
            src="/images/Re.svg"
            alt=""
            className="h-6 text-black mix-blend-difference w-6"
          />{" "}
          <p className="mt-1 uppercase text-xs text-black/60">
            Tell us how the app feels to use.
          </p>
          {/* Message */}
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What did you like or what can be improved?"
            className="mt-2 h-28 scrollbar-hidden w-full resize-none rounded bg-white p-3 text-sm outline-none placeholder:text-black/30 focus:ring-2 focus:ring-[#1967d2]/60"
          />
          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (optional)"
            className="mt-2 w-full tracking-tight rounded bg-white p-2 text-sm outline-none placeholder:text-black/30 focus:ring-2 focus:ring-[#1967d2]/60"
          />
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || message.trim().length < 5}
            className="mt-2 h-8 w-full cursor-pointer rounded bg-black text-xs font-medium uppercase tracking-tight text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Submitting..." : "Submit feedback"}
          </button>
        </div>
      )}
    </main>
  );
}
