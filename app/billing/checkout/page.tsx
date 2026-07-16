import { createClient } from "@/lib/supabase/server";
import { CheckoutPage } from "@/app/components/billing/CheckoutPage";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function CheckoutPageWrapper() {
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

  // Get user's country from metadata or IP
  const userCountry = user.user_metadata?.country || "ZA";
  const userEmail = user.email || "";

  return <CheckoutPage userCountry={userCountry} userEmail={userEmail} />;
}
