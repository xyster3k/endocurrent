import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { ArticleSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  article: ArticleSummary;
  variant?: "featured" | "compact";
};

export function ArticleCard({ article, variant = "featured" }: Props) {
  const isDraft = article.status === "draft" || article.status === "draft_ai";
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-900/70",
        variant === "compact" && "border-none bg-transparent shadow-none hover:translate-y-0"
      )}
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {article.category || "Endocrinology"}
          </span>
          {isDraft ? (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100">
              Draft
            </span>
          ) : null}
          {article.published_at ? (
            <span>{new Date(article.published_at).toLocaleDateString()}</span>
          ) : (
            <span>Not published</span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <Link href={`/articles/${article.slug}`} className="group/link">
              <h3 className="text-2xl font-semibold leading-tight tracking-tight group-hover/link:text-blue-700 dark:group-hover/link:text-blue-300">
                {article.title}
              </h3>
            </Link>
            {article.author ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                By {article.author.name}
              </p>
            ) : null}
          </div>
          <div className="text-base text-slate-600 dark:text-slate-300 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.summary}</ReactMarkdown>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
              <Clock3 className="h-4 w-4" />
              {article.reading_time_minutes} min read
            </span>
            {(article.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Link
        href={`/articles/${article.slug}`}
        className="absolute inset-0"
        aria-label={`Read ${article.title}`}
      />
      <div className="pointer-events-none absolute right-5 top-5 rounded-full bg-slate-900 text-white opacity-0 transition group-hover:opacity-100 dark:bg-white dark:text-black">
        <ArrowUpRight className="h-5 w-5" />
      </div>
    </article>
  );
}
