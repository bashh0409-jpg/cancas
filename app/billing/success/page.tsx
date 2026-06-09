import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function BillingSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>

        <p className="text-gray-400 mb-8">
          Your subscription has been activated. You now have access to all
          premium features.
        </p>

        <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700">
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

        <div className="space-y-3">
          <Link
            href="/home"
            className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/billing/manage"
            className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Manage Subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
