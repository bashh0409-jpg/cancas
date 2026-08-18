import type { Metadata } from "next";
import TermsPage from "./TermsPage";

// Terms of Use
export const metadata: Metadata = {
  title: "Terms of Use - Reflow",
  description: "Read Reflow's Terms of Use governing access to and use of the Reflow platform.",
};

export default function Page() {
  return <TermsPage />;
}
