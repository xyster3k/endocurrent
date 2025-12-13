export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Privacy & Cookies</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        We do not collect patient-identifiable information. Authentication and billing
        run through Clerk/Stripe; storage and database are Supabase with Row-Level
        Security. Cookie consent is required where AdSense is active.
      </p>
    </div>
  );
}
