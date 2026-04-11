import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import PrelineScript from "@/components/PrelineScript";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MBG Admin",
  description: "Multi-tenant mobile app administration panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-gray-50 text-gray-900 font-sans antialiased">
        <LayoutShell>{children}</LayoutShell>
        <PrelineScript />
      </body>
    </html>
  );
}
