import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { adsenseClient } from "@/lib/ads";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: env.siteUrl,
  title: "EndoCurrent — Endocrinology briefs",
  description:
    "A modern endocrinology news and insights site with weekly digests, peer-reviewed summaries, and AI-assisted drafts for editors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk =
    typeof publishableKey === "string" &&
    publishableKey.startsWith("pk_") &&
    publishableKey !== "pk_test_placeholder";

  const shell = (
    <html lang="en" className="min-h-full">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "min-h-screen bg-background text-foreground antialiased"
        )}
      >
        {adsenseClient && !env.adsDisabled ? (
          <Script
            id="adsense-script"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        ) : null}
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
  if (!hasClerk) {
    return shell;
  }
  return <ClerkProvider publishableKey={publishableKey}>{shell}</ClerkProvider>;
}
