"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ShieldCheck, Sparkles, Menu as MenuIcon, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const navLinks = [{ href: "/admin", label: "Admin", requiresRole: ["editor", "admin"] as string[] }];

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
  const { user } = useUser();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/menus")
      .then((res) => res.json())
      .then((res) => res?.data?.items && setMenuItems(res.data.items as MenuItem[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Use hysteresis: different thresholds for hiding vs showing
      if (currentScrollY > 100 && !isScrolled) {
        setIsScrolled(true);
      } else if (currentScrollY < 50 && isScrolled) {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

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

  const userRole = user?.publicMetadata?.role as string | undefined;
  const visibleNavLinks = navLinks.filter(link => {
    if (!link.requiresRole) return true;
    return link.requiresRole.includes(userRole ?? "");
  });

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full transition-all duration-300 border-b bg-white/80 backdrop-blur-lg dark:bg-black/60",
      isScrolled ? "border-white/5" : "border-white/10"
    )}>
      <div className={cn(
        "mx-auto flex items-center px-6 transition-all duration-300",
        isScrolled ? "max-w-6xl py-2.5 justify-start" : "max-w-6xl py-4 justify-between"
      )}>
        <div className="flex items-center gap-3">
          <Link href="/" className={cn("flex flex-col transition-all duration-300", isScrolled ? "" : "gap-1")}>
            {isScrolled ? (
              <Image
                src="/icon.png"
                alt="EndoCurrent Icon"
                width={40}
                height={40}
                className="transition-all duration-300"
              />
            ) : (
              <Image
                src="/logo.png"
                alt="EndoCurrent Logo"
                width={150}
                height={30}
                className="transition-all duration-300"
              />
            )}
            {!isScrolled && (
              <div className="flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-500 whitespace-nowrap">Clinician-led, AI-assisted</span>
              </div>
            )}
          </Link>
        </div>
        <nav className={cn(
          "hidden items-center gap-6 text-sm font-medium md:flex transition-all duration-300",
          isScrolled && "opacity-0 pointer-events-none"
        )}>
          <div className="relative group">
            <button className="nav-link inline-flex items-center gap-1" aria-haspopup="true">
              <MenuIcon className="h-4 w-4" />
              Menu
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuItems.length > 0 ? (
              <div className="invisible absolute left-1/2 z-30 mt-2 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl opacity-0 transition group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sections</p>
                <div className="space-y-3">
                  {(menuTree["root"] ?? []).map((item) => (
                    <div key={item.id}>
                      {item.url ? (
                        <Link href={item.url} className="block font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                          {item.label}
                        </Link>
                      ) : item.category ? (
                        <Link href={`/category/${item.category.toLowerCase()}`} className="block font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                          {item.label}
                        </Link>
                      ) : (
                        <div className="font-bold text-slate-900 dark:text-slate-50">
                          {item.label}
                        </div>
                      )}
                      {menuTree[item.id] && menuTree[item.id].length > 0 && (
                        <div className="ml-3 mt-1.5 space-y-1.5 text-sm">
                          {menuTree[item.id].map((child) => (
                            <div key={child.id} className="flex items-center justify-between">
                              {child.url ? (
                                <Link href={child.url} className="text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                                  {child.label}
                                </Link>
                              ) : child.category ? (
                                <Link href={`/category/${child.category.toLowerCase()}`} className="text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                                  {child.label}
                                </Link>
                              ) : (
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {child.label}
                                </span>
                              )}
                              {child.category ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                  {child.category}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {visibleNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className={cn("nav-link", pathname === link.href && "nav-link-active")}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300",
          isScrolled && "opacity-0 pointer-events-none"
        )}>
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
            <span className="rounded-full bg-slate-500 px-4 py-2 text-sm font-semibold text-white">
              Sign in unavailable
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
