import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getArticlesGroupedByCategory, getFeaturedArticle, getCategories } from "@/lib/data/articles";
import { CategorySection } from "@/components/category-section";
import { TagCloud } from "@/components/tag-cloud";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

// Display order — categories listed here appear first, rest follow alphabetically
const CATEGORY_ORDER = [
  "Endocrinology",
  "Medical AI",
  "Oncology",
  "General medicine",
  "Neurology",
  "Genetics",
];

export default async function Home() {
  let grouped: Record<string, import("@/lib/types").ArticleSummary[]> = {};

  try {
    grouped = await getArticlesGroupedByCategory(4);
  } catch (error) {
    console.error("Failed to load articles", error);
  }

  const [featuredArticle, dbCategories] = await Promise.all([
    getFeaturedArticle(),
    getCategories(),
  ]);

  // Build image lookup from database categories
  const categoryImageMap: Record<string, string | null> = {};
  for (const cat of dbCategories) {
    categoryImageMap[cat.name] = cat.image_url ?? null;
  }

  // Sort categories: DB order first, then CATEGORY_ORDER fallback, then alphabetical
  const articleCategories = Object.keys(grouped);
  const dbOrder = dbCategories.map((c) => c.name).filter((n) => articleCategories.includes(n));
  const remaining = articleCategories.filter((c) => !dbOrder.includes(c));
  const sortedCategories = [
    ...dbOrder,
    ...CATEGORY_ORDER.filter((c) => remaining.includes(c)),
    ...remaining.filter((c) => !CATEGORY_ORDER.includes(c)).sort(),
  ];

  return (
    <div>
      {/* Hero: Featured article */}
      {featuredArticle && (
        <section className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center md:gap-10">
            {featuredArticle.cover_image_url && (
              <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden md:w-72">
                <Image
                  src={featuredArticle.cover_image_url}
                  alt={featuredArticle.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 288px"
                  priority
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40">Featured</p>
              <Link href={`/articles/${featuredArticle.slug}`} className="group">
                <h1 className="mt-2 font-serif text-4xl font-bold leading-tight md:text-5xl">
                  {featuredArticle.title}
                </h1>
              </Link>
              {featuredArticle.author && (
                <p className="mt-3 font-mono text-sm uppercase tracking-wider text-foreground/50">
                  Words by <strong className="font-semibold text-foreground/70">{featuredArticle.author.name}</strong>
                </p>
              )}
              <div className="mt-4 text-lg leading-relaxed text-foreground/60 prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{featuredArticle.summary}</ReactMarkdown>
              </div>
              <Link
                href={`/articles/${featuredArticle.slug}`}
                className="group/link mt-6 inline-flex items-center gap-2 border border-foreground px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all hover:bg-foreground hover:text-background"
              >
                Read article
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
              </Link>
              {featuredArticle.published_at && (
                <span className="ml-4 font-mono text-xs text-foreground/30">
                  {formatDate(featuredArticle.published_at)}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Category sections */}
      {sortedCategories.map((category) => (
        <CategorySection
          key={category}
          category={category}
          articles={grouped[category]}
          imageUrl={categoryImageMap[category]}
        />
      ))}

      {/* Tags */}
      {sortedCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-6">
          <div className="border border-border bg-card px-8 py-10">
            <h2 className="mb-6 text-center font-mono text-xs font-semibold uppercase tracking-[0.3em] text-foreground/40">
              Explore by topic
            </h2>
            <TagCloud maxTags={30} />
          </div>
        </section>
      )}

      {/* Empty state */}
      {sortedCategories.length === 0 && (
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-6 py-24 text-center">
            <h2 className="font-serif text-3xl font-bold">No articles yet</h2>
            <p className="mt-3 text-foreground/50">
              Publish your first article from the admin panel to see it here.
            </p>
            <Link
              href="/admin/articles/new"
              className="mt-6 inline-flex items-center gap-2 border border-foreground px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest transition-all hover:bg-foreground hover:text-background"
            >
              Create Article
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
