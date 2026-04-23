import Link from "next/link";
import { listGuides } from "@/lib/docs";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const guides = await listGuides();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-2">
            Consultant Guide
          </div>
          <nav className="space-y-0.5">
            {guides.map((g) => {
              const href = g.slug === "README" ? "/docs" : `/docs/${g.slug}`;
              return (
                <Link
                  key={g.slug}
                  href={href}
                  className="block text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md px-2 py-1.5 transition-colors"
                >
                  {g.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
