# BSD n8n AI Dev Studio

> AI가 n8n 위에 앉아서 대신 개발하는 시스템

초보자가 n8n을 몰라도 노드를 만들어내고 자동화를 실현시킬 수 있는 혁신적인 플랫폼입니다.

## 🎯 핵심 기능

### 1. AI Intent 분석 엔진
- 자연어 입력을 n8n 워크플로우 구조로 자동 변환
- 필요한 노드 자동 판단
- 데이터 흐름 파악 및 매핑

### 2. 워크플로우 JSON 자동 생성
- n8n 노드 템플릿 라이브러리
- 노드 간 연결 자동 생성
- 시각적 레이아웃 자동 배치

### 3. n8n API 연동
- Local/Cloud n8n 인스턴스 지원
- 워크플로우 자동 배포
- 실행 로그 자동 수집

### 4. AI Vision 기반 디버깅
- Playwright로 n8n 화면 실시간 모니터링
- AI Vision으로 오류 자동 감지
- 자동 수정 및 재테스트

### 5. 다크모드 UI
- 직관적인 챗봇 인터페이스
- 실시간 워크플로우 미리보기
- 템플릿 라이브러리

## 🚀 빠른 시작

### 1. 설치

\`\`\`bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# .env.local 파일을 열고 필수 값 입력:
# - OPENAI_API_KEY
# - N8N_INSTANCE_URL
# - N8N_API_KEY
\`\`\`

### 2. n8n 실행

로컬 n8n 인스턴스가 필요합니다:

\`\`\`bash
# Docker로 n8n 실행
docker run -it --rm \\
  --name n8n \\
  -p 5678:5678 \\
  -e N8N_API_KEY=your_api_key_here \\
  docker.n8n.io/n8nio/n8n

# 또는 npx로 실행
npx n8n
\`\`\`

### 3. 개발 서버 시작

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 📖 사용 방법

### 기본 사용

1. **자연어 입력**: 원하는 자동화를 자연어로 입력
   ```
   "스티비에 신규 구독자 들어오면 카톡으로 알려줘"
   ```

2. **AI 분석**: AI가 자동으로 의도 분석 및 워크플로우 생성

3. **미리보기 확인**: 생성된 워크플로우 구조 확인

4. **배포**: 원클릭으로 n8n에 자동 배포

5. **테스트**: AI가 자동으로 테스트 실행

6. **디버깅**: 오류 발생 시 AI가 자동으로 수정

### 예시 입력

\`\`\`
✅ "Gmail 신규 메일 오면 슬랙으로 전송"
✅ "쇼핑몰 주문 들어오면 구글 시트에 기록하고 카톡 알림"
✅ "매일 아침 9시에 어제 매출 슬랙으로 리포트"
✅ "인스타그램 신규 팔로워 → Notion에 자동 저장"
\`\`\`

## 🏗️ 아키텍처

\`\`\`
[유저 입력]
    ↓
[AI Intent 분석] (GPT-4)
    ↓
[워크플로우 JSON 생성]
    ↓
[n8n API 배포]
    ↓
[자동 테스트]
    ↓
  [실패] → [Playwright 화면 캡처]
    ↓         ↓
[성공]   [AI Vision 디버깅]
           ↓
       [자동 수정 → 재테스트]
\`\`\`

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Dark Mode)
- **State Management**: Zustand
- **API Client**: TanStack Query

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Next.js API Routes
- **AI**: OpenAI GPT-4, Anthropic Claude
- **Automation**: Playwright
- **Database**: PostgreSQL (planned)

### External Services
- **n8n**: Workflow automation platform
- **OpenAI**: AI intent analysis and debugging
- **Anthropic**: Alternative AI provider

## 📁 프로젝트 구조

\`\`\`
bsd-n8n-ai-studio/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API Routes
│   │   │   ├── analyze-intent/
│   │   │   ├── generate-workflow/
│   │   │   └── deploy-workflow/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── chat/           # Chat interface
│   │   ├── workflow/       # Workflow visualizer
│   │   └── debug/          # Debug dashboard
│   ├── services/           # Business logic
│   │   ├── ai-intent-analyzer.ts
│   │   ├── workflow-generator.ts
│   │   ├── n8n-api-client.ts
│   │   ├── ai-debugger.ts
│   │   └── playwright-service.ts
│   ├── types/              # TypeScript types
│   ├── lib/                # Utilities
│   └── hooks/              # React hooks
├── docs/                   # Documentation
│   └── PRD.md             # Product Requirements
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
\`\`\`

## 🎨 UI/UX 디자인

### 다크모드 컬러 팔레트

\`\`\`typescript
colors: {
  background: {
    primary: '#0A0A0A',    // 메인 배경
    secondary: '#141414',  // 카드 배경
    tertiary: '#1E1E1E',   // 호버 상태
  },
  text: {
    primary: '#FFFFFF',    // 주요 텍스트
    secondary: '#A0A0A0',  // 보조 텍스트
    tertiary: '#666666',   // 비활성 텍스트
  },
  accent: {
    primary: '#3B82F6',    // 파란색 (CTA)
    success: '#10B981',    // 초록색 (성공)
    error: '#EF4444',      // 빨간색 (에러)
    warning: '#F59E0B',    // 주황색 (경고)
    purple: '#8B5CF6',     // 보라색 (AI)
  }
}
\`\`\`

## 🧪 테스트

\`\`\`bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# Playwright 테스트
npm run test:playwright
\`\`\`

## 📝 API 문서

### POST /api/analyze-intent

사용자 입력을 분석하여 워크플로우 의도 파악

**Request:**
\`\`\`json
{
  "input": "스티비에 신규 구독자 들어오면 카톡으로 알려줘"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "intent": "notification_automation",
    "trigger": {
      "service": "Stibee",
      "event": "new_subscriber"
    },
    "actions": [
      {
        "service": "KakaoTalk",
        "action": "send_message",
        "data_fields": ["email", "name"]
      }
    ],
    "required_nodes": ["Webhook", "Function", "HTTP Request"],
    "complexity": "simple",
    "estimated_nodes": 3
  }
}
\`\`\`

### POST /api/generate-workflow

Intent 분석 결과로 n8n 워크플로우 JSON 생성

**Request:**
\`\`\`json
{
  "intent_analysis": { /* IntentAnalysis object */ },
  "user_input": "원본 사용자 입력"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "workflow_json": { /* N8nWorkflow object */ },
    "estimated_complexity": "simple",
    "optimizations": [
      "에러 핸들링 노드 추가",
      "API 호출 재시도 로직 추가"
    ]
  }
}
\`\`\`

### POST /api/deploy-workflow

생성된 워크플로우를 n8n에 배포

**Request:**
\`\`\`json
{
  "workflow_json": { /* N8nWorkflow object */ },
  "n8n_instance": "http://localhost:5678",
  "api_key": "your_api_key"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "workflow_id": "123",
    "status": "deployed",
    "webhook_url": "http://localhost:5678/webhook/path"
  }
}
\`\`\`

## 🤝 기여

기여는 언제나 환영합니다!

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License.

## 🙏 감사의 말

- [n8n](https://n8n.io) - 강력한 워크플로우 자동화 플랫폼
- [OpenAI](https://openai.com) - AI 분석 엔진
- [Shadcn/ui](https://ui.shadcn.com) - 아름다운 UI 컴포넌트
- [Playwright](https://playwright.dev) - 브라우저 자동화
- BSD Vibe Coding Center - 교육과 영감

## 📞 문의

문제나 질문이 있으시면 [Issues](https://github.com/yourusername/bsd-n8n-ai-studio/issues)에 올려주세요.

---

**Made with ❤️ by BSD Vibe Coding Center**

🚀 Let's automate everything with AI!
