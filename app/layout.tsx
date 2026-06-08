import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import localFont from "next/font/local";
import { Suspense } from "react";
import { PHProvider } from "./providers";
import { PostHogPageView } from "./PostHogPageView";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "ENDLESS.AI",
  description: "discover the power of collaborative creativity with Slate, the ultimate canvas for your ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${helveticaNeue.variable} ${GeistMono.variable} ${cmGeom.variable} ${rinter.variable} ${GeistPixelSquare.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
        </PHProvider>
      </body>
    </html>
  );
}
