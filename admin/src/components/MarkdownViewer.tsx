"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/**
 * Consultant-docs-friendly markdown renderer. Rewrites `./foo.md` links into
 * `/docs/foo` so cross-guide linking works naturally, and applies our
 * standard Tailwind typography.
 */
export default function MarkdownViewer({ content }: { content: string }) {
  const components: Components = {
    a({ href, children }) {
      if (!href) return <>{children}</>;
      if (href.match(/^https?:\/\//) || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {children}
          </a>
        );
      }
      const rewritten = href
        .replace(/^\.\//, "")
        .replace(/\.md$/, "")
        .replace(/^README$/, "");
      const docsHref = rewritten ? `/docs/${rewritten}` : "/docs";
      return (
        <Link href={docsHref} className="text-blue-600 hover:underline">
          {children}
        </Link>
      );
    },
    h1: ({ children }) => <h1 className="text-3xl font-semibold text-gray-900 mt-0 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">{children}</h4>,
    p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed my-3">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 text-sm text-gray-700 my-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 text-sm text-gray-700 my-3 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    hr: () => <hr className="my-8 border-gray-200" />,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-300 bg-blue-50 px-4 py-2 my-3 text-sm text-gray-700 italic">
        {children}
      </blockquote>
    ),
    code({ children, className }) {
      const isBlock = className?.startsWith("language-");
      if (isBlock) {
        return (
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 my-3 text-xs leading-relaxed overflow-x-auto">
            <code className={className}>{children}</code>
          </pre>
        );
      }
      return <code className="bg-gray-100 text-gray-900 rounded px-1.5 py-0.5 text-[0.85em]">{children}</code>;
    },
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
    th: ({ children }) => (
      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600">{children}</th>
    ),
    td: ({ children }) => <td className="border border-gray-200 px-3 py-2 text-gray-700 align-top">{children}</td>,
    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  };

  return (
    <div className="max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
