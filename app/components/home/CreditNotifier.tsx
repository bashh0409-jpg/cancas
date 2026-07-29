'use client';

import { X } from "lucide-react";
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
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border-none bg-transparent">
      <div className="flex items-start gap-3">
        <div className="rounded border tracking-tight mono  border-rose-500/30 bg-red-400/30 p-1 text-xs w-fit text-rose-100">
          {message}
        </div>

        <button
          type="button"
          className="text-white/60 hover:text-white"
          onClick={() => setVisible(false)}
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  );
}
