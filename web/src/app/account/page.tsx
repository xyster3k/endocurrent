import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AccountActions } from "./account-actions";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account data and privacy settings",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/account");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Account Settings</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Manage your account data and privacy settings.
      </p>

      <div className="mt-8 space-y-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold">Account Information</h2>
          <dl className="mt-4 space-y-2">
            <div className="flex gap-2">
              <dt className="text-slate-500 dark:text-slate-400">Email:</dt>
              <dd className="font-medium">{user.email ?? "Not set"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500 dark:text-slate-400">User ID:</dt>
              <dd className="font-mono text-sm">{user.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500 dark:text-slate-400">Role:</dt>
              <dd className="capitalize">{user.role}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold">Your Data</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Under GDPR, you have the right to access all personal data we hold about you.
            Download a copy of your data in JSON format.
          </p>
          <AccountActions action="export" />
        </section>

        <section className="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Delete Account</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Permanently delete your account and all associated data. This action cannot be undone.
            Your authored articles will be anonymized but not deleted.
          </p>
          <AccountActions action="delete" />
        </section>
      </div>
    </div>
  );
}
