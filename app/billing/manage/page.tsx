import { createClient } from "@/lib/supabase/server";
import { BillingDashboard } from "@/app/components/billing/BillingDashboard";
import { redirect } from "next/navigation";

export default async function BillingManagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-black/70 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-gray-400">Manage your plan and payment method</p>
        </div>

        <BillingDashboard userId={user.id} />
      </div>
    </div>
  );
}
