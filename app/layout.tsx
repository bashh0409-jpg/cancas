import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { Host_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import { PHProvider } from "./providers";
import { PostHogPageView } from "./PostHogPageView";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsent } from "./components/CookieConsent";
import { LenisProvider } from "./LenisProvider";
import { ToastContainer } from "./components/home/Toast";
import BackgroundAudio from "./components/BackgroundAudio";

const cmGeom = localFont({
  src: [
    {
      path: "../public/fonts/CMGeom-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-cmgeom",
});

const helveticaNeue = localFont({
  src: [
    {
      path: "../public/fonts/HelveticaNeueMedium.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-helvetica-neue",
});

const rinter = localFont({
  src: [
    {
      path: "../public/fonts/Rinter.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-rinter",
});

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-host-grotesk",
});

const layGrotesk = localFont({
  src: [
    {
      path: "../public/fonts/LayGrotesk-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/LayGrotesk-Black.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-lay-grotesk",
});

export const metadata: Metadata = {
  title: "REFLOW",
  description:
    "discover the power of collaborative creativity with Reflow, the ultimate canvas for your ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${helveticaNeue.variable} ${GeistMono.variable} ${cmGeom.variable} ${rinter.variable} ${layGrotesk.variable} ${hostGrotesk.variable} ${GeistPixelSquare.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SpeedInsights />
        <Analytics />
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
        {children}
        </PHProvider>
        <CookieConsent />
        <ToastContainer />
        <BackgroundAudio />
      </body>
    </html>
  );
}
