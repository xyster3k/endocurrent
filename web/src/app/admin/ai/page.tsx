import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser, requireRole } from "@/lib/auth";

export default async function AiDraftPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  try {
    requireRole(user, ["editor", "admin"]);
  } catch {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-12">
        <h1 className="text-3xl font-semibold">AI draft generation</h1>
        <p className="text-slate-600 dark:text-slate-300">
          You need an editor or admin role to access this tool. Current role: {user.role}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">AI draft generation</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Provide a topic, scope, and references. The server route will call your LLM endpoint, then store the returned
          JSON as an article with status
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">draft_ai</code>
          for human review.
        </p>
      </div>

      <form
        method="post"
        action="/api/admin/ai-generate-article"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
      >
        <Field label="Topic / working title">
          <input
            name="topic"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </Field>
        <Field label="Scope">
          <input
            name="scope"
            placeholder="e.g., 800-1200 words, weekly brief"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </Field>
        <Field label="Sources (newline separated URLs/DOIs)">
          <textarea
            name="sources"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </Field>
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          Submit to LLM
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
