import { env } from "@/lib/env";

export type SubscriptionPlan = "FREE" | "PREMIUM" | null | undefined;

export const adsenseClient = env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function shouldShowAds(plan: SubscriptionPlan) {
  if (env.adsDisabled) return false;
  if (!adsenseClient) return false;
  return !plan || plan === "FREE";
}
