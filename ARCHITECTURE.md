# BSD n8n AI Dev Studio - 시스템 아키텍처 문서

## 📐 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    BSD n8n AI Dev Studio                    │
│                   (Next.js 15 Application)                  │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │  External    │
│   (React)    │    │  (Next API)  │    │  Services    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Chat UI      │    │ AI Engine    │    │ OpenAI GPT-4 │
│ Workflow     │    │ Workflow Gen │    │ Anthropic    │
│ Preview      │    │ n8n Client   │    │ n8n API      │
│ Debug View   │    │ Playwright   │    │ Playwright   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 🔄 데이터 플로우

### 워크플로우 생성 플로우

```
1. User Input (자연어)
   │
   ├─ "스티비 신규 구독자 → 카톡 알림"
   │
   ▼
2. AI Intent Analyzer (OpenAI GPT-4)
   │
   ├─ Intent: notification_automation
   ├─ Trigger: Stibee webhook
   ├─ Actions: KakaoTalk message
   ├─ Complexity: simple
   │
   ▼
3. Workflow Generator
   │
   ├─ Node Template Matching
   ├─ JSON Structure Generation
   ├─ Connection Auto-wiring
   │
   ▼
4. n8n API Client
   │
   ├─ POST /api/v1/workflows
   ├─ Workflow Deployment
   │
   ▼
5. Auto Test Execution
   │
   ├─ Generate mock data
   ├─ Trigger workflow
   ├─ Validate results
   │
   ▼
6. Success/Failure
   │
   ├─ [Success] → Save as template
   │
   ├─ [Failure] → AI Debugger
   │              │
   │              ├─ Playwright screenshot
   │              ├─ AI Vision analysis
   │              ├─ Auto fix generation
   │              │
   │              ▼
   │           Re-test (최대 3회)
   │
   ▼
7. Final Workflow
```

### AI 디버깅 플로우

```
Error Detected
   │
   ├─ Execution Log Collection
   │
   ▼
Playwright Service
   │
   ├─ Navigate to n8n workflow
   ├─ Capture screenshot
   ├─ Extract error UI elements
   │
   ▼
AI Debugger (Vision + Text Analysis)
   │
   ├─ Parse error message
   ├─ Identify affected node
   ├─ Analyze root cause
   │
   ▼
Fix Generation
   │
   ├─ Code changes
   ├─ Parameter adjustments
   ├─ Manual steps (if needed)
   │
   ▼
Auto-apply Fix
   │
   ├─ Update workflow JSON
   ├─ Deploy to n8n
   │
   ▼
Re-test Workflow
   │
   ├─ [Success] → Done
   ├─ [Failure] → Retry (max 3)
```

## 🏗️ 컴포넌트 상세 설계

### 1. AI Intent Analyzer

**위치**: `src/services/ai-intent-analyzer.ts`

**역할**: 자연어 입력을 구조화된 워크플로우 요구사항으로 변환

**주요 메서드**:
- `analyzeIntent(userInput: string)` → IntentAnalysis
- `analyzeWithSuggestions(userInput: string)` → Enhanced Analysis
- `getExampleIntents()` → Example prompts

**사용 AI 모델**: OpenAI GPT-4

**입력 예시**:
```
"스티비에 신규 구독자 들어오면 카톡으로 알려줘"
```

**출력 예시**:
```typescript
{
  intent: "notification_automation",
  trigger: {
    service: "Stibee",
    event: "new_subscriber"
  },
  actions: [
    {
      service: "KakaoTalk",
      action: "send_message",
      data_fields: ["email", "name"]
    }
  ],
  required_nodes: ["Webhook", "Function", "HTTP Request"],
  complexity: "simple",
  estimated_nodes: 3
}
```

### 2. Workflow Generator

**위치**: `src/services/workflow-generator.ts`

**역할**: Intent 분석 결과를 n8n workflow JSON으로 변환

**주요 메서드**:
- `generateWorkflow(analysis, userInput)` → WorkflowGenerationResult
- `generateOptimizedWorkflow(analysis, userInput)` → Enhanced workflow
- `validateWorkflow(workflow)` → Validation result

**노드 템플릿 라이브러리**:
- Webhook, Gmail, Slack, HTTP Request
- Function, Google Sheets, Schedule Trigger
- Notion, Discord, Telegram, etc.

