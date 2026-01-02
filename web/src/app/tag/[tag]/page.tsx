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
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tag</p>
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-semibold">#{tag}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
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
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <Tag className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            No articles found
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            There are no published articles with this tag yet.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Browse all articles
          </Link>
        </div>
      )}

      {/* Show other tags */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Explore more tags
        </h2>
        <TagCloud maxTags={20} />
      </div>
    </div>
  );
}
