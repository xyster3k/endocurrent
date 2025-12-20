import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth";
import { getPageContent, updatePageContent } from "@/lib/data/pages";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const content = await getPageContent(slug);
    return NextResponse.json({ data: content });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch page content" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    requireRole(user, ["editor", "admin"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { slug, title, content } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "Slug and title are required" }, { status: 400 });
    }

    const result = await updatePageContent(slug, { title, content: content || "" });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update page content" }, { status: 500 });
  }
}
