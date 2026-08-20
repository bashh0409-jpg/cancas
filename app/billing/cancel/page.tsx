import { XCircle } from "lucide-react";
import Link from "next/link";

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-white font-mono text-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl uppercase tracking-tight mono mb-2">
          Subscription cancelled!
        </h1>
        <p className="mt-2 font-mono font-mono tracking-tight uppercase text-black/60">
          oops, Your payment was not completed. Your account remains on the free
          plan.
        </p>
        <div className="bg-gray-800 hidden rounded-lg p-4 mb-8 border border-gray-700">
          <p className="text-sm text-gray-400 mb-3">{`What's next?`}</p>
          <ul className="text-left space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span>•</span>
              <span>Return to checkout to complete your upgrade</span>
            </li>
            <li className="flex items-center gap-2">
              <span>•</span>
              <span>Try the free plan with 100 monthly credits</span>
            </li>
            <li className="flex items-center gap-2">
              <span>•</span>
              <span>Contact support if you have questions</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-2 items-center justify-center mt-5">
          <Link
            href="/billing/checkout"
            className="flex items-center cursor-pointer w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Try Again
          </Link>

          <Link
            href="/work"
            className="flex items-center cursor-pointer w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Dashboard
          </Link>

          <a
            href="mailto:support@swipes.site"
            className="flex items-center cursor-pointer w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
