import { notFound } from "next/navigation";
import { readGuide, listGuides } from "@/lib/docs";
import MarkdownViewer from "@/components/MarkdownViewer";

export async function generateStaticParams() {
  const guides = await listGuides();
  return guides.filter((g) => g.slug !== "README").map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guides = await listGuides();
  const guide = guides.find((g) => g.slug === slug);
  return { title: guide ? `${guide.title} — MBG Admin` : "Consultant Guide — MBG Admin" };
}

export default async function DocsGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await readGuide(slug);
  if (!content) notFound();
  return <MarkdownViewer content={content} />;
}
