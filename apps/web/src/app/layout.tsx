import type { Metadata } from "next";
import { Boldonse, Cairo, Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
// Next has no fallback metrics for Boldonse, so skip the size-adjusted fallback.
const boldonse = Boldonse({ variable: "--font-boldonse", weight: "400", subsets: ["latin"], adjustFontFallback: false });
const cairo = Cairo({ variable: "--font-cairo", weight: "600", subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "YM Sisters Annual Leadership Form",
  description: "Share your YM Sisters leadership information for the year.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${boldonse.variable} ${cairo.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
