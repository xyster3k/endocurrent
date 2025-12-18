import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles } from "@/lib/data/articles";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

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
  const { data } = await getArticles({ category: params.slug, pageSize: 50 });

  // Get the actual category name with exact capitalization from menu or first article
  const categoryName = data.length > 0 && data[0].category
    ? data[0].category
    : await getCategoryName(params.slug);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</p>
          <h1 className="text-3xl font-semibold">{categoryName}</h1>
          <p className="text-sm text-slate-500">
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
            <div key={a.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <Link href={`/articles/${a.slug}`} className="text-xl font-semibold hover:text-blue-600 dark:hover:text-blue-400">
                {a.title}
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-300">{a.summary}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {a.published_at ? <span>{new Date(a.published_at).toLocaleDateString()}</span> : <span>Draft</span>}
                {a.reading_time_minutes ? <span>{a.reading_time_minutes} min read</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-slate-600 dark:text-slate-300">No articles have been published in this category yet.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
            Browse all articles
          </Link>
        </div>
      )}
    </div>
  );
}
