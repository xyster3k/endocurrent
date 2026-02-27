import React from "react";
import Link from "next/link";
import {
  FileText,
  ImageIcon,
  LayoutTemplate,
  Settings,
  ShieldCheck,
  SquarePen,
  Table2,
  UserRound,
  Wand2,
} from "lucide-react";

import { getSessionUser, requireRole } from "@/lib/auth";
import { getArticles } from "@/lib/data/articles";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-12">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="text-slate-600 dark:text-slate-300">You’re not signed in. Please sign in to continue.</p>
        <Link
          href="/sign-in?redirect_url=/admin"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          Go to sign in
        </Link>
      </div>
    );
  }
  let roleOk = true;
  try {
    requireRole(user, ["editor", "admin"]);
  } catch {
    roleOk = false;
  }
  if (!roleOk) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-12">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="text-slate-600 dark:text-slate-300">
          You need an editor or admin role to access these tools. Current role: {user.role}.
        </p>
      </div>
    );
  }

  const { data } = await getArticles({ includeDrafts: true, pageSize: 100 });
  const drafts = data.filter((a) => a.status === "draft" || a.status === "draft_ai");
  const published = data.filter((a) => a.status === "published");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin / Editor</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">Editorial control</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            {user?.role ?? "subscriber"}
          </span>
        </div>
        <p className="max-w-3xl text-slate-600 dark:text-slate-300">
          Draft, publish, and monitor complaints. Supabase + RLS backs all actions; Supabase Auth governs
          authentication. AI drafts live in a separate queue until human review.
        </p>
        <div className="flex flex-wrap gap-3">
          <StatPill label="Published" value={published.length} />
          <StatPill label="Drafts" value={drafts.length} />
          <StatPill label="Total" value={data.length} />
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard
          icon={<SquarePen className="h-5 w-5" />}
          title="New article"
          body="WYSIWYG editor with markdown storage, tags, and formatting."
          href="/admin/articles/new"
        />
        <AdminCard
          icon={<Table2 className="h-5 w-5" />}
          title="Manage articles"
          body="Edit, publish/unpublish, and manage all articles."
          href="/admin/articles"
        />
        <AdminCard
          icon={<Wand2 className="h-5 w-5" />}
          title="AI drafts"
          body="Send a topic + sources to LLM, store as draft_ai for review."
          href="/admin/ai"
        />
        <AdminCard
          icon={<UserRound className="h-5 w-5" />}
          title="Profile display name"
          body="Set the display name used for published posts."
          href="/admin/profile"
        />
        <AdminCard
          icon={<LayoutTemplate className="h-5 w-5" />}
          title="Menu management"
          body="Build header menu tree and map categories or links."
          href="/admin/menus"
        />
        <AdminCard
          icon={<Settings className="h-5 w-5" />}
          title="Settings"
          body="Configure Google Analytics, Tag Manager, and site settings."
          href="/admin/settings"
        />
        <AdminCard
          icon={<ImageIcon className="h-5 w-5" />}
          title="Category backgrounds"
          body="Upload background images for homepage category sections."
          href="/admin/categories"
        />
        <AdminCard
          icon={<FileText className="h-5 w-5" />}
          title="Static pages"
          body="Edit About, Privacy, and Terms pages content."
          href="/admin/pages"
        />
      </div>
    </div>
  );
}

function AdminCard({
  icon,
  title,
  body,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/70"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 group-hover:scale-110 dark:bg-blue-900/40 dark:text-blue-200">
          {icon}
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{body}</p>
      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Open →</span>
    </Link>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800">
      {label}
      <span className="text-lg">{value}</span>
    </span>
  );
}

