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
    <div className="flex items-center gap-1 border border-border px-1 py-0.5">
      <button
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition",
          active === "like"
            ? "bg-foreground text-background"
            : "hover:bg-foreground/5"
        )}
        disabled={pending}
        onClick={() => submit(1)}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        {likes}
      </button>
      <button
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition",
          active === "dislike"
            ? "bg-foreground text-background"
            : "hover:bg-foreground/5"
        )}
        disabled={pending}
        onClick={() => submit(-1)}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        {dislikes}
      </button>
    </div>
  );
}
