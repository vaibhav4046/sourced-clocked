import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sourced - Check any answer against your own sources",
  description:
    "Paste an answer and the documents it should come from. Sourced checks every claim against your sources, ranks the evidence, and shows where your sources disagree.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-ink text-zinc-200">{children}</body>
    </html>
  );
}
