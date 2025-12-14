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
  try {
    return clerkMiddleware((auth, request) => {
      if (isProtectedRoute(request)) {
        auth().protect();
      }
    })(req);
  } catch {
    return NextResponse.next();
  }
}
