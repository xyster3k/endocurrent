import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { AdsenseScript } from "@/components/adsense-script";
import { CookieConsent } from "@/components/cookie-consent";
import { adsenseClient } from "@/lib/ads";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://endocurrent.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "EndoCurrent | Endocrinology News & Insights",
    template: "%s | EndoCurrent",
  },
  description:
    "Stay current with endocrinology news, peer-reviewed research summaries, and expert insights. Your trusted source for thyroid, diabetes, and hormone health updates.",
  keywords: [
    "endocrinology",
    "thyroid",
    "diabetes",
    "hormones",
    "medical news",
    "endocrine disorders",
    "metabolism",
    "healthcare",
  ],
  authors: [{ name: "EndoCurrent" }],
  creator: "EndoCurrent",
  publisher: "EndoCurrent",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "EndoCurrent",
    title: "EndoCurrent | Endocrinology News & Insights",
    description:
      "Stay current with endocrinology news, peer-reviewed research summaries, and expert insights.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "EndoCurrent - Endocrinology News & Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EndoCurrent | Endocrinology News & Insights",
    description:
      "Stay current with endocrinology news, peer-reviewed research summaries, and expert insights.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
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
        <GoogleAnalytics />
        {adsenseClient && process.env.ADS_DISABLED !== "true" ? (
          <AdsenseScript adsenseClient={adsenseClient} />
        ) : null}
        <CookieConsent />
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
