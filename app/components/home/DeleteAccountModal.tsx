"use client";

import { useEffect, useState } from "react";

export function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const requiredText = "Yes i want to delete my account";

  useEffect(() => {
    if (!open) {
      setValue("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleDelete() {
    if (value !== requiredText) return;

    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded border border-white/10 bg-[#1A1D21] p-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-sm font-medium">Delete account</h2>

          <p className="text-white/40 text-xs">
            This action is permanent. Type the confirmation text below to
            continue.
          </p>

          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-9 rounded bg-[#212529] px-3 text-xs text-white outline-none border border-transparent focus:border-white/10"
            placeholder={requiredText}
          />

          <button
            onClick={handleDelete}
            disabled={value !== requiredText || loading}
            className="h-9 rounded bg-rose-500 px-3 text-xs font-medium text-white transition disabled:opacity-40"
          >
            {loading ? "Deleting..." : "Delete account"}
          </button>

          <button
            onClick={onClose}
            className="h-9 rounded bg-white/10 px-3 text-xs text-white hover:bg-white/15 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
