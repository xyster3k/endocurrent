"use client";

import { useEffect } from "react";
import { adsenseClient } from "@/lib/ads";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  slotId: string;
  show: boolean;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slotId, show, className }: AdSlotProps) {
  useEffect(() => {
    if (!show || !adsenseClient) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn("AdSense push failed", err);
    }
  }, [show]);

  if (!show || !adsenseClient) {
    return null;
  }

  return (
    <ins
      className={cn(
        "adsbygoogle block min-h-24 w-full overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center text-xs uppercase tracking-[0.2em] text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-600",
        className
      )}
      style={{ display: "block" }}
      data-ad-client={adsenseClient}
      data-ad-slot={slotId}
      data-ad-format="fluid"
      data-full-width-responsive="true"
    />
  );
}
