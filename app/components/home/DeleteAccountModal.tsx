"use client";

import { useState } from "react";

export function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (confirmText: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const requiredText = "Yes i want to delete my account";

  if (!open) return null;

  async function handleDelete() {
    console.log("[DeleteAccountModal] handleDelete called", {
      value,
      requiredText,
      matches: value === requiredText,
    });
    if (value !== requiredText) {
      console.log("[DeleteAccountModal] Text does not match, returning");
      return;
    }

    setLoading(true);
    console.log("[DeleteAccountModal] Calling onConfirm() with value");
    try {
      await onConfirm(value);
      console.log("[DeleteAccountModal] onConfirm() completed successfully");
    } catch (error) {
      console.error("[DeleteAccountModal] onConfirm() failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded border border-white/10 bg-[#1A1D21] p-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-sm font-medium">Delete account</h2>

          <p className="text-white mono mb-2 text-xs">
            This action is permanent. Type{" "}
            <span className="underline">Yes i want to delete my account</span>{" "}
            to confirm.
          </p>

          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-9 rounded bg-[#212529] px-3 text-xs text-white outline-none border border-transparent focus:border-white/10"
            placeholder={requiredText}
          />
          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={value !== requiredText || loading}
              className="h-9 rounded cursor-pointer bg-rose-500 px-3 text-xs font-medium text-white transition disabled:opacity-40"
            >
              {loading ? "Deleting..." : "Delete account"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded cursor-pointer bg-white/10 px-3 text-xs text-white hover:bg-white/15 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
