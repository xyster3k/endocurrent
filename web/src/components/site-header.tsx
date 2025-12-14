"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ActivitySquare, ShieldCheck, Sparkles } from "lucide-react";
import { env } from "@/lib/env";

const navLinks = [
  { href: "/", label: "Feed" },
  { href: "/articles/weekly-endocrine-digest", label: "Sample Article" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const hasClerk =
    typeof env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/80 backdrop-blur-lg dark:bg-black/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7aed] to-[#0dc8e5] text-white shadow-lg shadow-blue-500/20">
            <ActivitySquare className="h-5 w-5" />
          </span>
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight">
              EndoCurrent
            </Link>
            <p className="text-sm text-slate-500">Weekly endocrine intelligence</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                pathname === link.href &&
                  "bg-slate-900 text-white dark:bg-white dark:text-black"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Clinician-led, AI-assisted</span>
          </div>
          {hasClerk ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-black">
                    <Sparkles className="h-4 w-4" />
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton appearance={{ elements: { avatarBox: "h-10 w-10" } }} />
              </SignedIn>
            </>
          ) : (
            <span className="rounded-full bg-slate-500 px-4 py-2 text-sm font-semibold text-white">
              Sign in unavailable
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
