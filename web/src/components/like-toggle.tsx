"use client";

import { useState, useTransition, useEffect } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  articleId: string;
  initialLikeCount?: number;
  initialDislikeCount?: number;
  userLikeValue?: number | null;
};

export function LikeToggle({
  articleId,
  initialLikeCount = 0,
  initialDislikeCount = 0,
  userLikeValue = null,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [likes, setLikes] = useState(initialLikeCount);
  const [dislikes, setDislikes] = useState(initialDislikeCount);
  const [active, setActive] = useState<"like" | "dislike" | null>(
    userLikeValue === 1 ? "like" : userLikeValue === -1 ? "dislike" : null
  );

  const submit = (value: 1 | -1) => {
    if (active) return; // Already liked/disliked - prevent duplicate clicks

    startTransition(async () => {
      const newActive = value === 1 ? "like" : "dislike";
      setActive(newActive);
      setLikes((prev) => (value === 1 ? prev + 1 : prev));
      setDislikes((prev) => (value === -1 ? prev + 1 : prev));
      try {
        await fetch(`/api/articles/${articleId}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value }),
        });
      } catch (error) {
        console.error("Failed to send like", error);
        // Revert on error
        setActive(null);
        setLikes((prev) => (value === 1 ? prev - 1 : prev));
        setDislikes((prev) => (value === -1 ? prev - 1 : prev));
      }
    });
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <button
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-1 text-sm transition",
          active === "like"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        disabled={pending}
        onClick={() => submit(1)}
      >
        <ThumbsUp className="h-4 w-4" />
        {likes}
      </button>
      <button
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-1 text-sm transition",
          active === "dislike"
            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        disabled={pending}
        onClick={() => submit(-1)}
      >
        <ThumbsDown className="h-4 w-4" />
        {dislikes}
      </button>
    </div>
  );
}
