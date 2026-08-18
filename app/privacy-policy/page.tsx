import type { Metadata } from "next";
import PrivacyPage from "./PrivacyPage";

// Privacy Policy
export const metadata: Metadata = {
  title: "Privacy Policy - Reflow",
  description: "Read Reflow's Privacy Policy and learn how your data is collected, used, and protected.",
};

export default function Page() {
  return <PrivacyPage />;
}
