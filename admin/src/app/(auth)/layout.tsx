// The sidebar is rendered by LayoutShell in the root layout.
// This route group layout is a simple passthrough for grouping auth-required pages.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
