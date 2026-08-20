import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscriptions/repository";

export default async function BillingSuccess() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  const subscription = user
    ? await getUserSubscription(supabase, user.id)
    : null;
  const planName = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : "paid";

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl uppercase tracking-tight mono mb-2">
          Payment Successful!
        </h1>

        <p className="mt-2 font-mono tracking-tight uppercase text-black/60">
          Your <span className=" text-black">{planName}</span> subscription has been activated. You now
          have access to all premium features.
        </p>

        <div className=" flex justify-center items-center mt-4 text-sm mono gap-2 items-center ">
          <Link
            href="/work"
            className="flex items-center  w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Home
            <ArrowUpRight className="w-4 hidden h-4 ml-1" />
          </Link>
          <Link
            href="/billing/manage"
            className="flex items-center  w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Manage
            <ArrowUpRight className="w-4 hidden h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
