import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ArticleSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  article: ArticleSummary;
};

export function ArticleCard({ article }: Props) {
  const isDraft = article.status === "draft" || article.status === "draft_ai";

  return (
    <article className="group relative flex flex-col border border-border bg-card">
      {article.cover_image_url && (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold leading-tight line-clamp-2">
            {article.title}
          </h3>
          {article.author && (
            <p className="mt-1.5 font-mono text-xs uppercase tracking-wider text-foreground/50">
              Words by <strong className="font-semibold text-foreground/70">{article.author.name}</strong>
            </p>
          )}
          {isDraft && (
            <span className="mt-2 inline-block border border-amber-400 px-2 py-0.5 font-mono text-xs text-amber-700 dark:text-amber-300">
              Draft
            </span>
          )}
          <div className="mt-3 text-sm leading-relaxed text-foreground/60 line-clamp-3 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.summary}</ReactMarkdown>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {article.published_at && (
            <span className="font-mono text-xs text-foreground/40">
              {formatDate(article.published_at)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-transform duration-150 group-hover:translate-x-1">
            Read more <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {(article.tags?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
            {article.tags!.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="border border-border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-foreground/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link
        href={`/articles/${article.slug}`}
        className="absolute inset-0"
        aria-label={`Read ${article.title}`}
      />
    </article>
  );
}
