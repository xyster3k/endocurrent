"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Download, Trash2, Loader2 } from "lucide-react";

type Props = {
  action: "export" | "delete";
};

export function AccountActions({ action }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();
  const { signOut } = useClerk();

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/export");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_MY_ACCOUNT" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Deletion failed");
      }
      // Sign out and redirect to home
      await signOut();
      router.push("/?deleted=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed");
      setLoading(false);
    }
  };

  if (action === "export") {
    return (
      <div className="mt-4">
        <button
          onClick={handleExport}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download My Data
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (!showConfirm) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete My Account
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        Type DELETE to confirm permanent account deletion:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
      />
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading || confirmText !== "DELETE"}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Confirm Delete
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            setConfirmText("");
            setError(null);
          }}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
