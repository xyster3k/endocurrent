"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getConsentStatus } from "./cookie-consent";

type Props = {
  adsenseClient: string;
};

export function AdsenseScript({ adsenseClient }: Props) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check consent status
    const consent = getConsentStatus();
    setHasConsent(consent?.marketing ?? false);

    // Listen for consent updates
    const handleConsentUpdate = (e: CustomEvent) => {
      setHasConsent(e.detail?.marketing ?? false);
    };
    window.addEventListener("cookieConsentUpdate", handleConsentUpdate as EventListener);

    return () => {
      window.removeEventListener("cookieConsentUpdate", handleConsentUpdate as EventListener);
    };
  }, []);

  // Don't load AdSense without marketing consent
  if (!hasConsent) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
    />
  );
}
