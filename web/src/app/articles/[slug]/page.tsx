import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LikeToggle } from "@/components/like-toggle";
import { ReportDialog } from "@/components/report-dialog";
import { AdSlotClient } from "@/components/ad-slot-client";
import { ShareButton } from "@/components/share-button";
import { shouldShowAds } from "@/lib/ads";
import { getArticleBySlug } from "@/lib/data/articles";
import { buildArticleJsonLd, buildArticleBreadcrumbs } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};

  const images = article.cover_image_url ? [article.cover_image_url] : undefined;

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      images,
      type: "article",
      publishedTime: article.published_at || undefined,
      authors: ["Nexus Med News"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images,
    },
  };
}

async function getAuthorName(authorId: string | null | undefined): Promise<string | null> {
  if (!authorId) return null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient({ useServiceRole: true });
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", authorId)
      .maybeSingle();

    return (profile as any)?.display_name ?? null;
  } catch (error) {
    console.error("Error fetching author info:", error);
    return null;
  }
}

async function getUserLikeValue(articleId: string, userId: string | null): Promise<number | null> {
  if (!userId) return null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient({ useServiceRole: true });
    const likes = (supabase as any).from("article_likes");
    const { data, error } = await likes
      .select("value")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.value;
  } catch (error) {
    console.error('Error fetching user like value:', error);
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
  const breadcrumbsJsonLd = buildArticleBreadcrumbs(article);

  // Fetch author name from the author_id stored in the article
  const authorName = await getAuthorName((article as any).author_id);

  // Get current user's ID and like status
  let userLikeValue: number | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userLikeValue = await getUserLikeValue(article.id, user?.id ?? null);
  } catch {
    // User not authenticated
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-foreground/40">
          <span className="border border-border px-3 py-1 text-foreground/70">
            {article.category || "Endocrinology"}
          </span>
          {article.published_at ? (
            <span>{formatDate(article.published_at)}</span>
          ) : (
            <span className="text-amber-600">Draft</span>
          )}
          <span className="border border-border px-3 py-1 text-foreground/50">
            {article.reading_time_minutes} min read
          </span>
        </div>
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight">
          {article.title}
        </h1>
        {authorName ? (
          <p className="font-mono text-sm uppercase tracking-wider text-foreground/50">
            Words by <strong className="font-semibold text-foreground/70">{authorName}</strong>
          </p>
        ) : null}
        <div className="text-lg leading-relaxed text-foreground/60 prose prose-lg max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.summary}</ReactMarkdown>
        </div>
      </div>

      {article.cover_image_url ? (
        <div className="relative aspect-[1200/630] w-full overflow-hidden border border-border">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </div>
      ) : null}

      <article className="prose prose-slate prose-lg max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.body_markdown}
        </ReactMarkdown>
      </article>

      {showAds ? <AdSlotClient slotId="article-top" show={showAds} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4">
        <LikeToggle
          articleId={article.id}
          initialLikeCount={article.like_count ?? 0}
          initialDislikeCount={article.dislike_count ?? 0}
          userLikeValue={userLikeValue}
        />
        <div className="flex items-center gap-3">
          <ShareButton articleId={article.id} />
          <ReportDialog articleId={article.id} />
        </div>
      </div>

      {showAds ? <AdSlotClient slotId="article-bottom" show={showAds} /> : null}

      {article.references && article.references.length > 0 ? (
        <section className="border border-border bg-card p-6">
          <h3 className="font-serif text-lg font-bold">References</h3>
          <ul className="mt-3 space-y-2 text-sm text-foreground/60">
            {article.references.map((ref) => (
              <li key={ref.label} className="flex items-start gap-3">
                <span className="font-semibold text-foreground/80">
                  {ref.label}
                </span>
                <span>
                  {ref.citation_text}{" "}
                  {ref.url ? (
                    <a
                      href={ref.url}
                      className="inline-flex items-center gap-1 text-foreground underline decoration-dotted underline-offset-4"
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
