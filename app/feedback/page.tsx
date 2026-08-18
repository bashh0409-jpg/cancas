import type { Metadata } from "next";
import FeedbackPage from "./FeedbackPage";

export const metadata: Metadata = {
  title: "Feedback - Reflow",
  description: "Share your feedback and help us improve the Reflow experience.",
  alternates: {
    canonical: "/feedback",
  },
};

export default function Page() {
  return <FeedbackPage />;
}