**자동 생성 요소**:
- 노드 위치 자동 계산 (visual layout)
- 연결 그래프 자동 생성
- 데이터 변환 코드 자동 작성
- 에러 핸들링 로직 추가

### 3. n8n API Client

**위치**: `src/services/n8n-api-client.ts`

**역할**: n8n REST API와의 통신 관리

**주요 메서드**:
- `createWorkflow(workflow)` → { id, workflow }
- `executeWorkflow(workflowId, data)` → { executionId }
- `getExecution(executionId)` → WorkflowExecution
- `testConnection()` → { success, version }

**지원 환경**:
- Local n8n (localhost:5678)
- n8n Cloud (app.n8n.cloud)
- Self-hosted instances

### 4. AI Debugger

**위치**: `src/services/ai-debugger.ts`

**역할**: 워크플로우 에러 자동 진단 및 수정

**주요 메서드**:
- `analyzeScreenshot(screenshot, execution)` → DebugAnalysis
- `analyzeExecutionLog(execution, workflow)` → DebugAnalysis
- `generateFix(workflow, analysis)` → Fixed workflow
- `debugWithRetry(workflow, execution, screenshot, maxAttempts)` → Result

**디버깅 전략**:

**1단계: 빠른 패턴 매칭**
```typescript
const patterns = [
  { pattern: /authentication.*failed/, solution: "API Key 재설정" },
  { pattern: /undefined.*property/, solution: "데이터 필드 확인" },
  { pattern: /timeout/, solution: "Timeout 설정 증가" }
];
```

**2단계: AI Vision 분석** (screenshot 있을 때)
- n8n UI에서 빨간색 에러 표시 감지
- 에러 메시지 OCR 추출
- 노드 상태 시각적 분석

**3단계: AI Text 분석** (execution log)
- 스택 트레이스 파싱
- 입력 데이터 검증
- 로직 흐름 분석

### 5. Playwright Service

**위치**: `src/services/playwright-service.ts`

**역할**: n8n 웹 UI 자동화 및 모니터링

**주요 메서드**:
- `navigateToWorkflow(n8nUrl, workflowId)` → void
- `captureWorkflowScreenshot()` → base64 image
- `detectErrors()` → { hasErrors, errorNodes }
- `waitForExecutionComplete(timeout)` → { success, duration }

**사용 시나리오**:
1. 워크플로우 실행 모니터링
2. 에러 스크린샷 자동 캡처
3. 디버깅용 시각적 상태 확인
4. E2E 테스트 자동화

## 🎨 Frontend 아키텍처

### Component Hierarchy

```
App
├── Layout (globals.css, dark mode)
│
├── Page (/)
│   └── ChatInterface
│       ├── MessageList
│       │   ├── MessageBubble
│       │   │   ├── IntentPreview
│       │   │   ├── WorkflowPreview
│       │   │   └── ExecutionStatus
│       │   └── MessagesEndRef
│       │
│       └── InputArea
│           ├── Textarea
│           ├── SendButton
│           └── QuickExamples
│
├── /workflows (planned)
│   ├── WorkflowList
│   └── WorkflowCard
│
├── /workflows/[id] (planned)
│   ├── WorkflowCanvas
│   ├── NodePanel
│   └── FloatingToolbar
│
└── /workflows/[id]/debug (planned)
    ├── LiveScreenshot
    ├── AIAnalysis
    └── ExecutionLog
```

### State Management (Zustand)

**Planned Stores**:

```typescript
// useWorkflowStore
interface WorkflowStore {
  workflows: N8nWorkflow[];
  currentWorkflow: N8nWorkflow | null;
  isGenerating: boolean;
  addWorkflow: (workflow: N8nWorkflow) => void;
  updateWorkflow: (id: string, updates: Partial<N8nWorkflow>) => void;
  deleteWorkflow: (id: string) => void;
}

// useChatStore
interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

// useSettingsStore
interface SettingsStore {
  n8nInstanceUrl: string;
  n8nApiKey: string;
  preferredAiModel: 'gpt-4' | 'claude-3';
  autoTestWorkflows: boolean;
  updateSettings: (settings: Partial<UserSettings>) => void;
}
```

## 🔌 API Routes

### POST /api/analyze-intent

**Input**:
```json
{
  "input": "사용자 자연어 입력"
}
```

