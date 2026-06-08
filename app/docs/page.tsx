"use client";

import React, { useMemo, useState } from "react";

type FeedbackPayload = {
  rating: number;
  message: string;
  email?: string;
};

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  async function handleSubmit() {
    if (rating === 0 || message.trim().length < 5) return;

    setLoading(true);

    const payload: FeedbackPayload = {
      rating,
      message: message.trim(),
      email: email.trim() || undefined,
    };

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Thanks for your feedback</h1>
          <p className="mt-2 text-white/60">We’ve received your response.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-lg font-semibold">Rate your experience</h1>
        <p className="mt-1 text-sm text-white/60">
          Tell us how the app feels to use.
        </p>

        {/* Rating */}
        <div className="mt-6 flex gap-1">
          {stars.map((star) => {
            const active = hovered ? star <= hovered : star <= rating;

            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="text-2xl transition"
              >
                <span className={active ? "text-yellow-400" : "text-white/20"}>
                  ★
                </span>
              </button>
            );
          })}
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What did you like or what can be improved?"
          className="mt-5 h-28 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-white/30"
        />

        {/* Email */}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-white/30"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0 || message.trim().length < 5}
          className="mt-5 h-11 w-full rounded-xl bg-white text-sm font-medium text-black disabled:opacity-40"
        >
          {loading ? "Submitting..." : "Submit feedback"}
        </button>
      </div>
    </main>
  );
}
