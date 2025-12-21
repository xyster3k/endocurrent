"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ImageUpload } from "@/components/image-upload";

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    // Convert tags from comma-separated string to array
    if (typeof data.tags === 'string' && data.tags) {
      (data as any).tags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else {
      (data as any).tags = [];
    }

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create article");
      }

      router.push("/admin/articles");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold">Create article</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Markdown body with live preview. Images are uploaded to Supabase Storage.
          </p>
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
              name="title"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="e.g. Weekly Endocrine Digest"
            />
          </Field>
          <Field label="Slug">
            <input
              name="slug"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="weekly-endocrine-digest"
            />
          </Field>
          <Field label="Category">
            <select
              name="category"
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
        </div>
        <Field label="Tags (comma separated)">
          <input
            name="tags"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder="thyroid, diabetes, hormone"
          />
        </Field>
        <input type="hidden" name="cover_image_url" value={coverImageUrl || ""} />
        <ImageUpload
          value={coverImageUrl}
          onChange={setCoverImageUrl}
          label="Cover Image"
          description="Recommended: 400x400px square, WebP/PNG format, under 100KB. Displayed as thumbnail in article cards."
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Summary</span>
          <input type="hidden" name="summary" value={summary} />
          <RichTextEditor
            value={summary}
            onChange={setSummary}
            placeholder="One or two sentences that appear in the feed."
            minHeight="120px"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Body</span>
          <input type="hidden" name="body_markdown" value={bodyMarkdown} />
          <RichTextEditor
            value={bodyMarkdown}
            onChange={setBodyMarkdown}
            placeholder="Start writing your article..."
            minHeight="400px"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black"
        >
          {loading ? "Saving..." : "Save draft"}
        </button>
      </form>
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
