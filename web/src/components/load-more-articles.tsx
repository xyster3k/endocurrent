"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/article-card";
import type { ArticleSummary } from "@/lib/types";

type Props = {
  initialArticles: ArticleSummary[];
  totalCount: number;
  pageSize: number;
};

export function LoadMoreArticles({ initialArticles, totalCount, pageSize }: Props) {
  const [articles, setArticles] = useState<ArticleSummary[]>(initialArticles);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const hasMore = articles.length < totalCount;

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/articles?page=${nextPage}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setArticles((prev) => [...prev, ...data.data]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more articles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {loading ? "Loading..." : `Load more (${totalCount - articles.length} remaining)`}
          </button>
        </div>
      )}
    </>
  );
}
