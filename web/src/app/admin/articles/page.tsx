import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, requireRole } from "@/lib/auth";
import { getArticles } from "@/lib/data/articles";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 20;

export default async function AdminArticlesPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  try {
    requireRole(user, ["editor", "admin"]);
  } catch {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-12">
        <h1 className="text-3xl font-semibold">Articles</h1>
        <p className="text-slate-600 dark:text-slate-300">
          You need an editor or admin role to manage articles. Current role: {user.role}.
        </p>
      </div>
    );
  }

  const currentPage = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const { data, meta } = await getArticles({
    includeDrafts: true,
    pageSize: PAGE_SIZE,
    page: currentPage,
  });

  const totalPages = Math.ceil(meta.total / PAGE_SIZE);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold">Articles</h1>
          <p className="text-sm text-slate-500">
            {meta.total} total articles
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          New draft
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((article) => (
              <tr
                key={article.id}
                className="border-t border-slate-100 text-slate-700 last:border-b dark:border-slate-800 dark:text-slate-200"
              >
                <td className="px-4 py-3 font-medium">{article.title}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide dark:bg-slate-800">
                    {article.status || "published"}
                  </span>
                </td>
                <td className="px-4 py-3">{article.category || "—"}</td>
                <td className="px-4 py-3">
                  {article.published_at ? formatDate(article.published_at) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs font-semibold">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/admin/articles?page=${currentPage - 1}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-400 dark:border-slate-700">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={`/admin/articles?page=${currentPage + 1}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-400 dark:border-slate-700">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
