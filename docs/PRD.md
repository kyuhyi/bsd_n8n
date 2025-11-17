# BSD n8n AI Dev Studio - Product Requirements Document (PRD)

## 🎯 Product Vision

**BSD n8n AI Dev Studio**는 AI가 n8n 위에서 자동화 워크플로우를 대신 개발해주는 혁신적인 플랫폼입니다. 초보자가 n8n을 전혀 몰라도 자연어로 아이디어만 말하면, AI가 노드를 생성하고, 테스트하고, 디버깅까지 완료하여 완벽한 자동화를 실현합니다.

### 핵심 가치 제안

**초보자를 위한**:
- "쇼핑몰 주문 들어오면 카톡으로 알려줘" → 자동으로 완성된 워크플로우
- 노드 이름, 입력값, 출력값을 전혀 몰라도 OK
- 자연어 입력만으로 모든 것이 자동 생성

**개발자를 위한**:
- 코드 대신 아이디어만 말하면 자동화 완성
- 복잡한 워크플로우도 AI가 최적 구조로 설계
- 디버깅 시간 90% 절감

**비즈니스를 위한**:
- AI 에이전트 기반 자동화 OS 시장의 파운더
- No-code 자동화 진입 장벽 완전 제거
- 자동화 구축 시간 95% 단축

---

## 🏗️ System Architecture

### 전체 플로우

```
[유저 자연어 입력]
        ↓
[AI Intent 분석 엔진]
  - 자연어 처리 (NLP)
  - 의도 파악 및 분류
  - 필요 노드 자동 판단
        ↓
[워크플로우 JSON 자동 생성 엔진]
  - n8n 노드 템플릿 매칭
  - JSON 구조 자동 조립
  - 입력/출력 자동 연결
        ↓
[Local/Cloud n8n API에 자동 Push]
  - n8n REST API 연동
  - 워크플로우 배포
        ↓
[자동 실행 테스트]
  - 테스트 데이터 자동 생성
  - 워크플로우 실행
        ↓
     [성공] ────────────────┐
        │                     │
     [실패]                  │
        ↓                     │
[Screen Capture + Log 분석]  │
  - Playwright 화면 캡처     │
  - n8n 실행 로그 수집      │
  - AI Vision 분석          │
        ↓                     │
[AI 디버깅 엔진]            │
  - 오류 원인 자동 파악      │
  - 수정 코드 자동 생성      │
        ↓                     │
[자동 수정 → 재테스트] ─────┘
        ↓
[워크플로우 저장 + 템플릿화]
  - 성공한 워크플로우 저장
  - 재사용 가능 템플릿 생성
  - 지식 베이스 축적
```

---

## 🔧 Core Components

### 1. AI Intent 분석 엔진

**목적**: 사용자의 자연어 입력을 분석하여 필요한 자동화 워크플로우 구조 파악

**입력 예시**:
```
"스티비에 신규 구독자 들어오면 내 카톡으로 자동 메시지를 보내줘.
메시지에는 이메일/이름 포함되게"
```

**분석 결과**:
```json
{
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
  "required_nodes": ["Webhook", "Stibee", "KakaoTalk"],
  "complexity": "simple",
  "estimated_nodes": 3
}
```

**기술 스택**:
- OpenAI GPT-4 / Claude Sonnet for intent analysis
- Custom prompt engineering for n8n domain knowledge
- Entity extraction for service names, actions, data fields

**핵심 기능**:
- ✅ 자연어 → 구조화된 워크플로우 요구사항 변환
- ✅ 필요한 n8n 노드 자동 판단
- ✅ 데이터 흐름 파악 (입력 → 출력 매핑)
- ✅ 복잡도 분석 (simple/medium/complex)

---

### 2. 워크플로우 JSON 자동 생성 엔진

**목적**: Intent 분석 결과를 실제 n8n workflow JSON으로 변환

