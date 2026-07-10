"use client";

import { useEffect, useState, useCallback } from "react";
import { X, AlertTriangle, RotateCcw, Trash2 } from "lucide-react";

type ToastType = "confirm" | "success" | "error";

type ToastConfig = {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  duration?: number;
};

let toastListeners: Array<(toast: ToastConfig) => void> = [];

export function showToast(config: Omit<ToastConfig, "id">) {
  const id = crypto.randomUUID();
  const toast: ToastConfig = { ...config, id };
  toastListeners.forEach((listener) => listener(toast));
  return id;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const listener = (toast: ToastConfig) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const handleConfirm = async (toast: ToastConfig) => {
    setConfirming(toast.id);
    try {
      await toast.onConfirm?.();
    } finally {
      setConfirming(null);
      removeToast(toast.id);
    }
  };

  const handleCancel = (toast: ToastConfig) => {
    toast.onCancel?.();
    removeToast(toast.id);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="w-[360px] rounded border bg-white shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {toast.type === "confirm" && (
                    <div className="flex h-8 w-8 items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    </div>
                  )}
                  {toast.type === "success" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                      <RotateCcw className="h-4 w-4 text-emerald-400" />
                    </div>
                  )}
                  {toast.type === "error" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black mono uppercase tracking-tight">
                    {toast.title}
                  </p>
                  <p className="mt-1 text-xs text-black mono leading-snug uppercase tracking-tight">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 text-black hover:text-black/80 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {toast.type === "confirm" && (
              <div className="flex items-center justify-end gap-2 p-1">
                <button
                  onClick={() => handleCancel(toast)}
                  className="px-3 py-1.5 text-xs mono uppercase tracking-tight rounded-xs text-black hover:text-black hover:bg-black/10 transition cursor-pointer"
                >
                  {toast.cancelLabel || "Cancel"}
                </button>
                <button
                  onClick={() => handleConfirm(toast)}
                  disabled={confirming === toast.id}
                  className="px-3 py-1.5 text-xs mono uppercase tracking-tight rounded-xs bg-red-500/80 text-white hover:bg-red-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {confirming === toast.id
                    ? "Processing..."
                    : toast.confirmLabel || "Delete"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}