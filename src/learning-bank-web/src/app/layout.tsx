import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning Bank",
  description: "A safe banking experience for children",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#e8ebe6] text-[#0e0f0c] antialiased">
        {children}
      </body>
    </html>
  );
}
