 "use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function PostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
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

  const submit = async (statusToSet: "draft" | "published") => {
    if (!title.trim() || !summary.trim() || !body.trim()) {
      setMessage("Please fill in title, summary, and body");
      return;
    }

    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          summary,
          body_markdown: body,
          category: category || null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status: statusToSet,
          featured,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Failed to create post: ${data.error || res.statusText}`);
        return;
      }
      setMessage(statusToSet === "published" ? "Post published successfully!" : "Post saved as draft!");
      setTimeout(() => router.push("/admin/posts"), 1000);
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title *">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Treatment for Hypothyroidism"
            required
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from title"
          />
        </Field>
        <Field label="Category">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="thyroid, hormone, treatment"
          />
        </Field>
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
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
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One or two sentences that appear in the article feed"
          required
        />
      </Field>
      <Field label="Body (Markdown) *">
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          rows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="## Section Title&#10;&#10;Your content here in **markdown** format..."
          required
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => submit("draft")}
          disabled={isLoading}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black"
        >
          {isLoading ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={() => submit("published")}
          disabled={isLoading}
          className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Publishing..." : "Publish Now"}
        </button>
        <Link
          href="/admin/posts"
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
        {message ? (
          <span className={`text-sm ${message.includes('Failed') || message.includes('Error') || message.includes('fill') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">Create new article</h1>
        <p className="text-slate-600 dark:text-slate-300">Write your article in markdown format. Save as draft to review later, or publish immediately.</p>
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
