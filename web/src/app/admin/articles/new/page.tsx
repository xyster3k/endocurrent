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
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryManuallyEdited, setSummaryManuallyEdited] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
  };

  // Auto-generate summary from body (first ~200 chars + ...)
  const generateSummary = (html: string) => {
    // Strip HTML tags
    const text = html.replace(/<[^>]*>/g, "").trim();
    if (text.length <= 200) return text;
    // Find a good break point (end of sentence or word)
    const truncated = text.slice(0, 200);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 150 ? truncated.slice(0, lastSpace) : truncated) + "...";
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setSlugManuallyEdited(true);
    setSlug(newSlug);
  };

  const handleBodyChange = (newBody: string) => {
    setBodyMarkdown(newBody);
    if (!summaryManuallyEdited) {
      setSummary(generateSummary(newBody));
    }
  };

  const handleSummaryChange = (newSummary: string) => {
    setSummaryManuallyEdited(true);
    setSummary(newSummary);
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  const handleSubmit = async (status: "draft" | "published") => {
    if (!title.trim() || !bodyMarkdown.trim()) {
      setError("Please fill in title and body");
      return;
    }

    // Use current summary or generate if empty
    const finalSummary = summary.trim() || generateSummary(bodyMarkdown);

    setLoading(true);
    setError(null);

    const formEl = document.querySelector("form");
    const formData = new FormData(formEl!);
    const data: Record<string, unknown> = Object.fromEntries(formData);

    // Use controlled state values
    data.title = title;
    data.slug = slug || generateSlug(title);
    data.summary = finalSummary;
    data.body_markdown = bodyMarkdown;
    data.status = status;

    // Convert tags from comma-separated string to array
    if (typeof data.tags === 'string' && data.tags) {
      data.tags = (data.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean);
    } else {
      data.tags = [];
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
        onSubmit={(e) => e.preventDefault()}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *">
            <input
              name="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="e.g. Weekly Endocrine Digest"
            />
          </Field>
          <Field label="Slug (auto-generated)">
            <input
              name="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="auto-generated-from-title"
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Summary (auto-generated, editable)
            </span>
            {summaryManuallyEdited && (
              <button
                type="button"
                onClick={() => {
                  setSummaryManuallyEdited(false);
                  setSummary(generateSummary(bodyMarkdown));
                }}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Reset to auto-generated
              </button>
            )}
          </div>
          <RichTextEditor
            value={summary}
            onChange={handleSummaryChange}
            placeholder="Start writing the body to auto-generate summary, or type your own..."
            minHeight="80px"
          />
          <p className="text-xs text-slate-500">
            {summary.replace(/<[^>]*>/g, "").length}/200 characters • Auto-generated from body content, edit if needed
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Body</span>
          <input type="hidden" name="body_markdown" value={bodyMarkdown} />
          <RichTextEditor
            value={bodyMarkdown}
            onChange={handleBodyChange}
            placeholder="Start writing your article..."
            minHeight="400px"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black"
          >
            {loading ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Publishing..." : "Publish Now"}
          </button>
        </div>
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