**생성 예시**:
```json
{
  "name": "스티비 신규구독 → 카톡 알림",
  "nodes": [
    {
      "id": "webhook-1",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "path": "stibee-webhook",
        "responseMode": "onReceived",
        "options": {}
      },
      "name": "Stibee Webhook"
    },
    {
      "id": "function-1",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "functionCode": "return items.map(item => ({\n  json: {\n    email: item.json.email,\n    name: item.json.name\n  }\n}));"
      },
      "name": "데이터 추출"
    },
    {
      "id": "http-1",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [650, 300],
      "parameters": {
        "method": "POST",
        "url": "https://kapi.kakao.com/v2/api/talk/memo/default/send",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "kakaoApi",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "template_object",
              "value": "={\"object_type\":\"text\",\"text\":\"새 구독자: {{$json.email}} / {{$json.name}}\",\"link\":{\"web_url\":\"https://developers.kakao.com\",\"mobile_web_url\":\"https://developers.kakao.com\"}}"
            }
          ]
        }
      },
      "name": "카카오톡 전송"
    }
  ],
  "connections": {
    "Stibee Webhook": {
      "main": [[{"node": "데이터 추출", "type": "main", "index": 0}]]
    },
    "데이터 추출": {
      "main": [[{"node": "카카오톡 전송", "type": "main", "index": 0}]]
    }
  },
  "active": false,
  "settings": {},
  "id": "workflow-auto-generated"
}
```

**기술 스택**:
- n8n workflow JSON schema validation
- Node template library (100+ pre-built node configurations)
- Dynamic position calculation for visual layout
- Connection graph auto-generation

**핵심 기능**:
- ✅ n8n 노드 템플릿 라이브러리
- ✅ 노드 간 연결 자동 생성
- ✅ 데이터 매핑 자동 설정
- ✅ 시각적 레이아웃 자동 배치
- ✅ 인증 정보 자동 설정 가이드

---

### 3. n8n API 연동 모듈

**목적**: 생성된 워크플로우를 n8n 인스턴스에 자동 배포

**API Endpoints 사용**:
```typescript
// Workflow 생성
POST /api/v1/workflows
{
  "name": "워크플로우 이름",
  "nodes": [...],
  "connections": {...}
}

// Workflow 실행
POST /api/v1/workflows/:id/activate

// 실행 로그 조회
GET /api/v1/executions/:id

// Workflow 업데이트
PATCH /api/v1/workflows/:id
```

**환경 지원**:
- ✅ Local n8n (localhost:5678)
- ✅ n8n Cloud (app.n8n.cloud)
- ✅ Self-hosted n8n instances
- ✅ API Key 인증 자동 관리

**핵심 기능**:
- ✅ 워크플로우 자동 생성/업데이트/삭제
- ✅ 워크플로우 활성화/비활성화
- ✅ 실행 이력 조회
- ✅ 에러 로그 자동 수집

---

### 4. AI Vision 기반 디버깅 엔진

**목적**: n8n 화면을 실시간으로 모니터링하며 오류를 자동 감지 및 수정

**방법 A: Playwright Screen Capture + AI Vision**

```typescript
// n8n 화면 자동 캡처
const page = await browser.newPage();
await page.goto('http://localhost:5678/workflow/:id');

// 1초마다 화면 캡처
const screenshot = await page.screenshot();

// Claude Vision / GPT-4V로 분석
const analysis = await analyzeScreenshot(screenshot, {
  prompt: `
    n8n 워크플로우 화면을 분석하세요:
    1. 빨간색 에러 표시가 있나요?
    2. 어떤 노드에서 실패했나요?
    3. 에러 메시지는 무엇인가요?
    4. input/output 데이터 불일치가 있나요?
  `
});

// 자동 수정 제안
if (analysis.hasError) {
  const fix = await generateFix(analysis.errorDetails);
  await applyFix(workflowId, fix);
}
```

**방법 B: n8n Execution Log API**

