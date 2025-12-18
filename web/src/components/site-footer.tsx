import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-white/60 py-10 backdrop-blur dark:bg-black/60">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-6 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">EndoCurrent</h3>
          <p className="text-sm text-slate-500">
            Curated medical intelligence. No patient data. Evidence-first.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
          <Link href="/about">About</Link>
          <Link href="/policies/privacy">Privacy</Link>
          <Link href="/policies/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
