export type ArticleAuthor = {
  id: string;
  name: string;
  affiliation?: string | null;
};

export type ArticleReference = {
  label: string;
  citation_text: string;
  url?: string | null;
};

export type ArticleImage = {
  url: string;
  alt: string;
  caption?: string | null;
  type: "cover" | "inline";
};

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category?: string | null;
  tags?: string[];
  reading_time_minutes: number;
  published_at: string | null;
  cover_image_url?: string | null;
  author?: ArticleAuthor | null;
  status?: "draft" | "draft_ai" | "published" | "archived";
};

export type ArticleDetail = ArticleSummary & {
  body_markdown: string;
  references?: ArticleReference[];
  images?: ArticleImage[];
  like_count?: number;
  dislike_count?: number;
};