```typescript
// 실행 로그 자동 수집
const execution = await n8nApi.getExecution(executionId);

if (execution.status === 'error') {
  const errorNode = execution.data.resultData.error.node;
  const errorMessage = execution.data.resultData.error.message;

  // AI 분석
  const diagnosis = await analyzeError({
    node: errorNode,
    message: errorMessage,
    inputData: execution.data.resultData.runData[errorNode].input,
    workflow: workflowJson
  });

  // 자동 수정
  const fixedWorkflow = await applyAutomaticFix(
    workflowJson,
    diagnosis.suggestedFix
  );

  await n8nApi.updateWorkflow(workflowId, fixedWorkflow);
}
```

**AI 디버깅 대화 예시**:
```
🤖 AI: "3번째 JS 노드에서 undefined error가 발생했습니다.
       input에 email 값이 없네요.
       이전 Webhook 노드에서 email을 출력하도록 수정할게요?"

👤 User: "네"

🤖 AI: "수정 완료! 다시 테스트하겠습니다..."
      [자동 재실행]
      "✅ 성공! 워크플로우가 정상 작동합니다."
```

**핵심 기능**:
- ✅ 실시간 화면 모니터링 (Playwright)
- ✅ 에러 로그 자동 분석
- ✅ AI Vision으로 UI 상태 파악
- ✅ 오류 원인 자동 진단
- ✅ 수정 코드 자동 생성
- ✅ 자동 재테스트 루프

---

### 5. 자동 테스트 시스템

**목적**: 생성된 워크플로우를 자동으로 검증

**테스트 전략**:

1. **Mock Data 자동 생성**
```typescript
// Intent 분석 결과 기반 테스트 데이터 생성
const testData = generateMockData({
  service: "Stibee",
  event: "new_subscriber",
  fields: ["email", "name"]
});

// 예시 결과
{
  "email": "test@example.com",
  "name": "홍길동",
  "subscribed_at": "2025-01-16T09:00:00Z"
}
```

2. **Webhook 테스트**
```typescript
// 테스트 웹훅 요청 자동 전송
await axios.post('http://localhost:5678/webhook-test/stibee-webhook', testData);
```

3. **결과 검증**
```typescript
// 실행 결과 자동 확인
const execution = await waitForExecution(workflowId);

if (execution.status === 'success') {
  console.log('✅ 테스트 성공');
  saveAsTemplate(workflowId);
} else {
  console.log('❌ 테스트 실패 - 디버깅 시작');
  startDebugCycle(workflowId, execution);
}
```

**핵심 기능**:
- ✅ 테스트 데이터 자동 생성
- ✅ 워크플로우 자동 실행
- ✅ 결과 검증 (성공/실패)
- ✅ 실패 시 디버깅 자동 시작
- ✅ 성공 시 템플릿 자동 저장

---

### 6. 워크플로우 템플릿 라이브러리

**목적**: 성공한 워크플로우를 템플릿으로 저장하고 재사용

**템플릿 구조**:
```json
{
  "id": "template-stibee-kakao",
  "name": "스티비 → 카카오톡 알림",
  "category": "notification",
  "tags": ["stibee", "kakao", "email", "marketing"],
  "description": "스티비 신규 구독자 발생 시 카카오톡으로 알림",
  "usage_count": 127,
  "success_rate": 0.98,
  "workflow_json": {...},
  "required_credentials": ["kakaoApi"],
  "setup_guide": "1. 카카오 개발자 등록\n2. API Key 발급\n3. ...",
  "created_at": "2025-01-15",
  "created_by": "ai_engine"
}
```

**템플릿 추천 엔진**:
```typescript
// 사용자 입력 기반 유사 템플릿 추천
const similarTemplates = await findSimilarTemplates({
  userInput: "스티비에 신규 구독자 들어오면 슬랙으로 알려줘",
  threshold: 0.7
});

// 추천 결과
[
  {
    template: "template-stibee-kakao",
    similarity: 0.85,
    modification_needed: "카카오톡 → 슬랙으로 변경"
  },
  {
    template: "template-mailchimp-slack",
    similarity: 0.72,
    modification_needed: "Mailchimp → Stibee로 변경"
  }
]
```

