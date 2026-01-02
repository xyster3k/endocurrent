"use client";

import Link from "next/link";
import { openCookieSettings } from "./cookie-consent";

// Patreon logo SVG
function PatreonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-white/60 py-10 backdrop-blur dark:bg-black/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">Nexus Med News</h3>
          <p className="text-sm text-slate-500">
            Curated medical intelligence. Evidence-first.
          </p>
        </div>
        {/* Patreon Support Link */}
        <a
          href="https://www.patreon.com/c/drpoteshkin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#FF424D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e63946] hover:shadow-md"
        >
          <PatreonIcon className="h-4 w-4" />
          Support on Patreon
        </a>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
          <Link href="/about">About</Link>
          <Link href="/policies/privacy">Privacy</Link>
          <Link href="/policies/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/account">Account</Link>
          <button
            onClick={openCookieSettings}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cookie Settings
          </button>
        </div>
      </div>
    </footer>
  );
}
