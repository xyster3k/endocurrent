import type { ArticleDetail, ArticleSummary } from "@/lib/types";

const baseArticles: ArticleDetail[] = [
  {
    id: "1",
    slug: "weekly-endocrine-digest",
    title: "Weekly Endocrine Digest",
    summary:
      "Key updates in thyroid nodule risk stratification, GLP-1 real-world safety, and adrenal imaging.",
    body_markdown: `
## Thyroid
Recent multi-center data show improved specificity when combining ultrasound TI-RADS with molecular testing.

## Metabolism
Observational cohorts continue to support semaglutide safety, but signal monitoring for pancreatitis persists.

## Adrenal
Dual-phase CT remains first-line, with MRI chemical shift as an alternative where contrast is limited.
`,
    category: "endocrinology",
    tags: ["thyroid", "diabetes", "adrenal"],
    reading_time_minutes: 6,
    word_count: 980,
    published_at: new Date().toISOString(),
    cover_image_url:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
    author: {
      id: "author-1",
      name: "Dr. Amara Chen",
      affiliation: "St. Helena Endocrine Center",
    },
    references: [
      {
        label: "[1]",
        citation_text: "Smith et al. Thyroid. 2023;33(4):212-219.",
        url: "https://doi.org/10.1089/thy.2023.0001",
      },
    ],
    images: [],
    like_count: 24,
    dislike_count: 2,
  },
  {
    id: "2",
    slug: "ai-draft-thyroid-guidance",
    title: "AI Draft: Thyroid Nodule Follow-up Guidance",
    summary:
      "LLM-generated draft summarizing ATA follow-up intervals, pending editorial review.",
    body_markdown: `
### Draft status
This is an AI-generated draft. Editorial review required before publishing.
`,
    status: "draft_ai",
    category: "thyroid",
    tags: ["thyroid"],
    reading_time_minutes: 3,
    word_count: 520,
    published_at: null,
    cover_image_url: null,
    author: null,
    references: [],
    images: [],
    like_count: 0,
    dislike_count: 0,
  },
  {
    id: "3",
    slug: "glp1-insights",
    title: "GLP-1 Safety Insights",
    summary:
      "Registry data on pancreatitis and gallbladder events in long-term GLP-1 RA use.",
    body_markdown: `
## Safety profile
Event rates remain low and comparable to background risk when stratified by metabolic syndrome.
`,
    category: "diabetes",
    tags: ["diabetes", "glp-1"],
    reading_time_minutes: 4,
    word_count: 680,
    published_at: new Date().toISOString(),
    cover_image_url:
      "https://images.unsplash.com/photo-1582719478248-54e9f2b1e0a9?auto=format&fit=crop&w=1200&q=80",
    author: {
      id: "author-2",
      name: "Prof. Luca Martins",
      affiliation: "Lisbon Metabolic Institute",
    },
    references: [],
    images: [],
    like_count: 14,
    dislike_count: 1,
  },
];

export const mockArticles: ArticleDetail[] = baseArticles;

export function mapToSummary(a: ArticleDetail): ArticleSummary {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    category: a.category,
    tags: a.tags,
    reading_time_minutes: a.reading_time_minutes,
    published_at: a.published_at,
    cover_image_url: a.cover_image_url,
    author: a.author,
  };
}
