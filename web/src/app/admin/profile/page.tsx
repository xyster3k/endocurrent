 "use client";
import React, { useState } from "react";

function DisplayNameForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name }),
    });
    if (!res.ok) {
      setMessage("Failed to save");
      return;
    }
    setMessage("Saved");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        <span>Display name</span>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dr. Amara Chen"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-black"
        >
          Save
        </button>
        {message ? <span className="text-sm text-slate-600 dark:text-slate-300">{message}</span> : null}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-slate-600 dark:text-slate-300">Set the display name shown on published posts.</p>
      </div>
      <DisplayNameForm />
    </div>
  );
}
