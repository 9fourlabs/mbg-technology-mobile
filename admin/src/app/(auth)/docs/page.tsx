import { readIndex } from "@/lib/docs";
import MarkdownViewer from "@/components/MarkdownViewer";

export const metadata = { title: "Consultant Guide — MBG Admin" };

export default async function DocsIndexPage() {
  const content = await readIndex();
  return <MarkdownViewer content={content} />;
}
