"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";

function DisplayNameForm() {
  const { user, profile, loading } = useAuth();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && profile?.display_name) {
      setName(profile.display_name);
    }
  }, [loading, profile]);

  const save = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Failed to save: ${data.error || res.statusText}`);
        return;
      }
      setMessage("Saved successfully!");
    } catch (error) {
      setMessage(`Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentDisplayName = profile?.display_name;
  const userEmail = user?.email;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      {currentDisplayName && (
        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Current display name: <span className="font-semibold">{currentDisplayName}</span>
          </p>
        </div>
      )}
      {!currentDisplayName && userEmail && (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No display name set. Articles will show: <span className="font-semibold">{userEmail.split("@")[0]}</span>
          </p>
        </div>
      )}
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        <span>Display name</span>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dr. Amara Chen"
          disabled={loading}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isLoading || loading || !name.trim()}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
        {message ? (
          <span className={`text-sm ${message.includes("Failed") || message.includes("Error") ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
            {message}
          </span>
        ) : null}
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
