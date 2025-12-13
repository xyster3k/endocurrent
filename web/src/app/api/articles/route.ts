import { NextResponse, type NextRequest } from "next/server";
import { getArticles } from "@/lib/data/articles";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const tag = searchParams.get("tag") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const result = await getArticles({ page, pageSize, tag, category, search });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch articles", details: String(error) }, { status: 500 });
  }
}
