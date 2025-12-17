import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};

export default function middleware(req: NextRequest) {
  // Let Clerk inject session info, but don't block or redirect at the edge.
  try {
    return clerkMiddleware()(req);
  } catch {
    return NextResponse.next();
  }
}
