import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LikeToggle } from "@/components/like-toggle";
import { ReportDialog } from "@/components/report-dialog";
import { AdSlotClient } from "@/components/ad-slot-client";
import { ShareButton } from "@/components/share-button";
import { shouldShowAds } from "@/lib/ads";
import { getArticleBySlug } from "@/lib/data/articles";
import { buildArticleJsonLd } from "@/lib/seo";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | EndoCurrent`,
    description: article.summary,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
      type: "article",
    },
  };
}

async function getAuthorName(authorId: string | null | undefined): Promise<string | null> {
  if (!authorId) return null;

  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) return null;

    const response = await fetch(`https://api.clerk.com/v1/users/${authorId}`, {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const userData = await response.json();

    // Try display_name from publicMetadata first
    const displayName = userData.public_metadata?.display_name;
    if (displayName) return displayName;

    // Fall back to email username
    const email = userData.email_addresses?.[0]?.email_address;
    if (email) {
      return email.split('@')[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching author info:', error);
    return null;
  }
}

export default async function ArticlePage(props: { params: Params }) {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    return notFound();
  }

  const showAds = shouldShowAds("FREE");
  const jsonLd = buildArticleJsonLd(article);

  // Fetch author name from the author_id stored in the article
  const authorName = await getAuthorName((article as any).author_id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {article.category || "Endocrinology"}
          </span>
          {article.published_at ? (
            <span>{new Date(article.published_at).toLocaleDateString()}</span>
          ) : (
            <span className="text-amber-600">Draft</span>
          )}
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
          {article.title}
        </h1>
        {authorName ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            By {authorName}
          </p>
        ) : null}
        <p className="text-lg text-slate-600 dark:text-slate-300">{article.summary}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            <Sparkles className="h-4 w-4" />
            {article.reading_time_minutes} min read
          </span>
        </div>
      </div>

      {article.cover_image_url ? (
        <div className="overflow-hidden rounded-2xl">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="h-72 w-full rounded-2xl object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <article className="prose prose-slate prose-lg max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.body_markdown}
        </ReactMarkdown>
      </article>

      {showAds ? <AdSlotClient slotId="article-top" show={showAds} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <LikeToggle
          articleId={article.id}
          initialLikeCount={article.like_count ?? 0}
          initialDislikeCount={article.dislike_count ?? 0}
        />
        <div className="flex items-center gap-3">
          <ShareButton />
          <ReportDialog articleId={article.id} />
        </div>
      </div>

      {showAds ? <AdSlotClient slotId="article-bottom" show={showAds} /> : null}

      {article.references && article.references.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="text-lg font-semibold">References</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {article.references.map((ref) => (
              <li key={ref.label} className="flex items-start gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {ref.label}
                </span>
                <span>
                  {ref.citation_text}{" "}
                  {ref.url ? (
                    <a
                      href={ref.url}
                      className="inline-flex items-center gap-1 text-blue-600 underline decoration-dotted underline-offset-4 dark:text-blue-300"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
