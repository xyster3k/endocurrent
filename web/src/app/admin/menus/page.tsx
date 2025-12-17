"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ShieldCheck, Sparkles } from "lucide-react";

type Menu = { id: string; name: string };
type MenuItem = {
  id: string;
  menu_id: string;
  label: string;
  url: string;
  category?: string | null;
  parent_id?: string | null;
  order_index?: number | null;
};

const itemSchema = z.object({
  menu_id: z.string(),
  label: z.string().min(1),
  url: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  parent_id: z.string().nullable().optional(),
  order_index: z.number().int().nullable().optional(),
});

export default function AdminMenus() {
  return (
    <>
      <SignedIn>
        <ClientMenuManager />
      </SignedIn>
      <SignedOut>
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-12">
          <h1 className="text-3xl font-semibold">Admin</h1>
          <p className="text-slate-600 dark:text-slate-300">You’re not signed in. Please sign in to continue.</p>
          <SignInButton mode="modal">
            <button className="btn-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
              <Sparkles className="h-4 w-4" />
              Go to sign in
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
}

function ClientMenuManager() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [form, setForm] = useState<Partial<MenuItem>>({});

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/menus");
      const json = await res.json();
      if (json?.data) {
        setMenus(json.data.menus || []);
        setItems(json.data.items || []);
        if (!selectedMenuId && json.data.menus?.length) {
          setSelectedMenuId(json.data.menus[0].id);
        }
      } else if (json?.error) {
        setError(json.error);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const tree = useMemo(() => {
    const filtered = items.filter((i) => i.menu_id === selectedMenuId);
    const byParent: Record<string, MenuItem[]> = {};
    filtered.forEach((i) => {
      const p = i.parent_id ?? "root";
      byParent[p] = byParent[p] ?? [];
      byParent[p].push(i);
    });
    Object.values(byParent).forEach((arr) => arr.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)));
    return byParent;
  }, [items, selectedMenuId]);

  const createMenu = async () => {
    if (!newMenuName.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMenuName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error || "Failed to create menu");
    } else {
      setNewMenuName("");
      await refresh();
    }
    setLoading(false);
  };

  const submitItem = async () => {
    const parsed = itemSchema.safeParse({ ...form, menu_id: selectedMenuId, order_index: form.order_index ?? null });
    if (!parsed.success) {
      setError("Invalid fields");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/menus/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = await res.json();
    if (!res.ok) setError(json?.error || "Failed to add item");
    else {
      setForm({});
      await refresh();
    }
    setLoading(false);
  };

  const renderBranch = (parent: string, depth: number): React.ReactNode[] => {
    if (depth > 10) return [];
    return (tree[parent] ?? []).map((node) => (
      <div key={node.id} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
        <div className="flex items-center justify-between py-1.5 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className={node.url ? "font-medium text-slate-700 dark:text-slate-200" : "font-bold text-slate-900 dark:text-slate-100"}>
              {node.label}
              {!node.url && <span className="ml-2 text-xs font-normal text-slate-500">(header only)</span>}
            </span>
            {node.url && <span className="text-xs text-slate-500">{node.url}</span>}
          </div>
          {node.category ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {node.category}
            </span>
          ) : null}
        </div>
        {renderBranch(node.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin / Menus</p>
          <h1 className="text-3xl font-semibold">Menu management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Create menus and nested items (up to 10 levels). Items can link to categories, internal pages, or external
            URLs.
          </p>
        </div>
        <Link href="/admin" className="nav-link">
          ← Back
        </Link>
      </div>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Step 1: Create or Select a Menu</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {menus.length === 0
                ? "Start by creating your first menu (e.g., 'Main Navigation' or 'Footer Menu')"
                : "Select an existing menu or create a new one"}
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
              Loading...
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {menus.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Select existing menu
              </label>
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <option value="">Choose a menu...</option>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Or create new menu
            </label>
            <div className="flex gap-2">
              <input
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createMenu()}
                placeholder="e.g., Main Navigation"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <button
                onClick={createMenu}
                disabled={loading || !newMenuName.trim()}
                className="btn-primary rounded-full px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedMenuId ? (
        <>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20">
            ✓ Menu selected: <strong>{menus.find(m => m.id === selectedMenuId)?.name}</strong>. Now add menu items below.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div>
                <h3 className="text-lg font-semibold">Step 2: Add Menu Items</h3>
                <p className="mt-1 text-xs text-slate-500">Create nested menu sections up to 10 levels deep. Items can be headers (no link) or have links to pages.</p>
              </div>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Label *</label>
                  <input
                    placeholder="e.g., Clinical Topics, Thyroid, Latest Research"
                    value={form.label ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">URL (optional - leave empty for header-only sections)</label>
                  <input
                    placeholder="/category/thyroid or /about or https://external.com"
                    value={form.url ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Examples: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/category/diabetes</code>, <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/about</code>, or external URL
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Category tag (optional - for display purposes)</label>
                  <input
                    placeholder="e.g., diabetes, thyroid, oncology"
                    value={form.category ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Order (optional - lower numbers appear first)</label>
                  <input
                    type="number"
                    placeholder="0, 1, 2..."
                    value={form.order_index ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        order_index: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Parent item (for nesting up to 10 levels)</label>
                  <select
                    value={form.parent_id ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value || null }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    <option value="">None (top level)</option>
                    {items
                      .filter((i) => i.menu_id === selectedMenuId)
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label}
                        </option>
                      ))}
                  </select>
                </div>
                <button onClick={submitItem} disabled={loading} className="btn-primary rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
                  Add item
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h3 className="text-lg font-semibold">Step 3: Preview Menu Structure</h3>
              {tree["root"] && tree["root"].length > 0 ? (
                <div className="space-y-2">{renderBranch("root", 1)}</div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                  No menu items yet. Add your first item using the form on the left.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            👆 Step 1: Create or select a menu above to continue
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
            Once you have a menu, you'll be able to add nested menu items with links to categories, pages, or external URLs.
          </p>
        </div>
      )}
    </div>
  );
}
