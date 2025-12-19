"use client";

import { useState, useEffect } from "react";
import { BarChart3, Tag, Save, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [measurementId, setMeasurementId] = useState("");
  const [gtmId, setGtmId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.ga_measurement_id) {
          setMeasurementId(data.data.ga_measurement_id);
        }
        if (data.data?.gtm_container_id) {
          setGtmId(data.data.gtm_container_id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: value.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await Promise.all([
        saveSetting("ga_measurement_id", measurementId),
        saveSetting("gtm_container_id", gtmId),
      ]);

      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-slate-600 dark:text-slate-300">Configure site-wide settings and integrations.</p>
      </div>

      <div className="space-y-6">
        {/* Google Tag Manager */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <Tag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Google Tag Manager</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage all your tags in one place (recommended)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Recommended:</strong> Use GTM to manage GA4 and other tracking tags. If you use GTM, you don&apos;t need to add GA4 separately below.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                To set up Google Tag Manager:
              </p>
              <ol className="mt-2 list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>Go to <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Google Tag Manager</a></li>
                <li>Create an account and container (Web)</li>
                <li>Copy your Container ID (starts with GTM-)</li>
                <li>Paste it below</li>
                <li>Inside GTM, add your GA4 tag and other tracking</li>
              </ol>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <span>Container ID</span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
                placeholder="GTM-XXXXXXX"
                disabled={isLoading}
              />
              <span className="text-xs text-slate-500">
                Leave empty to disable Google Tag Manager
              </span>
            </label>
          </div>
        </div>

        {/* Google Analytics 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Google Analytics 4</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Direct GA4 integration (skip if using GTM)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                To set up Google Analytics directly:
              </p>
              <ol className="mt-2 list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Google Analytics</a></li>
                <li>Create a new GA4 property (or use existing)</li>
                <li>Go to Admin → Data Streams → Web</li>
                <li>Copy your Measurement ID (starts with G-)</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <span>Measurement ID</span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={measurementId}
                onChange={(e) => setMeasurementId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                disabled={isLoading}
              />
              <span className="text-xs text-slate-500">
                Leave empty to disable direct Google Analytics (use GTM instead)
              </span>
            </label>
          </div>
        </div>

        {/* Save Button & Message */}
        <div className="space-y-4">
          {message && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
