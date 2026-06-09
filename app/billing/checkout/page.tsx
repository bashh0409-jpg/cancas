import { createClient } from "@/lib/supabase/server";
import { CheckoutPage } from "@/app/components/billing/CheckoutPage";
import { redirect } from "next/navigation";

export default async function CheckoutPageWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get user's country from metadata or IP
  const userCountry = user.user_metadata?.country || "ZA";
  const userEmail = user.email || "";

  return <CheckoutPage userCountry={userCountry} userEmail={userEmail} />;
}
