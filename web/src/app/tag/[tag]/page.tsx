import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { TagCloud } from "@/components/tag-cloud";
import { getArticles } from "@/lib/data/articles";

export const revalidate = 300;

type Params = Promise<{ tag: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const tag = decodeURIComponent(params.tag);
  const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1);

  return {
    title: `#${formattedTag}`,
    description: `Articles tagged with "${formattedTag}" on Nexus Med News. Explore medical research and news.`,
    openGraph: {
      title: `#${formattedTag} | Nexus Med News`,
      description: `Articles tagged with "${formattedTag}" on Nexus Med News.`,
    },
  };
}

export default async function TagPage(props: { params: Params }) {
  const params = await props.params;
  const tag = decodeURIComponent(params.tag).toLowerCase();

  const { data, meta } = await getArticles({ tag, pageSize: 50 });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40">Tag</p>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-foreground/40" />
            <h1 className="font-serif text-3xl font-bold">#{tag}</h1>
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-foreground/40">
            {meta.total === 0
              ? "No articles with this tag"
              : `${meta.total} article${meta.total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/" className="nav-link text-sm">
          ← Back to feed
        </Link>
      </div>

      {data.length > 0 ? (
        <div className="space-y-4">
          {data.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-foreground/20" />
          <h3 className="mt-4 font-serif text-lg font-bold">
            No articles found
          </h3>
          <p className="mt-2 text-foreground/50">
            There are no published articles with this tag yet.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-foreground/70 underline underline-offset-4 hover:text-foreground"
          >
            Browse all articles
          </Link>
        </div>
      )}

      {/* Show other tags */}
      <div className="mt-8 border border-border bg-card p-6">
        <h2 className="mb-4 font-serif text-lg font-bold">
          Explore more tags
        </h2>
        <TagCloud maxTags={20} />
      </div>
    </div>
  );
}
