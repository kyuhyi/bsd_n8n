import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BSD n8n AI Dev Studio",
  description: "AI가 n8n 워크플로우를 대신 만들어드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
