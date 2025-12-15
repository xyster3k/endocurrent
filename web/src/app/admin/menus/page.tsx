"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ShieldCheck, Sparkles } from "lucide-react";

export const runtime = "edge";
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
  url: z.string().min(1),
  category: z.string().optional(),
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
      <div key={node.id} className="border-l border-slate-200 pl-3">
        <div className="flex items-center justify-between py-1 text-sm text-slate-700 dark:text-slate-200">
          <div className="flex flex-col">
            <span className="font-medium">{node.label}</span>
            <span className="text-xs text-slate-500">{node.url}</span>
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
        <h2 className="text-lg font-semibold">Menus</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <option value="">Select a menu</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            value={newMenuName}
            onChange={(e) => setNewMenuName(e.target.value)}
            placeholder="New menu name"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
          />
          <button onClick={createMenu} disabled={loading} className="btn-primary rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
            Create menu
          </button>
        </div>
      </div>

      {selectedMenuId ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="text-lg font-semibold">Add item</h3>
            <div className="grid gap-2">
              <input
                placeholder="Label"
                value={form.label ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <input
                placeholder="URL (e.g., /category/thyroid or https://...)"
                value={form.url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <input
                placeholder="Category (optional)"
                value={form.category ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <input
                placeholder="Order (optional number)"
                value={form.order_index ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    order_index: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
              />
              <label className="text-sm text-slate-600 dark:text-slate-300">Parent item (for nesting up to 10 levels)</label>
              <select
                value={form.parent_id ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value || null }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/70"
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
              <button onClick={submitItem} disabled={loading} className="btn-primary rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
                Add item
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="text-lg font-semibold">Preview tree</h3>
            <div className="space-y-2">{renderBranch("root", 1)}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
          Select or create a menu to start adding items.
        </div>
      )}
    </div>
  );
}
