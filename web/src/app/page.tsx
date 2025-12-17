import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { AdSlot } from "@/components/ad-slot";
import { shouldShowAds } from "@/lib/ads";
import { getArticles, getFeaturedArticle } from "@/lib/data/articles";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const { data: articles, meta } = await getArticles({
    tag: typeof searchParams.tag === "string" ? searchParams.tag : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    search: typeof searchParams.q === "string" ? searchParams.q : undefined,
  });
  const showAds = shouldShowAds("FREE");

  // Get featured article or fallback to latest
  const featuredArticle = await getFeaturedArticle();
  const heroArticle = featuredArticle || (articles.length > 0 ? articles[0] : null);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
      {heroArticle && (
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {heroArticle.published_at ? new Date(heroArticle.published_at).toLocaleDateString() : ""}
            </span>
          </div>
          <Link href={`/articles/${heroArticle.slug}`} className="group">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {heroArticle.title}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              {heroArticle.summary}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
              Read article
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </section>
      )}
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
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No articles yet</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Publish your first article from the admin panel to see it here.
              </p>
              <Link
                href="/admin/articles/new"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-black"
              >
                Create Article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            articles.map((article, idx) => (
              <div key={article.id} className="space-y-3">
                <ArticleCard article={article} />
                {showAds && idx % 2 === 1 ? (
                  <AdSlot slotId={`feed-${idx}`} show={showAds} />
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
