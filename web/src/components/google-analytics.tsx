"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type AnalyticsConfig = {
  measurementId: string | null;
  gtmId: string | null;
};

export function GoogleAnalytics() {
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);

  useEffect(() => {
    fetch("/api/settings/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setConfig(data.data);
        }
      })
      .catch(() => {});
  }, []);

  if (!config) {
    return null;
  }

  const { measurementId, gtmId } = config;

  // If neither is configured, don't render anything
  if (!measurementId && !gtmId) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager - Head Script */}
      {gtmId && (
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}

      {/* Google Analytics 4 - Only if GTM is not configured */}
      {measurementId && !gtmId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${measurementId}');
            `}
          </Script>
        </>
      )}
    </>
  );
}

// GTM noscript fallback - add this to your body tag if needed
export function GTMNoScript({ gtmId }: { gtmId: string }) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
