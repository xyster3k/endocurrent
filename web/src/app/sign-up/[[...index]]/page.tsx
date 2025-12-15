"use client";

import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

export const runtime = "edge";

export default function SignUpPage() {
  const search = useSearchParams();
  const redirectUrl = search?.get("redirect_url") || "/admin";
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <SignUp
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        signInUrl="/sign-in"
      />
    </div>
  );
}
