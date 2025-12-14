 "use client";
import React, { useState } from "react";

function PostForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
        summary,
        body_markdown: body,
        category,
        status,
      }),
    });
    if (!res.ok) {
      setMessage("Failed to create post");
      return;
    }
    setMessage("Post created");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Slug">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from title"
          />
        </Field>
        <Field label="Category">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="thyroid / diabetes / oncology / general"
          />
        </Field>
        <Field label="Status">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </Field>
      <Field label="Body (Markdown)">
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          Save post
        </button>
        {message ? <span className="text-sm text-slate-600 dark:text-slate-300">{message}</span> : null}
      </div>
    </div>
  );
}

export const runtime = "edge";

export default function NewPostPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">Create post</h1>
        <p className="text-slate-600 dark:text-slate-300">Markdown body, tags, category, and publish settings.</p>
      </div>
      <PostForm />
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
