import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BSD n8n AI Dev Studio - AI가 자동으로 n8n 워크플로우 생성",
    template: "%s | BSD n8n AI Dev Studio"
  },
  description: "자연어로 요청하면 AI가 실행 가능한 n8n 워크플로우를 자동 생성합니다. OpenAI, Gemini, Claude, xAI, DeepSeek 지원. 복잡한 워크플로우도 몇 초 만에 완성!",
  keywords: [
    "n8n",
    "워크플로우 자동화",
    "AI 워크플로우",
    "노코드",
    "자동화 도구",
    "n8n AI",
    "워크플로우 생성기",
    "OpenAI",
    "Claude",
    "Gemini",
    "automation",
    "workflow automation",
    "no-code",
    "low-code"
  ],
  authors: [{ name: "BSD Projects" }],
  creator: "BSD Projects",
  publisher: "BSD Projects",
  applicationName: "BSD n8n AI Dev Studio",
  category: "productivity",
  classification: "Business Automation Tool",

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://bsd-n8n-ai-studio.vercel.app",
    siteName: "BSD n8n AI Dev Studio",
    title: "BSD n8n AI Dev Studio - AI가 자동으로 n8n 워크플로우 생성",
    description: "자연어로 요청하면 AI가 실행 가능한 n8n 워크플로우를 자동 생성합니다. 복잡한 워크플로우도 몇 초 만에 완성!",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BSD n8n AI Dev Studio - AI 워크플로우 자동 생성",
        type: "image/jpeg"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: "BSD n8n AI Dev Studio - AI가 자동으로 n8n 워크플로우 생성",
    description: "자연어로 요청하면 AI가 실행 가능한 n8n 워크플로우를 자동 생성합니다.",
    images: ["/og-image.jpg"],
    creator: "@bsd_projects"
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
    google: "google-site-verification-code-here",
  },

  alternates: {
    canonical: "https://bsd-n8n-ai-studio.vercel.app"
  },

  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
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
