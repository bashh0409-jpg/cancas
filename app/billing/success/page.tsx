import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function BillingSuccess() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl uppercase tracking-tight mono mb-2">
          Payment Successful!
        </h1>

        <p className="mt-2 font-mono tracking-tight uppercase text-black/60">
          Your subscription has been activated. You now have access to all
          premium features.
        </p>

        <div className=" flex justify-center items-center mt-4 text-sm mono gap-2 items-center ">
          <Link
            href="/work"
            className="flex items-center  w-fit p-1.5 text-sm pl-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Home
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/billing/manage"
            className="flex items-center  w-fit p-1.5 text-sm pl-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Manage
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
