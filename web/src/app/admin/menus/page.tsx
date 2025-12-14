 "use client";
import React, { useEffect, useState } from "react";

export const runtime = "edge";

type MenuItem = {
  id?: string;
  label: string;
  url: string;
  category?: string;
  parent_id?: string | null;
  order_index?: number | null;
};

export default function MenusPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">Menu management</h1>
        <p className="text-slate-600 dark:text-slate-300">Build a header menu tree and map categories/links.</p>
      </div>
      <MenuManager />
    </div>
  );
}

function MenuManager() {
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newMenuName, setNewMenuName] = useState("");
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/menus")
      .then((r) => r.json())
      .then((res) => {
        setMenus(res.data?.menus || []);
        setItems(res.data?.items || []);
        if (res.data?.menus?.[0]?.id) setSelectedMenu(res.data.menus[0].id);
      });
  }, []);

  const addMenu = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMenuName }),
    });
    if (!res.ok) {
      setMessage("Failed to create menu");
      return;
    }
    setMessage("Menu created");
  };

  const updateMenu = async () => {
    if (!selectedMenu) return;
    setMessage(null);
    const menuItems = items.filter((i) => i.parent_id === null || i.parent_id === undefined || i.parent_id === "");
    const res = await fetch(`/api/admin/menus/${selectedMenu}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
      }),
    });
    if (!res.ok) {
      setMessage("Failed to update menu");
      return;
    }
    setMessage("Menu updated");
  };

  const addItem = () => {
    if (!selectedMenu) return;
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        label: "New link",
        url: "/",
        parent_id: null,
      },
    ]);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Menu name"
          value={newMenuName}
          onChange={(e) => setNewMenuName(e.target.value)}
        />
        <button
          onClick={addMenu}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          Add menu
        </button>
        {menus.length > 0 ? (
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            value={selectedMenu ?? ""}
            onChange={(e) => setSelectedMenu(e.target.value)}
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Menu items</h3>
          <button
            onClick={addItem}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Add item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item.id ?? idx}
              className="grid gap-2 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70 md:grid-cols-5"
            >
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                value={item.label}
                onChange={(e) =>
                  setItems(items.map((it) => (it.id === item.id ? { ...it, label: e.target.value } : it)))
                }
                placeholder="Label"
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                value={item.url}
                onChange={(e) =>
                  setItems(items.map((it) => (it.id === item.id ? { ...it, url: e.target.value } : it)))
                }
                placeholder="/path"
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                value={item.category ?? ""}
                onChange={(e) =>
                  setItems(items.map((it) => (it.id === item.id ? { ...it, category: e.target.value } : it)))
                }
                placeholder="Category"
              />
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                value={item.parent_id ?? ""}
                onChange={(e) =>
                  setItems(
                    items.map((it) =>
                      it.id === item.id ? { ...it, parent_id: e.target.value || null } : it
                    )
                  )
                }
              >
                <option value="">Top level</option>
                {items
                  .filter((parent) => parent.id !== item.id)
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.label}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                value={item.order_index ?? 0}
                onChange={(e) =>
                  setItems(
                    items.map((it) =>
                      it.id === item.id ? { ...it, order_index: Number(e.target.value) } : it
                    )
                  )
                }
                placeholder="Order"
              />
            </div>
          ))}
        </div>
        <button
          onClick={updateMenu}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          Save menu
        </button>
        {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
      </div>
    </div>
  );
}
