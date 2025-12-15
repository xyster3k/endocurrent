import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles } from "@/lib/data/articles";

export const revalidate = 300;
export const runtime = "edge";

type Params = Promise<{ slug: string }>;

export default async function CategoryPage(props: { params: Params }) {
  const params = await props.params;
  const { data } = await getArticles({ category: params.slug });
  if (!data || data.length === 0) {
    return notFound();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</p>
          <h1 className="text-3xl font-semibold capitalize">{params.slug.replace(/-/g, " ")}</h1>
          <p className="text-sm text-slate-500">Latest articles in this category</p>
        </div>
        <Link href="/" className="nav-link">
          ← Back to feed
        </Link>
      </div>
      <div className="space-y-4">
        {data.map((a) => (
          <div key={a.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <Link href={`/articles/${a.slug}`} className="text-xl font-semibold hover:underline">
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
    </div>
  );
}
