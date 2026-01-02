"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TagData = {
  tag: string;
  count: number;
};

// Color palette for tags - varies by frequency
const colorClasses = [
  "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60",
  "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60",
  "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60",
  "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60",
  "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/60",
  "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:hover:bg-cyan-900/60",
  "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:hover:bg-pink-900/60",
  "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60",
];

// Seeded random for consistent shuffling
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type Props = {
  className?: string;
  maxTags?: number;
};

export function TagCloud({ className, maxTags = 30 }: Props) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        setTags(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Process tags: shuffle chaotically and assign colors
  const processedTags = useMemo(() => {
    if (tags.length === 0) return [];

    // Take top tags and shuffle them for chaotic placement
    const topTags = tags.slice(0, maxTags);
    const shuffled = shuffleWithSeed(topTags, 42); // Use fixed seed for consistent server/client rendering

    // Find max count for relative sizing
    const maxCount = Math.max(...topTags.map((t) => t.count));
    const minCount = Math.min(...topTags.map((t) => t.count));

    return shuffled.map((tag, index) => {
      // Calculate size: base 100% + percentage based on frequency
      // More frequent tags are larger
      const countRange = maxCount - minCount || 1;
      const normalizedCount = (tag.count - minCount) / countRange;
      const sizePercent = 100 + normalizedCount * 40; // 100% to 140%

      // Assign color based on hash of tag name for consistency
      const colorIndex = tag.tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorClasses.length;

      return {
        ...tag,
        sizePercent,
        colorClass: colorClasses[colorIndex],
        // Add slight random rotation for organic feel (-3 to 3 degrees)
        rotation: (seededRandom(index * 7 + tag.tag.length) - 0.5) * 6,
      };
    });
  }, [tags, maxTags]);

  // Fixed widths for skeleton to avoid hydration mismatch
  const skeletonWidths = [72, 88, 64, 96, 80, 68, 92, 76];

  if (loading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="flex flex-wrap gap-2">
          {skeletonWidths.map((width, i) => (
            <div
              key={i}
              className="h-8 rounded-full bg-slate-200 dark:bg-slate-700"
              style={{ width: `${width}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (processedTags.length === 0) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {processedTags.map((tag) => (
          <Link
            key={tag.tag}
            href={`/tag/${encodeURIComponent(tag.tag)}`}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1.5 font-medium transition-all duration-200 hover:scale-105 hover:shadow-md",
              tag.colorClass
            )}
            style={{
              fontSize: `${tag.sizePercent}%`,
              transform: `rotate(${tag.rotation}deg)`,
            }}
            title={`${tag.count} article${tag.count !== 1 ? "s" : ""}`}
          >
            {tag.tag}
            <span className="ml-1.5 text-xs opacity-60">({tag.count})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
