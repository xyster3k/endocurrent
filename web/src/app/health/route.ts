import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const pub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const sec = process.env.CLERK_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const ads = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

    return NextResponse.json(
      {
        ok: true,
        env: {
          clerkPublishablePrefix: pub ? pub.slice(0, 6) : null,
          clerkSecretPresent: Boolean(sec),
          supabaseUrlPresent: Boolean(supabaseUrl),
          supabaseAnonPresent: Boolean(supabaseAnon),
          adsensePresent: Boolean(ads),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}
