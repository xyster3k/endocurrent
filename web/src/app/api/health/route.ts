import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const clerkPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    return NextResponse.json({
      ok: true,
      clerkPublishableSet: Boolean(clerkPub && clerkPub.startsWith("pk_")),
      clerkSecretSet: Boolean(clerkSecret),
      adsenseSet: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
      supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error), stack: (error as Error).stack },
      { status: 500 }
    );
  }
}
