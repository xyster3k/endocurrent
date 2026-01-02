import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { SearchBar } from "@/components/search-bar";
import { getArticles } from "@/lib/data/articles";

export const revalidate = 0; // Always fresh search results

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(props: { searchParams: SearchParams }): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : "";

  return {
    title: query ? `Search: ${query}` : "Search",
    description: query
      ? `Search results for "${query}" on Nexus Med News`
      : "Search articles on Nexus Med News",
  };
}

export default async function SearchPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : "";

  let articles: Awaited<ReturnType<typeof getArticles>>["data"] = [];
  let total = 0;

  if (query.trim()) {
    try {
      const result = await getArticles({
        search: query.trim(),
        pageSize: 50,
      });
      articles = result.data;
      total = result.meta.total;
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Search</p>
            <h1 className="text-3xl font-semibold">
              {query ? `Results for "${query}"` : "Search articles"}
            </h1>
          </div>
          <Link href="/" className="nav-link text-sm">
            ← Back to feed
          </Link>
        </div>

        {/* Search input on the page */}
        <form action="/search" method="GET" className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by title, content, or keywords..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-blue-400"
              autoFocus={!query}
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {query ? (
        <>
          <p className="text-sm text-slate-500">
            {total === 0
              ? "No articles found"
              : `Found ${total} article${total !== 1 ? "s" : ""}`}
          </p>

          {articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <Search className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                No results found
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Try different keywords or check your spelling
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Browse all articles
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <Search className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            Start searching
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Enter keywords to find articles on any medical topic
          </p>
        </div>
      )}
    </div>
  );
}
