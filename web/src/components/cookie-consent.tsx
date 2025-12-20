"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

const CONSENT_KEY = "cookie_consent";
const CONSENT_VERSION = 1;

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
        // Dispatch event so other components know consent state
        window.dispatchEvent(new CustomEvent("cookieConsentUpdate", { detail: parsed }));
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }

    // Listen for requests to re-open the consent dialog
    const handleOpenSettings = () => {
      setShowBanner(true);
      setShowDetails(true);
    };
    window.addEventListener("openCookieSettings", handleOpenSettings);
    return () => {
      window.removeEventListener("openCookieSettings", handleOpenSettings);
    };
  }, []);

  const saveConsent = (analytics: boolean, marketing: boolean) => {
    const newConsent: ConsentState = {
      analytics,
      marketing,
      timestamp: Date.now(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
    // Dispatch event so other components can load scripts
    window.dispatchEvent(new CustomEvent("cookieConsentUpdate", { detail: newConsent }));
    // Reload to apply consent (scripts will check consent before loading)
    if (analytics || marketing) {
      window.location.reload();
    }
  };

  const acceptAll = () => {
    saveConsent(true, true);
  };

  const rejectAll = () => {
    saveConsent(false, false);
  };

  const saveCustom = () => {
    const analyticsCheckbox = document.getElementById("consent-analytics") as HTMLInputElement;
    const marketingCheckbox = document.getElementById("consent-marketing") as HTMLInputElement;
    saveConsent(analyticsCheckbox?.checked ?? false, marketingCheckbox?.checked ?? false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Cookie className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Cookie Preferences
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              We use cookies to analyze site traffic and optimize your experience.
              You can choose which cookies to accept.{" "}
              <Link href="/policies/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
                Learn more
              </Link>
            </p>

            {showDetails && (
              <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">Essential</span>
                    <span className="ml-2 text-xs text-slate-500">(Always active)</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Required for the site to function. No personal data collected.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="consent-analytics"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">Analytics</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Google Analytics to understand how visitors use the site.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="consent-marketing"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">Marketing</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Google AdSense for personalized advertisements.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {showDetails ? (
                <>
                  <button
                    onClick={saveCustom}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-100"
                  >
                    Save Preferences
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Back
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={acceptAll}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-100"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={rejectAll}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Customize
                  </button>
                </>
              )}
            </div>
          </div>
          <button
            onClick={rejectAll}
            className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper hook to check consent status
export function useConsentStatus() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        // Invalid consent data
      }
    }

    const handleUpdate = (e: CustomEvent<ConsentState>) => {
      setConsent(e.detail);
    };

    window.addEventListener("cookieConsentUpdate", handleUpdate as EventListener);
    return () => {
      window.removeEventListener("cookieConsentUpdate", handleUpdate as EventListener);
    };
  }, []);

  return {
    hasConsented: consent !== null,
    analyticsAllowed: consent?.analytics ?? false,
    marketingAllowed: consent?.marketing ?? false,
  };
}

// Helper to check consent (for use outside React)
export function getConsentStatus(): { analytics: boolean; marketing: boolean } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return { analytics: parsed.analytics, marketing: parsed.marketing };
  } catch {
    return null;
  }
}

// Helper to open cookie settings dialog
export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openCookieSettings"));
  }
}
