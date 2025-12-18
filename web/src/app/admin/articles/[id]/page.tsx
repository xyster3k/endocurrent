"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    body_markdown: "",
    category: "",
    tags: [] as string[],
    status: "draft" as "draft" | "draft_ai" | "published" | "archived",
    featured: false,
  });

  useEffect(() => {
    // Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch((err) => console.error("Failed to fetch categories:", err));

    // Fetch article
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/articles/${articleId}`);
        if (!res.ok) throw new Error("Failed to fetch article");
        const result = await res.json();
        if (!result.data) throw new Error("Article not found");
        const article = result.data;

        setFormData({
          title: article.title || "",
          slug: article.slug || "",
          summary: article.summary || "",
          body_markdown: article.body_markdown || "",
          category: article.category || "",
          tags: article.tags || [],
          status: article.status || "draft",
          featured: article.featured || false,
        });
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update article");
      }
      router.push("/admin/articles");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete article");
      }
      router.push("/admin/articles");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/articles/${articleId}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to publish article");
      }
      router.push("/admin/articles");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/articles/${articleId}/unpublish`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to unpublish article");
      }
      router.push("/admin/articles");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.title) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <p className="text-slate-600 dark:text-slate-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold">Edit article</h1>
        </div>
        <Link
          href="/admin/articles"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          ← Back
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="e.g. Weekly Endocrine Digest"
            />
          </Field>
          <Field label="Slug">
            <input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="weekly-endocrine-digest"
            />
          </Field>
          <Field label="Category">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="draft">Draft</option>
              <option value="draft_ai">AI Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <input
            value={formData.tags.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder="thyroid, diabetes, hormone"
          />
        </Field>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Pin as featured article
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              This article will appear on the homepage hero section (only one article can be featured at a time)
            </span>
          </div>
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Summary</span>
          <RichTextEditor
            value={formData.summary}
            onChange={(markdown) => setFormData({ ...formData, summary: markdown })}
            placeholder="One or two sentences that appear in the feed."
            minHeight="120px"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Body</span>
          <RichTextEditor
            value={formData.body_markdown}
            onChange={(markdown) => setFormData({ ...formData, body_markdown: markdown })}
            placeholder="Start writing your article..."
            minHeight="400px"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 dark:bg-white dark:text-black"
          >
            Save changes
          </button>
          {formData.status !== "published" && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {formData.status === "published" && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
