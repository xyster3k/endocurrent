import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { getArticles } from "@/lib/data/articles";
import { buildCategoryBreadcrumbs } from "@/lib/seo";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  // Decode URL-encoded slug and convert hyphens to spaces
  const decodedSlug = decodeURIComponent(params.slug);
  const categoryName = decodedSlug.replace(/-/g, " ");
  const formattedName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  return {
    title: formattedName,
    description: `Browse all ${formattedName.toLowerCase()} articles on Nexus Med News. Stay updated with the latest medical news and research.`,
    openGraph: {
      title: `${formattedName} Articles | Nexus Med News`,
      description: `Browse all ${formattedName.toLowerCase()} articles on Nexus Med News.`,
    },
  };
}

async function getCategoryName(slug: string): Promise<string> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/categories`, {
      cache: 'no-store'
    });
    const data = await res.json();
    const categories = data.data || [];

    // Find exact match (case-insensitive) but return with original capitalization
    const exactMatch = categories.find((cat: string) => cat.toLowerCase() === slug.toLowerCase());
    return exactMatch || slug.replace(/-/g, " ");
  } catch (error) {
    return slug.replace(/-/g, " ");
  }
}

export default async function CategoryPage(props: { params: Params }) {
  const params = await props.params;
  // Decode URL-encoded slug and convert hyphens to spaces for DB query
  // e.g., "general%20medicine" -> "general medicine"
  // e.g., "bone-health" -> "bone health"
  const decodedSlug = decodeURIComponent(params.slug).replace(/-/g, " ");
  const { data } = await getArticles({ category: decodedSlug, pageSize: 50 });

  // Get the actual category name with exact capitalization from menu or first article
  const categoryName = data.length > 0 && data[0].category
    ? data[0].category
    : await getCategoryName(decodedSlug);

  const breadcrumbsJsonLd = buildCategoryBreadcrumbs(categoryName, params.slug);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40">Category</p>
          <h1 className="font-serif text-3xl font-bold">{categoryName}</h1>
          <p className="font-mono text-xs uppercase tracking-wider text-foreground/40">
            {data.length > 0 ? `${data.length} article${data.length !== 1 ? 's' : ''} in this category` : 'No articles yet in this category'}
          </p>
        </div>
        <Link href="/" className="nav-link">
          ← Back to feed
        </Link>
      </div>
      {data.length > 0 ? (
        <div className="space-y-4">
          {data.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card p-8 text-center">
          <p className="text-foreground/60">No articles have been published in this category yet.</p>
          <Link href="/" className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-foreground/70 underline underline-offset-4 hover:text-foreground">
            Browse all articles
          </Link>
        </div>
      )}
    </div>
  );
}
