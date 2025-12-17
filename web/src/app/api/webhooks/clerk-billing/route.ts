import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export async function POST(req: NextRequest) {
  // In production, validate signature with Svix + CLERK_WEBHOOK_SECRET.
  const raw = await req.text();
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event?.data || {};
  const userId = data.user_id || data.id || data.external_user_id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; webhook logged." });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const subs = (supabase as any).from("user_subscriptions");
  const { error } = await subs.upsert(
    {
      user_id: userId,
      plan: data.plan || "PREMIUM",
      status: data.status || "active",
      billing_provider: "clerk_stripe",
      external_customer_id: data.customer_id || data.external_customer_id || null,
      external_subscription_id: data.subscription_id || null,
      current_period_end: data.current_period_end || null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
