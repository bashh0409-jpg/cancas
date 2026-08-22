"use client";

import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteAccountModal } from "@/app/components/work/DeleteAccountModal";

export default function DeleteAccountPage({
  username,
  deleteAccountAction,
  signOut,
}: {
  username: string;
  deleteAccountAction: (verificationCode: string) => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    try {
      setIsExporting(true);
      setExportError(null);
      const response = await fetch("/api/account/export");
      if (!response.ok) throw new Error("Failed to export account data");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeUsername =
        username
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "user";
      link.download = `reflow-${safeUsername}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Failed to export account data",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleConfirm(verificationCode: string) {
    await deleteAccountAction(verificationCode);
    await signOut();
    router.push("/account/success");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 text-black">
      <div className="w-full max-w-xl text-center">
        <div className="hidden">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-8 rounded-full bg-black/6 px-3 py-1.5 font-mono text-sm uppercase text-black transition-colors hover:bg-black/10"
          >
            Back to settings
          </button>
          <h1 className="mb-2 font-mono text-xl uppercase tracking-tight">
            Delete Account
          </h1>
          <p className="mt-2 font-mono uppercase tracking-tight text-black/60">
            Export your data first, then request a verification code to
            permanently delete your account.
          </p>
        </div>

        <section className="mt-4 hidde flex flex-col items-center justify-center gap-2 text-sm">
          <div>
            <h2 className="font-mono uppercase">Export your data</h2>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="flex cursor-pointer w-fit items-center gap-2 rounded-full bg-black/6 px-3 py-1.5 font-mono text-sm uppercase text-black transition-colors hover:bg-black/10 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {isExporting ? "Preparing" : "Download"}
          </button>
        </section>
        {exportError && (
          <p className="mt-3 font-mono text-xs uppercase tracking-tight text-rose-600">
            {exportError}
          </p>
        )}

        <div className="mt-4">
          <DeleteAccountModal
            open
            onClose={() => router.back()}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </main>
  );
}
