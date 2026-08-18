import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Reflow and continue creating.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <LoginPage />;
}
