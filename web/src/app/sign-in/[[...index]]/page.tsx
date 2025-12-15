"use client";

import { useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

export const runtime = "edge";

export default function SignInPage() {
  const search = useSearchParams();
  const redirectUrl = search?.get("redirect_url") || "/admin";
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <SignIn redirectUrl={redirectUrl} signUpUrl="/sign-up" />
    </div>
  );
}