**핵심 기능**:
- ✅ 성공 워크플로우 자동 템플릿화
- ✅ 카테고리별 분류 (notification, data-sync, automation 등)
- ✅ 태그 기반 검색
- ✅ 유사 템플릿 AI 추천
- ✅ 사용 통계 및 성공률 추적

---

## 💻 Frontend Architecture

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Dark Mode)
- **State Management**: Zustand
- **API Client**: TanStack Query (React Query)
- **Real-time**: Socket.io (워크플로우 실행 상태)
- **Charts**: Recharts (통계 시각화)

### Pages & Routes

```
/                           → Landing Page
/dashboard                  → 메인 대시보드
/chat                       → AI 챗봇 인터페이스 (워크플로우 생성)
/workflows                  → 워크플로우 목록
/workflows/:id              → 워크플로우 상세/편집
/workflows/:id/test         → 테스트 실행 화면
/workflows/:id/debug        → 디버깅 화면 (AI Vision)
/templates                  → 템플릿 라이브러리
/templates/:id              → 템플릿 상세
/settings                   → 설정 (n8n API 연결)
/analytics                  → 사용 통계 대시보드
```

### UI Components

**1. Chat Interface (메인 워크플로우 생성 화면)**
```tsx
<ChatInterface>
  <MessageList>
    <UserMessage>
      "스티비에 신규 구독자 들어오면 카톡으로 알려줘"
    </UserMessage>

    <AIMessage>
      <IntentAnalysis>
        🎯 의도: 알림 자동화
        📊 복잡도: 간단
        🔧 필요 노드: 3개
      </IntentAnalysis>

      <WorkflowPreview>
        [Stibee Webhook] → [데이터 추출] → [카카오톡]
      </WorkflowPreview>

      <ActionButtons>
        <Button>생성하기</Button>
        <Button>수정 요청</Button>
      </ActionButtons>
    </AIMessage>

    <SystemMessage>
      ✅ 워크플로우 생성 완료
      🧪 테스트 시작...
    </SystemMessage>
  </MessageList>

  <InputArea>
    <Textarea placeholder="어떤 자동화를 만들까요?" />
    <SendButton />
  </InputArea>
</ChatInterface>
```

**2. Workflow Visual Builder (선택적 편집)**
```tsx
<WorkflowCanvas>
  <NodePanel>
    {nodes.map(node => (
      <NodeCard
        type={node.type}
        position={node.position}
        connections={node.connections}
      />
    ))}
  </NodePanel>

  <ConnectionLines />

  <FloatingToolbar>
    <Button>저장</Button>
    <Button>테스트</Button>
    <Button>배포</Button>
  </FloatingToolbar>
</WorkflowCanvas>
```

**3. Debug Dashboard (AI Vision 디버깅)**
```tsx
<DebugDashboard>
  <SplitPane>
    <LeftPanel>
      <LiveScreenshot>
        {/* n8n 화면 실시간 캡처 */}
        <Image src={screenshotUrl} />
        <ErrorHighlight position={errorNodePosition} />
      </LiveScreenshot>
    </LeftPanel>

    <RightPanel>
      <AIAnalysis>
        <ErrorDetails>
          ❌ 노드: "카카오톡 전송"
          💬 에러: "API authentication failed"
          🔍 원인: "유효하지 않은 API Key"
        </ErrorDetails>

        <SuggestedFix>
          💡 제안:
          1. 카카오 개발자 콘솔에서 새 API Key 발급
          2. n8n Credentials에 업데이트
          3. 워크플로우 재실행

          <Button>자동 수정</Button>
        </SuggestedFix>
      </AIAnalysis>

      <ExecutionLog>
        {/* 실행 로그 스트림 */}
      </ExecutionLog>
    </RightPanel>
  </SplitPane>
</DebugDashboard>
```

