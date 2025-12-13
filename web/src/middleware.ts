import { NextResponse } from "next/server";

// Temporarily disable Clerk middleware to prevent runtime 500s during setup.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};
