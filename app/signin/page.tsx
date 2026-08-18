import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "Sign in - Reflow",
  description: "Sign in to Reflow and continue creating.",
};

export default function Page() {
  return <LoginPage />;
}