**4. Template Library**
```tsx
<TemplateLibrary>
  <SearchBar>
    <Input placeholder="템플릿 검색..." />
    <FilterDropdown>
      <Option>알림</Option>
      <Option>데이터 동기화</Option>
      <Option>이메일 마케팅</Option>
    </FilterDropdown>
  </SearchBar>

  <TemplateGrid>
    {templates.map(template => (
      <TemplateCard
        name={template.name}
        description={template.description}
        usageCount={template.usage_count}
        successRate={template.success_rate}
        tags={template.tags}
        onUse={() => createFromTemplate(template.id)}
      />
    ))}
  </TemplateGrid>
</TemplateLibrary>
```

---

## 🎨 Design System (Dark Mode)

### Color Palette

```typescript
// Tailwind config
const colors = {
  background: {
    primary: '#0A0A0A',      // 메인 배경
    secondary: '#141414',    // 카드 배경
    tertiary: '#1E1E1E',     // 호버 상태
  },
  text: {
    primary: '#FFFFFF',      // 주요 텍스트
    secondary: '#A0A0A0',    // 보조 텍스트
    tertiary: '#666666',     // 비활성 텍스트
  },
  accent: {
    primary: '#3B82F6',      // 파란색 (CTA)
    success: '#10B981',      // 초록색 (성공)
    error: '#EF4444',        // 빨간색 (에러)
    warning: '#F59E0B',      // 주황색 (경고)
    purple: '#8B5CF6',       // 보라색 (AI)
  },
  border: {
    default: '#2A2A2A',      // 기본 테두리
    hover: '#3A3A3A',        // 호버 테두리
    focus: '#3B82F6',        // 포커스 테두리
  }
};
```

### Typography

```typescript
const typography = {
  heading: {
    h1: 'text-4xl font-bold tracking-tight',
    h2: 'text-3xl font-semibold',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-medium',
  },
  body: {
    large: 'text-lg',
    base: 'text-base',
    small: 'text-sm',
    tiny: 'text-xs',
  },
  code: {
    inline: 'font-mono text-sm bg-background-tertiary px-1.5 py-0.5 rounded',
    block: 'font-mono text-sm bg-background-tertiary p-4 rounded-lg',
  }
};
```

### Component Styling

```tsx
// Example: Chat Message
<div className="
  bg-background-secondary
  border border-border-default
  rounded-lg
  p-4
  hover:border-border-hover
  transition-all
  dark:bg-background-secondary
">
  <p className="text-text-primary">메시지 내용</p>
</div>

// Example: Primary Button
<button className="
  bg-accent-primary
  text-white
  px-6 py-3
  rounded-lg
  font-medium
  hover:bg-blue-600
  active:scale-95
  transition-all
  shadow-lg shadow-accent-primary/20
">
  생성하기
</button>
```

---

## 🔐 Backend Architecture

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js / Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL (워크플로우 저장)
- **Cache**: Redis (세션, 템플릿 캐시)
- **Queue**: Bull (워크플로우 실행 큐)
- **AI**: OpenAI SDK, Anthropic SDK
- **Automation**: Playwright (화면 캡처)

### API Endpoints

