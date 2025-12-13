import React from "react";
import { getSessionUser, requireRole } from "@/lib/auth";

export default async function NewArticlePage() {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">Create article</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Markdown body with live preview is recommended. Images go to Supabase Storage;
          references stay structured for downstream rendering.
        </p>
      </div>

      <form
        method="post"
        action="/api/admin/articles"
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
            <input
              name="category"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="thyroid / diabetes / oncology / general"
            />
          </Field>
          <Field label="Tags (comma separated)">
            <input
              name="tags"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="thyroid, diabetes"
            />
          </Field>
        </div>
        <Field label="Summary">
          <textarea
            name="summary"
            required
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder="One or two sentences that appear in the feed."
          />
        </Field>
        <Field label="Body (Markdown)">
          <textarea
            name="body_markdown"
            required
            rows={10}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder="## Section title"
          />
        </Field>
        <Field label="References JSON">
          <textarea
            name="references"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder='[{"label":"[1]","citation_text":"Title / Journal / Year","url":"https://doi.org/..."}]'
          />
        </Field>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          Save draft
        </button>
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
