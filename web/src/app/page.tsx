import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { AdSlotClient } from "@/components/ad-slot-client";
import { shouldShowAds } from "@/lib/ads";
import { getArticles } from "@/lib/data/articles";

export const revalidate = 300;
export const runtime = "edge";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  let articles: Awaited<ReturnType<typeof getArticles>>["data"] = [];
  let meta: Awaited<ReturnType<typeof getArticles>>["meta"] = { page: 1, pageSize: 10, total: 0 };

  try {
    const result = await getArticles({
      tag: typeof searchParams.tag === "string" ? searchParams.tag : undefined,
      category: typeof searchParams.category === "string" ? searchParams.category : undefined,
      search: typeof searchParams.q === "string" ? searchParams.q : undefined,
    });
    articles = result.data;
    meta = result.meta;
  } catch (error) {
    console.error("Failed to load articles, falling back to empty list", error);
  }
  const showAds = shouldShowAds("FREE");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-8 shadow-xl dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm ring-1 ring-white/40 backdrop-blur dark:bg-slate-900/60 dark:text-blue-200">
              Weekly endocrine digest
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
              Clear, clinician-led news for endocrine teams. Ads off when premium. AI drafts stay behind review.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Built for fast skimming on call, with full-length articles, structured references, likes/reports, and an editorial backend.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/articles/weekly-endocrine-digest"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
              >
                Read the sample article
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/posts"
                className="btn-primary inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                Go to editor tools
                <Compass className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-300">
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-white/60 dark:bg-slate-900/60 dark:ring-slate-800">
                Supabase + Clerk + Stripe
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-white/60 dark:bg-slate-900/60 dark:ring-slate-800">
                Cloudflare Pages deploy
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-white/60 dark:bg-slate-900/60 dark:ring-slate-800">
                AdSense gated by subscription
              </span>
            </div>
          </div>
          <div className="hidden h-full min-w-[260px] flex-1 rounded-2xl border border-white/50 bg-white/70 p-5 text-sm shadow-md ring-1 ring-slate-100 backdrop-blur md:flex md:max-w-sm dark:border-slate-800 dark:bg-slate-900/60 dark:ring-slate-800">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Stack
              </p>
              <ul className="space-y-1 text-slate-700 dark:text-slate-200">
                <li>Next.js 15 (App Router) on Cloudflare Pages</li>
                <li>Supabase Postgres + Storage with RLS</li>
                <li>Clerk auth & billing (Stripe under the hood)</li>
                <li>AdSense toggled off for premium users</li>
                <li>Optional AI draft generation endpoint</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Latest briefs
            </p>
            <h2 className="text-2xl font-semibold">Editorial feed</h2>
            <p className="text-sm text-slate-500">
              Showing {articles.length} of {meta.total} articles
            </p>
          </div>
          <Link
            href="/admin"
            className="hidden rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:-translate-y-0.5 hover:shadow-sm md:inline-flex"
          >
            New article
          </Link>
        </div>
        <div className="grid gap-4">
          {articles.map((article, idx) => (
            <div key={article.id} className="space-y-3">
              <ArticleCard article={article} />
              {showAds && idx % 2 === 1 ? (
                <AdSlotClient slotId={`feed-${idx}`} show={showAds} />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
