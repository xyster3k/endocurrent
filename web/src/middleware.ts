import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};

export function middleware(req: Request) {
  const url = new URL(req.url);

  // Short-circuit health endpoints to avoid any app logic.
  if (url.pathname === "/health" || url.pathname === "/api/health") {
    const json = JSON.stringify(
      {
        ok: true,
        message: "middleware short-circuit",
        env: {
          clerkPublishablePrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 6) ?? null,
          clerkSecretPresent: Boolean(process.env.CLERK_SECRET_KEY),
          supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          supabaseAnonPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          adsensePresent: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
        },
      },
      null,
      2
    );
    return new NextResponse(json, {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  // Otherwise, pass through to Next.
  return NextResponse.next();
}
