 "use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  category?: string | null;
  status?: string | null;
  tags?: string[];
  featured?: boolean;
};

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  return <EditPostClient id={id} />;
}

function EditPostClient({ id }: { id?: string }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Fetch categories from menu
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/posts/${id}`)
      .then((r) => r.json())
      .then((res) => setPost(res.data))
      .catch((err) => setMessage(`Failed to load: ${err}`));
  }, [id]);

  const save = async () => {
    if (!post) return;
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Failed to save: ${data.error || res.statusText}`);
        return;
      }
      setMessage("Saved successfully!");
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const publish = async () => {
    if (!post) return;
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, status: "published" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Failed to publish: ${data.error || res.statusText}`);
        return;
      }
      setPost({ ...post, status: "published" });
      setMessage("Published successfully!");
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unpublish = async () => {
    if (!post) return;
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, status: "draft" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Failed to unpublish: ${data.error || res.statusText}`);
        return;
      }
      setPost({ ...post, status: "draft" });
      setMessage("Unpublished successfully!");
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async () => {
    if (!post) return;
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(`Failed to delete: ${data.error || res.statusText}`);
        return;
      }
      router.push("/admin/posts");
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-slate-500">{id ? "Loading..." : "No post id"}</p>
      </div>
    );
  }

  const isPublished = post.status === "published";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">Edit article</h1>
            {isPublished && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                Published
              </span>
            )}
            {post.status === "draft" && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Draft
              </span>
            )}
          </div>
        </div>
        <Link
          href="/admin/posts"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          ← Back
        </Link>
      </div>

      {message && (
        <div className={`rounded-lg border p-3 text-sm ${
          message.includes('Failed') || message.includes('Error')
            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              required
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              value={post.slug}
              onChange={(e) => setPost({ ...post, slug: e.target.value })}
            />
          </Field>
        <Field label="Category">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={post.category ?? ""}
            onChange={(e) => setPost({ ...post, category: e.target.value })}
          >
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags (comma separated)">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={post.tags?.join(", ") ?? ""}
            onChange={(e) =>
              setPost({
                ...post,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder="thyroid, hormone, treatment"
          />
        </Field>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <input
            type="checkbox"
            checked={post.featured ?? false}
            onChange={(e) => setPost({ ...post, featured: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Pin as featured article
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              This article will appear on the homepage hero section
            </span>
          </div>
        </label>
        <Field label="Summary *">
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            rows={3}
            value={post.summary}
            onChange={(e) => setPost({ ...post, summary: e.target.value })}
            required
          />
        </Field>
        <Field label="Body (Markdown) *">
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            rows={12}
            value={post.body_markdown}
            onChange={(e) => setPost({ ...post, body_markdown: e.target.value })}
            required
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={isLoading}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          {!isPublished && (
            <button
              onClick={publish}
              disabled={isLoading}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish
            </button>
          )}
          {isPublished && (
            <button
              onClick={unpublish}
              disabled={isLoading}
              className="rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unpublish
            </button>
          )}
          <button
            onClick={deletePost}
            disabled={isLoading}
            className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
