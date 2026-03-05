import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reels Creator — Make Stunning Short Videos",
  description: "Create, edit, and download short videos with filters, music, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
