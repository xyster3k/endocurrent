import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import type { ArticleSummary } from "@/lib/types";

export type CategoryStyle = {
  bg: string;
  darkBg: string;
  accent: string;
};

export const categoryStyles: Record<string, CategoryStyle> = {
  Oncology:         { bg: "bg-[#fdf2f0]", darkBg: "dark:bg-[#1a100e]", accent: "text-rose-800 dark:text-rose-300" },
  Neurology:        { bg: "bg-[#f0eef8]", darkBg: "dark:bg-[#12101a]", accent: "text-violet-800 dark:text-violet-300" },
  Endocrinology:    { bg: "bg-[#fdf8ed]", darkBg: "dark:bg-[#1a1710]", accent: "text-amber-800 dark:text-amber-300" },
  Cardiology:       { bg: "bg-[#eef3fb]", darkBg: "dark:bg-[#0e1118]", accent: "text-blue-800 dark:text-blue-300" },
  Gastroenterology: { bg: "bg-[#eef8f0]", darkBg: "dark:bg-[#0e1810]", accent: "text-emerald-800 dark:text-emerald-300" },
  Pulmonology:      { bg: "bg-[#f0f5f8]", darkBg: "dark:bg-[#0e1214]", accent: "text-cyan-800 dark:text-cyan-300" },
  Rheumatology:     { bg: "bg-[#f8f0f5]", darkBg: "dark:bg-[#180e14]", accent: "text-pink-800 dark:text-pink-300" },
  Dermatology:      { bg: "bg-[#f5f0e8]", darkBg: "dark:bg-[#141008]", accent: "text-orange-800 dark:text-orange-300" },
};

const defaultStyle: CategoryStyle = {
  bg: "bg-[#f8f5f0]",
  darkBg: "dark:bg-[#14120e]",
  accent: "text-stone-800 dark:text-stone-300",
};

function getCategorySlug(category: string) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

type Props = {
  category: string;
  articles: ArticleSummary[];
  totalInCategory?: number;
};

export function CategorySection({ category, articles, totalInCategory }: Props) {
  const style = categoryStyles[category] || defaultStyle;
  const hasMore = totalInCategory && totalInCategory > articles.length;

  return (
    <section className={`${style.bg} ${style.darkBg} border-t border-border`}>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <h2 className={`font-serif text-3xl font-bold ${style.accent}`}>
            {category}
          </h2>
          {totalInCategory && (
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-foreground/40">
              {totalInCategory} article{totalInCategory !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 text-center">
            <Link
              href={`/category/${getCategorySlug(category)}`}
              className="inline-flex items-center gap-2 border border-border px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all hover:bg-foreground hover:text-background"
            >
              View all {category}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
