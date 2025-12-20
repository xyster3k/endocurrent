import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPageContent } from "@/lib/data/pages";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("about");
  return {
    title: page.title,
    description: page.content.slice(0, 160).replace(/[#*_]/g, ""),
    openGraph: {
      title: page.title,
      description: page.content.slice(0, 160).replace(/[#*_]/g, ""),
    },
  };
}

export default async function AboutPage() {
  const page = await getPageContent("about");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">{page.title}</h1>
      <div className="mt-6 prose prose-slate max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
      </div>
    </div>
  );
}
