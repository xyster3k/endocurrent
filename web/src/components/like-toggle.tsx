"use client";

import { useState, useTransition } from "react";
import { HandThumbDown, HandThumbUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  articleId: string;
  initialLikeCount?: number;
  initialDislikeCount?: number;
};

export function LikeToggle({
  articleId,
  initialLikeCount = 0,
  initialDislikeCount = 0,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [likes, setLikes] = useState(initialLikeCount);
  const [dislikes, setDislikes] = useState(initialDislikeCount);
  const [active, setActive] = useState<"like" | "dislike" | null>(null);

  const submit = (value: 1 | -1) => {
    startTransition(async () => {
      setActive(value === 1 ? "like" : "dislike");
      setLikes((prev) => (value === 1 ? prev + 1 : prev));
      setDislikes((prev) => (value === -1 ? prev + 1 : prev));
      try {
        await fetch(`/api/articles/${articleId}/like`, {
          method: "POST",
          body: JSON.stringify({ value }),
        });
      } catch (error) {
        console.error("Failed to send like", error);
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
        <HandThumbUp className="h-4 w-4" />
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
        <HandThumbDown className="h-4 w-4" />
        {dislikes}
      </button>
    </div>
  );
}
