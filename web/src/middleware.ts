import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasClerk =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
  Boolean(process.env.CLERK_SECRET_KEY);

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};

export default function middleware(req: NextRequest) {
  if (!hasClerk) {
    return NextResponse.next();
  }
  const handler = clerkMiddleware((auth, request) => {
    if (isProtectedRoute(request)) {
      const session = auth();
      // Newer Clerk supports protect(); fall back to manual redirect if unavailable.
      if (session && typeof (session as any).protect === "function") {
        return (session as any).protect();
      }
      if (!session?.userId) {
        const target = encodeURIComponent(request.url);
        return NextResponse.redirect(new URL(`/sign-in?redirect_url=${target}`, request.url));
      }
    }
  });
  try {
    return handler(req);
  } catch (error) {
    // If Clerk blows up, don’t take down the whole site; let the request through.
    return NextResponse.next();
  }
}
