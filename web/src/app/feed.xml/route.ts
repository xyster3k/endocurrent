import { getArticles } from "@/lib/data/articles";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nexusmednews.com";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { data: articles } = await getArticles({ pageSize: 50 });

  const itemsXml = articles
    .map(
      (article) => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${BASE_URL}/articles/${article.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/articles/${article.slug}</guid>
      <description>${escapeXml(article.summary)}</description>
      <pubDate>${new Date(article.published_at || Date.now()).toUTCString()}</pubDate>
      ${article.category ? `<category>${escapeXml(article.category)}</category>` : ""}
      ${article.author?.name ? `<author>noreply@nexusmednews.com (${escapeXml(article.author.name)})</author>` : ""}
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nexus Med News</title>
    <link>${BASE_URL}</link>
    <description>Stay current with medical news, peer-reviewed research summaries, and expert insights. Your trusted source for healthcare updates.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/logo.png</url>
      <title>Nexus Med News</title>
      <link>${BASE_URL}</link>
    </image>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
