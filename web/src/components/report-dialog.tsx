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
      <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
        Thanks for flagging this article.
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-100 dark:hover:bg-rose-950"
      >
        <Flag className="h-4 w-4" />
        Report
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-sm font-semibold">Report article</h4>
          <div className="mt-3 space-y-2 text-sm">
            {reasons.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2",
                  reason === r.value
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400/60 dark:bg-blue-900/30"
                    : "border-slate-200 dark:border-slate-800"
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900/60"
              rows={3}
            />
            <button
              onClick={submit}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Submit
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
