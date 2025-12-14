export const runtime = "edge";

export default function HealthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow">
        <h1 className="text-xl font-semibold">Health check</h1>
        <p className="text-slate-600">If you see this, the app router rendered correctly.</p>
      </div>
    </div>
  );
}
