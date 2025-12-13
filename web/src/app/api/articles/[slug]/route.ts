import { NextResponse, type NextRequest } from "next/server";
import { getArticleBySlug } from "@/lib/data/articles";

export const runtime = "edge";

type Params = Promise<{ slug: string }>;

export async function GET(_req: NextRequest, props: { params: Params }) {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(article);
}
