"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  placeholder?: string;
  defaultValue?: string;
};

export function SearchBar({ className, placeholder = "Search articles...", defaultValue = "" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsExpanded(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleExpand();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Collapsed state - just icon */}
      {!isExpanded && (
        <button
          onClick={handleExpand}
          className="flex items-center gap-2 border border-border bg-card px-3 py-2 font-mono text-xs uppercase tracking-wider text-foreground/50 transition hover:border-foreground/30 hover:text-foreground/70"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden border border-border px-1.5 py-0.5 text-[0.65rem] font-medium text-foreground/40 sm:inline">
            ⌘K
          </kbd>
        </button>
      )}

      {/* Expanded state - search input */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />

          {/* Search form */}
          <form
            onSubmit={handleSubmit}
            className="fixed left-1/2 top-24 z-50 w-full max-w-xl -translate-x-1/2 px-4 sm:px-0"
          >
            <div className="relative overflow-hidden border border-border bg-card shadow-xl">
              <div className="flex items-center gap-3 px-4 py-3">
                <Search className="h-5 w-5 flex-shrink-0 text-foreground/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-lg outline-none placeholder:text-foreground/30 text-foreground"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="border border-border px-2 py-1 font-mono text-xs font-medium text-foreground/50 hover:bg-foreground/5"
                >
                  ESC
                </button>
              </div>
              <div className="border-t border-border bg-background px-4 py-2 text-xs text-foreground/50">
                Press <kbd className="border border-border px-1 py-0.5 font-mono text-foreground/40">Enter</kbd> to search
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