**Output**:
```json
{
  "success": true,
  "data": {
    "intent": "...",
    "trigger": { ... },
    "actions": [ ... ],
    "required_nodes": [ ... ],
    "complexity": "simple|medium|complex",
    "estimated_nodes": 3
  }
}
```

### POST /api/generate-workflow

**Input**:
```json
{
  "intent_analysis": { ... },
  "user_input": "원본 입력"
}
```

**Output**:
```json
{
  "success": true,
  "data": {
    "workflow_json": { ... },
    "estimated_complexity": "simple",
    "optimizations": [ "..." ]
  }
}
```

### POST /api/deploy-workflow

**Input**:
```json
{
  "workflow_json": { ... },
  "n8n_instance": "http://localhost:5678",
  "api_key": "..."
}
```

**Output**:
```json
{
  "success": true,
  "data": {
    "workflow_id": "123",
    "status": "deployed",
    "webhook_url": "..."
  }
}
```

## 🗄️ 데이터 모델

### TypeScript Types

모든 타입 정의는 `src/types/index.ts`에 위치

**핵심 타입**:
- `IntentAnalysis` - AI 분석 결과
- `N8nWorkflow` - n8n 워크플로우 JSON 구조
- `N8nNode` - n8n 노드 정의
- `WorkflowExecution` - 실행 결과
- `DebugAnalysis` - 디버깅 분석 결과
- `ChatMessage` - 채팅 메시지
- `WorkflowTemplate` - 재사용 가능 템플릿

## 🔒 보안 고려사항

### API Key 보호

- 환경 변수로만 관리 (`.env.local`)
- Git에 커밋 금지 (`.gitignore`)
- Frontend에서 직접 사용 금지
- Backend API Routes를 통해서만 접근

### n8n 인증

- API Key 기반 인증
- HTTPS 사용 권장 (프로덕션)
- CORS 설정 필요

### 데이터 프라이버시

- 사용자 입력 로그 최소화
- API 응답 캐싱 주의
- 민감 정보 자동 필터링

## 📊 성능 최적화

### Frontend 최적화

- React Server Components 활용
- Dynamic import로 Code splitting
- Image optimization (next/image)
- API response caching (React Query)

### Backend 최적화

- n8n API 호출 캐싱
- AI 분석 결과 캐싱 (Redis 예정)
- Workflow template caching
- Batch API requests

### AI 최적화

- Intent 분석: GPT-4 Turbo 사용
- 간단한 분석: GPT-3.5 Turbo로 다운그레이드
- 응답 스트리밍으로 체감 속도 향상
- Prompt caching 활용

## 🧪 테스트 전략

### Unit Tests (Jest + React Testing Library)

- Component rendering tests
- Service layer logic tests
- Utility function tests

### Integration Tests

- API routes testing
- n8n client integration
- AI service integration

### E2E Tests (Playwright)

- Full workflow creation flow
- Error handling flows
- User interaction scenarios

## 🚀 배포 전략

### Development

```bash
npm run dev
# http://localhost:3000
```

### Production (Vercel)

```bash
vercel deploy --prod
```

**환경 변수 설정**:
- OPENAI_API_KEY
- N8N_INSTANCE_URL
- N8N_API_KEY
- ANTHROPIC_API_KEY (optional)

### Docker (Future)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 확장 계획

### Phase 1: MVP (현재)
- ✅ AI Intent 분석
- ✅ 워크플로우 자동 생성
- ✅ n8n API 연동
- ✅ 기본 Chat UI

### Phase 2: Auto-Debug
- ✅ Playwright 통합
- ✅ AI Vision 디버깅
- ⏳ 자동 수정 루프 완성
- ⏳ 디버깅 대시보드

### Phase 3: Template Library
- ⏳ 템플릿 저장 시스템
- ⏳ 카테고리별 분류
- ⏳ 검색 및 필터
- ⏳ 사용 통계

### Phase 4: Advanced Features
- ⏳ 복잡한 워크플로우 지원
- ⏳ 조건부 로직
- ⏳ 에러 핸들링
- ⏳ A/B 테스트

### Phase 5: Enterprise
- ⏳ 팀 협업
- ⏳ 버전 관리
- ⏳ 사용량 모니터링
- ⏳ 커스텀 노드 생성

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-01-16
**작성자**: BSD Vibe Coding Center
