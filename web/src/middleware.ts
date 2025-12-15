import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

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
