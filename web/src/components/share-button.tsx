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
      className="border border-border px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
    >
      Share
    </button>
  );
}
