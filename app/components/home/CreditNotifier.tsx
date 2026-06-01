'use client';

import { useEffect, useState } from "react";

interface CreditNotifierProps {
  message?: string;
}

export function CreditNotifier({ message }: CreditNotifierProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-rose-400/20 bg-black/90 p-4 shadow-2xl shadow-black/30 backdrop-blur-lg text-white">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-rose-500/20 p-2 text-rose-200">
          <span aria-hidden="true">⚠️</span>
        </div>
        <div className="min-w-0 text-sm leading-6">
          <p className="font-semibold text-white">Not enough credits</p>
          <p className="text-white/80">{message}</p>
        </div>
        <button
          type="button"
          className="text-white/60 hover:text-white"
          onClick={() => setVisible(false)}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