```typescript
// Intent Analysis
POST /api/analyze-intent
Body: { input: "스티비에 신규 구독자 들어오면..." }
Response: {
  intent: "notification_automation",
  trigger: {...},
  actions: [...],
  required_nodes: [...]
}

// Workflow Generation
POST /api/generate-workflow
Body: { intent_analysis: {...} }
Response: {
  workflow_json: {...},
  preview_url: "...",
  estimated_complexity: "simple"
}

// Deploy to n8n
POST /api/deploy-workflow
Body: {
  workflow_json: {...},
  n8n_instance: "http://localhost:5678",
  api_key: "..."
}
Response: {
  workflow_id: "123",
  status: "deployed",
  webhook_url: "..."
}

// Test Workflow
POST /api/test-workflow/:id
Body: { test_data: {...} }
Response: {
  execution_id: "456",
  status: "running"
}

// Get Execution Status
GET /api/executions/:id
Response: {
  status: "success" | "error",
  error_details: {...},
  output_data: {...}
}

// Debug Workflow (AI Vision)
POST /api/debug-workflow/:id
Body: { screenshot: "base64...", execution_log: {...} }
Response: {
  error_analysis: {...},
  suggested_fix: {...},
  auto_apply: true
}

// Template Library
GET /api/templates
Query: { category, search, tags[] }
Response: {
  templates: [...],
  total: 50
}

// Create from Template
POST /api/templates/:id/create
Body: { modifications: {...} }
Response: {
  workflow_id: "789",
  customization_needed: [...]
}
```

### Database Schema

```sql
-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_json JSONB NOT NULL,
  n8n_workflow_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Executions
CREATE TABLE executions (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  n8n_execution_id VARCHAR(255),
  status VARCHAR(50),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  error_details JSONB,
  output_data JSONB
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  description TEXT,
  workflow_json JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Debug Logs
CREATE TABLE debug_logs (
  id UUID PRIMARY KEY,
  execution_id UUID REFERENCES executions(id),
  screenshot_url TEXT,
  error_analysis JSONB,
  suggested_fix JSONB,
  auto_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Settings
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY,
  n8n_instance_url VARCHAR(255),
  n8n_api_key_encrypted TEXT,
  preferred_ai_model VARCHAR(50) DEFAULT 'gpt-4',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Implementation Phases

### Phase 1: MVP (2 weeks)
- ✅ Next.js 프로젝트 초기화 (Dark mode, Shadcn)
- ✅ 기본 Chat UI
- ✅ AI Intent 분석 엔진 (GPT-4)
- ✅ 간단한 워크플로우 JSON 생성 (5개 기본 노드)
- ✅ n8n API 연동 (local only)
- ✅ 수동 테스트 기능

**MVP Demo**:
```
사용자: "Gmail 신규 메일 오면 슬랙으로 알려줘"
      ↓
AI가 자동 생성:
[Gmail Trigger] → [Slack Message]
      ↓
