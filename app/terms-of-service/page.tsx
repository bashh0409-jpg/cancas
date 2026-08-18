import type { Metadata } from "next";
import TermsPage from "./TermsPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Review the terms and conditions governing access to and use of the Reflow platform.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function Page() {
  return <TermsPage />;
}
