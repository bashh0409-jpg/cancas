import { XCircle } from "lucide-react";
import Link from "next/link";

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <XCircle className="w-16 h-16 text-yellow-500" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Payment Canceled</h1>

        <p className="text-gray-400 mb-8">
          Your payment was not completed. Your account remains on the free plan.
        </p>

        <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700">
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

        <div className="space-y-3">
          <Link
            href="/billing/checkout"
            className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </Link>

          <Link
            href="/work"
            className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>

          <a
            href="mailto:support@example.com"
            className="block w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-gray-300"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