n8n에 자동 배포
```

### Phase 2: Auto-Debug (1 week)
- ✅ Playwright 통합
- ✅ n8n 화면 캡처
- ✅ AI Vision 분석 (GPT-4V / Claude Vision)
- ✅ 에러 로그 수집
- ✅ 자동 수정 제안
- ✅ 재테스트 루프

### Phase 3: Template Library (1 week)
- ✅ 템플릿 저장 시스템
- ✅ 카테고리별 분류
- ✅ 검색 기능
- ✅ 유사 템플릿 추천 AI
- ✅ 사용 통계

### Phase 4: Advanced Features (2 weeks)
- ✅ 복잡한 워크플로우 지원 (10+ 노드)
- ✅ 조건부 로직 (IF/ELSE)
- ✅ 반복문 (Loop)
- ✅ 에러 핸들링 (Try/Catch)
- ✅ 워크플로우 최적화 제안
- ✅ A/B 테스트

### Phase 5: Enterprise (Ongoing)
- ✅ 팀 협업 기능
- ✅ 버전 관리
- ✅ 승인 워크플로우
- ✅ 사용량 모니터링
- ✅ 커스텀 노드 생성

---

## 📊 Success Metrics

### User Metrics
- **초보자 성공률**: 90%+ (n8n 경험 없이도 워크플로우 완성)
- **워크플로우 생성 시간**: 평균 5분 이하
- **자동 디버깅 성공률**: 80%+ (수동 개입 없이 문제 해결)

### Technical Metrics
- **AI Intent 분석 정확도**: 85%+
- **워크플로우 JSON 생성 성공률**: 95%+
- **자동 테스트 성공률**: 90%+
- **API 응답 시간**: <2초 (Intent 분석)

### Business Metrics
- **월 활성 사용자**: 1,000+ (6개월 목표)
- **생성된 워크플로우**: 10,000+ (6개월 목표)
- **템플릿 재사용률**: 60%+

---

## 🎯 Target Users

### Persona 1: 비개발자 창업가
- **이름**: 김창업 (32세)
- **배경**: 온라인 쇼핑몰 운영, 개발 지식 없음
- **Pain Point**: 주문 알림, 재고 관리 자동화가 필요하지만 개발자 고용 부담
- **Goal**: "주문 들어오면 카톡 알림 + 구글 시트에 자동 기록"
- **BSD n8n AI Studio 사용**:
  - 자연어로 요구사항 입력
  - 5분 안에 완성된 자동화
  - 월 10만원+ 인건비 절감

### Persona 2: 주니어 개발자
- **이름**: 박개발 (27세)
- **배경**: 스타트업 백엔드 개발자, n8n 처음 접함
- **Pain Point**: n8n 학습 곡선, 복잡한 워크플로우 설계 어려움
- **Goal**: "사용자 가입 시 이메일 + 슬랙 + CRM 자동 연동"
- **BSD n8n AI Studio 사용**:
  - AI가 최적 구조 자동 설계
  - 디버깅 시간 90% 절감
  - 복잡한 워크플로우도 자동 생성

### Persona 3: 노코드 자동화 전문가
- **이름**: 이자동 (35세)
- **배경**: 프리랜서, 클라이언트에게 자동화 솔루션 제공
- **Pain Point**: 클라이언트 요구사항 빠르게 프로토타입 필요
- **Goal**: "클라이언트 미팅 중 즉석에서 데모 생성"
- **BSD n8n AI Studio 사용**:
  - 즉석 프로토타입 생성
  - 템플릿 라이브러리로 재사용
  - 프로젝트 납기 50% 단축

---

## 🔮 Future Vision

### Year 1: n8n AI Copilot
- BSD n8n AI Studio = n8n의 공식 AI Copilot
- 초보자 진입 장벽 완전 제거
- 자동화 구축 시간 95% 단축

### Year 2: Multi-Platform Support
- Zapier, Make.com, Integromat 지원
- 플랫폼 자동 선택 (비용/기능 최적화)
- 크로스 플랫폼 마이그레이션

### Year 3: AI Automation OS
- 자연어로 모든 자동화 제어
- 자동화 간 연결 (워크플로우의 워크플로우)
- 비즈니스 프로세스 완전 자동화

---

## 📝 Technical Requirements

### Development Environment
- Node.js 20+
- npm/pnpm/yarn
- Docker (n8n local instance)
- PostgreSQL 15+
- Redis 7+

### External Services
- OpenAI API (GPT-4, GPT-4V)
- Anthropic API (Claude 3)
- n8n Instance (local or cloud)
- Playwright (browser automation)

### Deployment
- **Frontend**: Vercel / Netlify
- **Backend**: Railway / Render / Fly.io
- **Database**: Supabase / Neon
- **Cache**: Upstash Redis
- **Monitoring**: Sentry, PostHog

---

## 🎉 Conclusion

**BSD n8n AI Dev Studio**는 단순한 n8n 래퍼가 아닙니다.

이것은:
- 🤖 AI가 자동화를 대신 만들어주는 **AI 개발자**
- 🔍 화면을 보고 스스로 디버깅하는 **자가 치유 시스템**
- 📚 사용할수록 똑똑해지는 **학습하는 플랫폼**
- 🚀 노코드 자동화 시장의 **게임 체인저**

**초보자는**: "아이디어만 말하면 끝"
**개발자는**: "코드 대신 자연어로 개발"
**비즈니스는**: "자동화 OS 시장의 파운더"

Let's build the future of automation! 🚀
