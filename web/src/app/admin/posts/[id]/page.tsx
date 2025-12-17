 "use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Post = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  category?: string | null;
  status?: string | null;
  tags?: string[];
};

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  return <EditPostClient id={id} />;
}

function EditPostClient({ id }: { id?: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/posts/${id}`)
      .then((r) => r.json())
      .then((res) => setPost(res.data));
  }, [id]);

  const save = async () => {
    setMessage(null);
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    if (!res.ok) {
      setMessage("Failed to save");
      return;
    }
    setMessage("Saved");
  };

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-slate-500">{id ? "Loading..." : "No post id"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">Edit post</h1>
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
            />
          </Field>
          <Field label="Slug">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              value={post.slug}
              onChange={(e) => setPost({ ...post, slug: e.target.value })}
            />
          </Field>
        <Field label="Category">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={post.category ?? ""}
            onChange={(e) => setPost({ ...post, category: e.target.value })}
          />
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
          />
        </Field>
        <Field label="Status">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={post.status ?? "draft"}
            onChange={(e) => setPost({ ...post, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="draft_ai">AI Draft</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
        <Field label="Summary">
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            rows={3}
            value={post.summary}
            onChange={(e) => setPost({ ...post, summary: e.target.value })}
          />
        </Field>
        <Field label="Body (Markdown)">
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            rows={10}
            value={post.body_markdown}
            onChange={(e) => setPost({ ...post, body_markdown: e.target.value })}
          />
        </Field>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
          >
            Save
          </button>
          <a
            href="/admin/posts"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Back to list
          </a>
          {message ? <span className="text-sm text-slate-600 dark:text-slate-300">{message}</span> : null}
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
