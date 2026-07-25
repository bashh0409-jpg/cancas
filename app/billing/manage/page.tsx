import { createClient } from "@/lib/supabase/server";
import { BillingDashboard } from "@/app/components/billing/BillingDashboard";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function BillingManagePage() {
  const supabase = await createClient();
  
  let user;
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();
    
    if (error || !authUser) {
      throw error || new Error("No user found");
    }
    
    user = authUser;
  } catch (err: unknown) {
    const authError = err as { code?: string; message?: string; status?: number };
    
    const isRefreshTokenError =
      authError?.code === "refresh_token_not_found" ||
      authError?.status === 400 ||
      (typeof authError?.message === "string" &&
        (authError.message.includes("refresh_token_not_found") ||
          authError.message.includes("Invalid Refresh Token")));
    
    if (isRefreshTokenError) {
      try {
        const cookieStore = await cookies();
        const staleCookies = cookieStore
          .getAll()
          .filter(
            (c) =>
              c.name.startsWith("sb-") ||
              c.name.includes("supabase-auth-token") ||
              c.name.startsWith("supabase-"),
          );
        
        for (const cookie of staleCookies) {
          cookieStore.set(cookie.name, "", { maxAge: 0, path: "/" });
        }
      } catch {
        // Cookie clearing is best-effort
      }
    }
    
    redirect("/signin");
  }

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-black/70 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl mono uppercase tracking-tight mb-1">Billing & Subscription</h1>
          <p className="text-white/50 mono uppercase tracking-tight text-xs">
            Manage your plan and payment method
          </p>
        </div>

        <BillingDashboard userId={user.id} />
      </div>
    </div>
  );
}
