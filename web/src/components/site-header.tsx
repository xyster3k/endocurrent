"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ActivitySquare, ShieldCheck, Sparkles, Menu as MenuIcon, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const navLinks = [{ href: "/", label: "Feed" }, { href: "/admin", label: "Admin" }];

type MenuItem = {
  id: string;
  label: string;
  url: string;
  category?: string | null;
  parent_id?: string | null;
  order_index?: number | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  useEffect(() => {
    fetch("/api/menus")
      .then((res) => res.json())
      .then((res) => res?.data?.items && setMenuItems(res.data.items as MenuItem[]))
      .catch(() => {});
  }, []);
  const menuTree = useMemo(() => {
    const byParent: Record<string, MenuItem[]> = {};
    menuItems.forEach((item) => {
      const parent = item.parent_id ?? "root";
      byParent[parent] = byParent[parent] ?? [];
      byParent[parent].push(item);
    });
    Object.values(byParent).forEach((arr) => arr.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)));
    return byParent;
  }, [menuItems]);
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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
          <div className="relative group">
            <button className="nav-link inline-flex items-center gap-1" aria-haspopup="true">
              <MenuIcon className="h-4 w-4" />
              Menu
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuItems.length > 0 ? (
              <div className="invisible absolute left-1/2 z-30 mt-2 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl opacity-0 transition group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sections</p>
                <div className="space-y-2">
                  {(menuTree["root"] ?? []).map((item) => (
                    <div key={item.id}>
                      <Link href={item.url} className="font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                        {item.label}
                      </Link>
                      <div className="ml-3 mt-1 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {(menuTree[item.id] ?? []).map((child) => (
                          <div key={child.id} className="flex items-center justify-between">
                            <Link href={child.url} className="hover:text-blue-600 dark:hover:text-blue-400">
                              {child.label}
                            </Link>
                            {child.category ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                {child.category}
                              </span>
                            ) : null}
                          </div>
                        ))}
                        {menuTree[item.id]?.length === 0 && <span className="text-xs text-slate-400">Empty</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={cn("nav-link", pathname === link.href && "nav-link-active")}>
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
                  <button className="btn-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
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
            <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">
              Auth not configured
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
