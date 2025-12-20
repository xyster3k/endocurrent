"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Save, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

type PageData = {
  slug: string;
  label: string;
  description: string;
};

const PAGES: PageData[] = [
  { slug: "about", label: "About", description: "About us page content" },
  { slug: "privacy", label: "Privacy & Cookies", description: "Privacy policy page" },
  { slug: "terms", label: "Terms of Use", description: "Terms of service page" },
];

export default function AdminPagesPage() {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (selectedPage) {
      loadPageContent(selectedPage);
    }
  }, [selectedPage]);

  const loadPageContent = async (slug: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pages?slug=${slug}`);
      const data = await res.json();
      if (data.data) {
        setTitle(data.data.title || "");
        setContent(data.data.content || "");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load page content" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPage) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedPage, title, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setMessage({ type: "success", text: "Page saved successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedPage) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold">Static Pages</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Edit the content for About, Privacy, and Terms pages. Content supports Markdown formatting.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PAGES.map((page) => (
            <button
              key={page.slug}
              onClick={() => setSelectedPage(page.slug)}
              className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-700 group-hover:scale-110 dark:bg-purple-900/40 dark:text-purple-200">
                  <FileText className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold">{page.label}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{page.description}</p>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Edit →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentPage = PAGES.find((p) => p.slug === selectedPage);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedPage(null)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pages
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Editing</p>
        <h1 className="text-3xl font-semibold">{currentPage?.label}</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Edit the content below. Markdown formatting is supported.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <span>Page Title</span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page Title"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <span>Content (Markdown supported)</span>
              <textarea
                className="min-h-[400px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content here using Markdown..."
              />
              <span className="text-xs text-slate-500">
                Supports headings (#, ##), bold (**text**), italic (*text*), lists (-, 1.), links ([text](url)), and more.
              </span>
            </label>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message.text}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Page"}
            </button>

            <Link
              href={selectedPage === "about" ? "/about" : `/policies/${selectedPage}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Preview page →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
