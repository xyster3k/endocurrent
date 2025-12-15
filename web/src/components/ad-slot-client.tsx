"use client";

import { useEffect, useState } from "react";
import { AdSlot } from "./ad-slot";

// Avoid SSR markup for AdSense; render only after mount.
export function AdSlotClient(props: { slotId: string; show: boolean; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AdSlot {...props} />;
}
