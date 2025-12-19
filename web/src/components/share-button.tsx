"use client";

type Props = {
  articleId: string;
};

export function ShareButton({ articleId }: Props) {
  const handleShare = async () => {
    const url = window.location.href;

    // Track the share
    try {
      await fetch(`/api/articles/${articleId}/share`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track share", error);
    }

    // Perform the share
    if (navigator.share) {
      await navigator.share({ url, title: document.title });
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <button
      onClick={handleShare}
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      Share
    </button>
  );
}
