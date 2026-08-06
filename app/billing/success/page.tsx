import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function BillingSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl uppercase tracking-tight mono mb-2">
          Payment Successful!
        </h1>

        <p className="text-white uppercase tracking-tight text-xs mono ">
          Your subscription has been activated. You now have access to all
          premium features.
        </p>

        <div className="bg-white/10 hidden tracking-tight rounded-xs p-4 mb-8 mono text-sm mt-4 ">
          <p className="text-sm text-gray-400 mb-2">Next Steps:</p>
          <ul className="text-left space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Check your email for confirmation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Visit your billing dashboard</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Start creating with premium AI features</span>
            </li>
          </ul>
        </div>

        <div className=" flex justify-center items-center mt-4 text-sm mono gap-2 items-center ">
          <Link
            href="/work"
            className="block w-fit p-2 text-xs px-4 uppercase text-black lime rounded  transition-colors"
          >
            Home
          </Link>
          <Link
            href="/billing/manage"
            className="block w-fit p-2 text-xs px-4 uppercase text-black lime rounded  transition-colors"
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
