"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { ShieldCheck, Sparkles, LogOut, User as UserIcon, Menu as MenuIcon, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/search-bar";

const navLinks = [{ href: "/admin", label: "Admin", requiresRole: ["editor", "admin"] as string[] }];

// Convert category name to URL slug (spaces to hyphens, lowercase)
const categoryToSlug = (category: string) => category.toLowerCase().replace(/\s+/g, "-");

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
  const { user, profile, loading, signOut } = useAuth();
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
  const userRole = profile?.role ?? undefined;
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
          <Link href="/" className="flex flex-col transition-all duration-300">
            <div className={cn("flex items-center transition-all duration-300", isScrolled ? "gap-2" : "gap-3")}>
              {isScrolled ? (
                <Image
                  src="/site-icon.png"
                  alt="Nexus Med News Icon"
                  width={36}
                  height={36}
                  className="transition-all duration-300"
                />
              ) : (
                <>
                  <Image
                    src="/logo.png"
                    alt="Nexus Med News Logo"
                    width={78}
                    height={78}
                    className="transition-all duration-300"
                  />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Nexus</span>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Med</span>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">News</span>
                  </div>
                </>
              )}
            </div>
            {!isScrolled && (
              <div className="flex items-center gap-1.5 text-xs mt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-500 whitespace-nowrap">Clinician-led, AI-assisted</span>
              </div>
            )}
          </Link>
        </div>
        <nav className={cn(
          "ml-auto hidden items-center gap-6 text-sm font-medium md:flex transition-all duration-300",
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
                        <Link href={`/category/${categoryToSlug(item.category)}`} className="block font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
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
                                <Link href={`/category/${categoryToSlug(child.category)}`} className="text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
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
          "ml-auto flex items-center gap-3 transition-all duration-300",
          isScrolled && "ml-auto"
        )}>
          <SearchBar />
        </div>
        <div className={cn(
          "ml-2.5 flex items-center gap-3 transition-all duration-300",
          isScrolled && "opacity-0 pointer-events-none"
        )}>
          {!loading && !user ? (
            <Link
              href="/sign-in"
              className="btn-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Sign in
            </Link>
          ) : user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <UserIcon className="h-4 w-4" />
                {profile?.display_name || user.email?.split("@")[0] || "Account"}
              </button>
              <div className="invisible absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl opacity-0 transition group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <UserIcon className="h-4 w-4" />
                  Account
                </Link>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
