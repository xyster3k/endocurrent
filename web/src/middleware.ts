import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasClerkEnv =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
  Boolean(process.env.CLERK_SECRET_KEY);

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

const noopMiddleware = () => NextResponse.next();

function buildMiddleware() {
  if (!hasClerkEnv) return noopMiddleware;

  const wrapped = clerkMiddleware((auth, req) => {
    if (isProtectedRoute(req)) {
      auth().protect();
    }
  });

  return (req: NextRequest) => {
    try {
      return wrapped(req);
    } catch (err) {
      console.error("Middleware error (falling through):", err);
      return NextResponse.next();
    }
  };
}

export default buildMiddleware();

export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};
