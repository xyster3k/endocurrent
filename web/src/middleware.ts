import { NextResponse, type NextRequest } from "next/server";

// Minimal no-op middleware to avoid runtime errors.
export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}
