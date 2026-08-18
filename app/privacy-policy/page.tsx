import type { Metadata } from "next";
import PrivacyPage from "./PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Reflow collects, uses, stores, and protects your personal information.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function Page() {
  return <PrivacyPage />;
}
