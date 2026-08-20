import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import { Suspense } from "react";
import { PHProvider } from "./providers";
import { PostHogPageView } from "./PostHogPageView";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsent } from "./components/CookieConsent";
import { LenisProvider } from "./LenisProvider";
import { ToastContainer } from "./components/work/Toast";
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
  preload: false,
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
  preload: false,
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
  preload: false,
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
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://swipes.site"),

  title: {
    default: "Reflow",
    template: "%s | Reflow",
  },

  description:
    "Reflow is an AI-powered creative canvas for turning ideas into images, videos, and visual concepts.",
  other: {
    "data-scroll-behavior": "smooth",
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://swipes.site/",
    siteName: "Reflow",
    title: "Reflow",
    description:
      "An AI-powered creative canvas for turning ideas into images, videos, and visual concepts.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reflow — AI-powered creative canvas",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Reflow",
    description:
      "An AI-powered creative canvas for turning ideas into images, videos, and visual concepts.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${helveticaNeue.variable} ${GeistMono.variable} ${cmGeom.variable} ${rinter.variable} ${layGrotesk.variable}  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SpeedInsights />
        <Analytics />
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <LenisProvider>{children}</LenisProvider>
        </PHProvider>
        <CookieConsent />
        <ToastContainer />
      </body>
    </html>
  );
}
