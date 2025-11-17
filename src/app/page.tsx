import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Home() {
  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'BSD n8n AI Dev Studio',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: '자연어로 요청하면 AI가 실행 가능한 n8n 워크플로우를 자동 생성합니다. OpenAI, Gemini, Claude, xAI, DeepSeek 지원.',
    featureList: [
      '5개 AI 제공업체 지원 (OpenAI, Gemini, Claude, xAI, DeepSeek)',
      '자연어로 워크플로우 생성',
      'n8n 자동 배포',
      '워크플로우 수정 요청',
      '실시간 미리보기'
    ],
    screenshot: 'https://bsd-n8n-ai-studio.vercel.app/og-image.jpg',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <ChatInterface />
      </main>
    </>
  );
}
