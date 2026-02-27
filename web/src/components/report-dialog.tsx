"use client";

import { useState, useTransition } from "react";
import { Flag, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  articleId: string;
};

const reasons = [
  { value: "spam", label: "Spam" },
  { value: "incorrect", label: "Incorrect information" },
  { value: "offensive", label: "Offensive" },
  { value: "other", label: "Other" },
];

export function ReportDialog({ articleId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("incorrect");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      try {
        await fetch(`/api/articles/${articleId}/report`, {
          method: "POST",
          body: JSON.stringify({ reason_code: reason, comment }),
        });
        setSubmitted(true);
        setOpen(false);
      } catch (error) {
        console.error("Failed to send report", error);
      }
    });
  };

  if (submitted) {
    return (
      <div className="border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-foreground/60">
        Thanks for flagging this article.
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground"
      >
        <Flag className="h-4 w-4" />
        Report
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 border border-border bg-card p-4 shadow-xl">
          <h4 className="font-mono text-xs font-semibold uppercase tracking-wider">Report article</h4>
          <div className="mt-3 space-y-2 text-sm">
            {reasons.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 border px-3 py-2",
                  reason === r.value
                    ? "border-foreground bg-foreground/5"
                    : "border-border"
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment for editors"
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              rows={3}
            />
            <button
              onClick={submit}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-background transition hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Submit
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
