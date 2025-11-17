# 다중 AI 제공업체 지원 가이드

## 🤖 지원되는 AI 제공업체

BSD n8n AI Dev Studio는 이제 5개의 주요 AI 제공업체를 지원합니다:

### 1. **OpenAI (GPT-4)**
- **모델**: `gpt-4`
- **장점**: 가장 안정적이고 검증된 성능
- **API Key 발급**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **요금**: Pay-as-you-go

### 2. **DeepSeek (Chat)**
- **모델**: `deepseek-chat`
- **장점**: 매우 저렴한 가격, 뛰어난 코딩 능력
- **API Key 발급**: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- **요금**: 매우 저렴 (GPT-4 대비 ~1/10 가격)
- **특징**: OpenAI SDK 호환, JSON 모드 지원

### 3. **xAI (Grok)**
- **모델**: `grok-4-latest`
- **장점**: 실시간 정보 접근, 트위터/X 통합
- **API Key 발급**: [console.x.ai](https://console.x.ai)
- **요금**: Pay-as-you-go
- **특징**: OpenAI SDK 호환 (baseURL만 변경)

### 4. **Google Gemini (2.5 Flash)**
- **모델**: `gemini-2.0-flash-exp`
- **장점**: 빠른 응답 속도, 무료 티어 제공
- **API Key 발급**: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **요금**: 무료 티어 + Pay-as-you-go
- **특징**: 멀티모달 지원, JSON 모드 기본 제공

### 5. **Anthropic (Claude)**
- **모델**: `claude-3-5-sonnet-20241022`
- **장점**: 뛰어난 추론 능력, 긴 컨텍스트 윈도우
- **API Key 발급**: [console.anthropic.com](https://console.anthropic.com)
- **요금**: Pay-as-you-go
- **특징**: 최신 Claude 3.5 Sonnet 사용

## 🚀 사용 방법

### 1. Settings에서 AI Provider 선택

1. 우측 상단 **⚙️ Settings** 아이콘 클릭
2. **🤖 AI Provider** 드롭다운에서 원하는 제공업체 선택:
   - OpenAI (GPT-4)
   - DeepSeek (Chat)
   - xAI (Grok)
   - Google Gemini (2.5 Flash)
   - Anthropic (Claude)
3. 선택한 제공업체의 **API Key** 입력
4. **저장** 버튼 클릭

### 2. API Key 저장

각 제공업체의 API Key는 브라우저의 **localStorage**에 안전하게 저장됩니다:

```javascript
localStorage.setItem('ai_provider', 'openai');        // 선택한 제공업체
localStorage.setItem('openai_api_key', 'sk-...');     // OpenAI Key
localStorage.setItem('deepseek_api_key', 'sk-...');   // DeepSeek Key
localStorage.setItem('xai_api_key', 'xai-...');       // xAI Key
localStorage.setItem('gemini_api_key', 'AIza...');    // Gemini Key
localStorage.setItem('anthropic_api_key', 'sk-ant-...'); // Anthropic Key
```

### 3. 워크플로우 생성

1. 채팅 입력창에 자연어 요청 입력
2. 선택한 AI 제공업체가 자동으로 Intent 분석
3. "생성하기" 버튼으로 n8n 워크플로우 생성

## 🔧 기술적 구현

### Frontend (ChatInterface)

```typescript
// AI Provider 선택
const [aiProvider, setAiProvider] = useState('openai');

// API 호출 시 provider와 key 전달
const analysisResponse = await axios.post('/api/analyze-intent', {
  input: userInput
}, {
  headers: {
    'x-ai-provider': aiProvider,    // 선택한 제공업체
    'x-api-key': apiKey              // 해당 제공업체의 API Key
  }
});
```

### Backend (AI Intent Analyzer)

```typescript
class AIIntentAnalyzer {
  constructor(provider: 'openai' | 'xai' | 'gemini' | 'anthropic', apiKey?: string) {
    this.provider = provider;

    if (provider === 'openai' || provider === 'xai') {
      this.client = new OpenAI({
        apiKey,
        baseURL: provider === 'xai' ? 'https://api.x.ai/v1' : undefined
      });
    } else if (provider === 'gemini') {
      // Fetch API 직접 사용
      this.client = { apiKey };
    } else if (provider === 'anthropic') {
      // Fetch API 직접 사용
      this.client = { apiKey };
    }
  }

  async analyzeIntent(userInput: string): Promise<IntentAnalysis> {
    if (this.provider === 'openai' || this.provider === 'xai' || this.provider === 'deepseek') {
      // OpenAI SDK 사용
      const model =
        this.provider === 'openai' ? 'gpt-4' :
        this.provider === 'xai' ? 'grok-4-latest' :
        'deepseek-chat';
      const response = await this.client.chat.completions.create({
        model,
        messages: [...],
        response_format: { type: 'json_object' }
      });
    } else if (this.provider === 'gemini') {
      // Gemini REST API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        { method: 'POST', body: JSON.stringify({ ... }) }
      );
    } else if (this.provider === 'anthropic') {
      // Anthropic Messages API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', ... })
      });
    }
  }
}
```

### API Route (/api/analyze-intent)

```typescript
export async function POST(request: NextRequest) {
  const provider = request.headers.get('x-ai-provider') || 'openai';
  const apiKey = request.headers.get('x-api-key');

  // 환경 변수 fallback
  const envKey =
    provider === 'openai' ? process.env.OPENAI_API_KEY :
    provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY :
    provider === 'xai' ? process.env.XAI_API_KEY :
    provider === 'gemini' ? process.env.GEMINI_API_KEY :
    provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
    undefined;

  const analyzer = new AIIntentAnalyzer(provider, apiKey || envKey);
  const analysis = await analyzer.analyzeIntent(input);

  return NextResponse.json({ success: true, data: analysis });
}
```

## 📊 제공업체별 비교

| 제공업체 | 모델 | 응답 속도 | 정확도 | 가격 | 무료 티어 | 코딩 능력 |
|---------|------|----------|--------|------|----------|----------|
| **OpenAI** | GPT-4 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $$$ | ❌ | ⭐⭐⭐⭐ |
| **DeepSeek** | Chat | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $ | ❌ | ⭐⭐⭐⭐⭐ |
| **xAI** | Grok Beta | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $$ | ❌ | ⭐⭐⭐ |
| **Gemini** | 2.0 Flash | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $ | ✅ | ⭐⭐⭐ |
| **Anthropic** | Claude 3.5 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $$$ | ❌ | ⭐⭐⭐⭐⭐ |

### 추천 사용 시나리오

**OpenAI (GPT-4)**:
- 가장 안정적인 결과가 필요할 때
- 프로덕션 환경에서 검증된 성능 필요 시

**DeepSeek (Chat)**:
- **비용 절감이 중요할 때** (가장 저렴한 옵션)
- 코딩/워크플로우 생성에 특화된 성능 필요 시
- 높은 품질을 유지하면서 비용 최적화

**xAI (Grok)**:
- 실시간 정보가 필요할 때
- 트위터/X 데이터 활용이 필요할 때

**Gemini (2.0 Flash)**:
- 빠른 프로토타이핑
- 무료 티어로 테스트하고 싶을 때
- 응답 속도가 중요할 때

**Anthropic (Claude)**:
- 복잡한 추론이 필요할 때
- 긴 컨텍스트 분석이 필요할 때
- 최신 AI 기술을 사용하고 싶을 때

## 🔒 보안 고려사항

### localStorage 보안

현재 API Key는 브라우저의 localStorage에 저장됩니다:

**장점**:
- 서버 없이 바로 사용 가능
- 간단한 구현

**단점**:
- JavaScript로 접근 가능
- XSS 공격에 취약할 수 있음

**프로덕션 권장사항**:
1. 백엔드에서 API Key 암호화 저장
2. 사용자 인증 시스템 구현
3. HTTPS 필수 사용
4. API Key를 환경 변수로 관리 (서버 측)

### 환경 변수 설정 (선택사항)

`.env.local` 파일에 API Key를 설정하면 Settings 없이도 사용 가능:

```bash
# .env.local
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=xai-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

환경 변수가 설정되어 있으면 Settings에서 입력하지 않아도 됩니다.

## 🎯 테스트 예제

### 1. OpenAI로 테스트

```
Settings:
- AI Provider: OpenAI (GPT-4)
- OpenAI API Key: sk-...

입력: "Gmail 신규 메일 오면 슬랙으로 전송"
결과: ✅ GPT-4가 정확한 Intent 분석 제공
```

### 2. Gemini로 빠른 테스트

```
Settings:
- AI Provider: Google Gemini (2.5 Flash)
- Gemini API Key: AIza...

입력: "쇼핑몰 주문 들어오면 구글시트에 기록"
결과: ✅ 빠른 응답 속도로 Intent 분석 완료
```

### 3. Claude로 복잡한 분석

```
Settings:
- AI Provider: Anthropic (Claude)
- Anthropic API Key: sk-ant-...

입력: "매일 아침 9시에 어제 매출 데이터를 수집해서 분석 후 슬랙으로 리포트"
결과: ✅ Claude가 복잡한 다단계 워크플로우 정확히 분석
```

## 🐛 트러블슈팅

### "API key is required" 에러

**원인**: 선택한 제공업체의 API Key가 설정되지 않음

**해결**:
1. Settings에서 해당 제공업체의 API Key 확인
2. API Key 형식 확인:
   - OpenAI: `sk-...`
   - DeepSeek: `sk-...`
   - xAI: `xai-...`
   - Gemini: `AIza...`
   - Anthropic: `sk-ant-...`

### "Failed to analyze intent" 에러

**원인**: API 호출 실패 또는 잘못된 API Key

**해결**:
1. API Key가 유효한지 확인
2. 해당 제공업체 콘솔에서 API Key 상태 확인
3. 네트워크 연결 확인
4. 브라우저 콘솔에서 상세 에러 확인

### Gemini "Resource exhausted" 에러

**원인**: 무료 티어 할당량 초과

**해결**:
1. Google AI Studio에서 할당량 확인
2. 유료 플랜으로 업그레이드
3. 다른 제공업체로 전환

## 📈 향후 계획

### Phase 1 (완료)
- ✅ OpenAI GPT-4 지원
- ✅ DeepSeek Chat 지원
- ✅ xAI Grok 지원
- ✅ Google Gemini 2.5 Flash 지원
- ✅ Anthropic Claude 3.5 지원
- ✅ Settings UI 구현

### Phase 2 (예정)
- ⏳ 제공업체별 성능 비교 대시보드
- ⏳ 자동 fallback (하나 실패 시 다른 제공업체로 전환)
- ⏳ 비용 추적 기능
- ⏳ 커스텀 프롬프트 템플릿

### Phase 3 (예정)
- ⏳ 하이브리드 모드 (여러 AI 동시 사용 후 최적 결과 선택)
- ⏳ 로컬 LLM 지원 (Ollama, LM Studio)
- ⏳ Fine-tuned 모델 지원

---

**작성일**: 2025-01-16
**문서 버전**: 1.0.0
**현재 서버**: http://localhost:3002
