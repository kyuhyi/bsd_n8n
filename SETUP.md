# BSD n8n AI Dev Studio - 설치 및 실행 가이드

## 🚀 빠른 시작 (5분 안에 실행)

### 1단계: 프로젝트 준비

프로젝트가 이미 생성되었으므로 바로 환경 설정으로 이동합니다.

### 2단계: 환경 변수 설정

\`\`\`bash
cd bsd-n8n-ai-studio

# 환경 변수 파일 생성
cp .env.example .env.local
\`\`\`

`.env.local` 파일을 열고 다음 값들을 입력하세요:

\`\`\`env
# OpenAI API Key (필수)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic API Key (선택사항)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# n8n 설정 (Local 테스트용)
N8N_INSTANCE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3단계: n8n 로컬 실행

별도 터미널에서 n8n을 실행하세요:

**방법 A: Docker 사용 (권장)**
\`\`\`bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_API_KEY=test-api-key-12345 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
\`\`\`

**방법 B: npx 사용**
\`\`\`bash
npx n8n
\`\`\`

n8n이 실행되면:
1. 브라우저에서 http://localhost:5678 열기
2. 계정 생성 (처음 실행 시)
3. Settings → API → API Key 생성
4. 생성된 API Key를 `.env.local`에 입력

### 4단계: 개발 서버 실행

\`\`\`bash
# 의존성이 이미 설치되어 있으므로 바로 실행
npm run dev
\`\`\`

### 5단계: 접속

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

🎉 **완료!** 이제 BSD n8n AI Dev Studio를 사용할 수 있습니다.

---

## 📝 첫 번째 워크플로우 만들기

### 예제 1: Gmail → Slack 알림

1. 채팅 인터페이스에 입력:
   \`\`\`
   Gmail에 신규 메일 오면 슬랙으로 전송해줘
   \`\`\`

2. AI가 자동으로 분석하고 워크플로우 생성

3. "생성하기" 버튼 클릭

4. n8n에서 워크플로우 확인

### 예제 2: 스케줄 리포트

1. 입력:
   \`\`\`
   매일 아침 9시에 어제 매출을 슬랙으로 리포트해줘
   \`\`\`

2. AI가 자동으로:
   - Schedule Trigger 노드 생성
   - 데이터 집계 로직 추가
   - Slack 전송 노드 연결

### 예제 3: 복잡한 워크플로우

1. 입력:
   \`\`\`
   쇼핑몰 주문이 들어오면:
   1. 구글 시트에 주문 내역 기록
   2. 재고 확인
   3. 재고 부족하면 슬랙 알림
   4. 고객에게 카카오톡 발송
   \`\`\`

2. AI가 조건부 로직과 여러 액션을 자동으로 구성

---

## 🛠️ API Keys 획득 방법

### OpenAI API Key

1. [OpenAI Platform](https://platform.openai.com) 접속
2. 로그인/회원가입
3. API Keys → Create new secret key
4. 생성된 키를 복사하여 `.env.local`에 입력

**비용**: 사용량에 따라 과금 (GPT-4 사용 시 약 $0.03/1K tokens)

### Anthropic API Key (선택사항)

1. [Anthropic Console](https://console.anthropic.com) 접속
2. 로그인/회원가입
3. API Keys → Create Key
4. 생성된 키를 복사

**비용**: 사용량에 따라 과금

---

## 🔧 고급 설정

### n8n Cloud 사용

로컬 n8n 대신 n8n Cloud 사용 시:

1. [n8n.cloud](https://n8n.cloud) 가입
2. API Key 생성
3. `.env.local` 수정:
   \`\`\`env
   N8N_INSTANCE_URL=https://your-instance.app.n8n.cloud
   N8N_API_KEY=your-cloud-api-key
   \`\`\`

### PostgreSQL 연동 (선택사항)

워크플로우 템플릿 저장용 DB 연동:

\`\`\`bash
# Docker로 PostgreSQL 실행
docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bsd_n8n_studio \
  -p 5432:5432 \
  -d postgres:15

# .env.local에 추가
DATABASE_URL=postgresql://postgres:password@localhost:5432/bsd_n8n_studio
\`\`\`

### Playwright 브라우저 설치

AI Vision 디버깅 사용 시 필요:

\`\`\`bash
npx playwright install chromium
\`\`\`

---

## 🐛 문제 해결

### npm install 실패

\`\`\`bash
# 캐시 정리
npm cache clean --force

# 재설치
rm -rf node_modules package-lock.json
npm install
\`\`\`

### n8n 연결 실패

1. n8n이 실행 중인지 확인: http://localhost:5678
2. API Key가 올바른지 확인
3. CORS 오류 시 n8n 재시작

### OpenAI API 오류

1. API Key가 유효한지 확인
2. 크레딧이 충분한지 확인
3. Rate limit 오류 시 잠시 대기

---

## 📦 프로덕션 배포

### Vercel 배포

\`\`\`bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add OPENAI_API_KEY
vercel env add N8N_INSTANCE_URL
vercel env add N8N_API_KEY
\`\`\`

### Railway 배포

1. [Railway](https://railway.app) 가입
2. GitHub 리포지토리 연결
3. 환경 변수 설정
4. 자동 배포

### Docker 배포

\`\`\`bash
# Dockerfile 생성 (추후 제공)
docker build -t bsd-n8n-ai-studio .
docker run -p 3000:3000 bsd-n8n-ai-studio
\`\`\`

---

## 🎯 다음 단계

1. **템플릿 라이브러리** 확장
2. **데이터베이스** 연동으로 워크플로우 영구 저장
3. **사용자 인증** 추가
4. **팀 협업** 기능 구현
5. **워크플로우 마켓플레이스** 구축

---

## 💡 팁

### 더 나은 AI 분석을 위한 입력 방법

✅ **좋은 예시:**
- "Gmail 신규 메일 → Slack #알림 채널로 전송"
- "쇼핑몰 주문 시 구글 시트에 주문번호, 고객명, 금액 기록"
- "매일 9시에 어제 가입자 수를 집계해서 Notion에 저장"

❌ **나쁜 예시:**
- "자동화 만들어줘" (구체적이지 않음)
- "데이터 처리" (어떤 데이터인지 불명확)
- "알림 보내기" (트리거와 대상 불명확)

### 성능 최적화

- API 호출 최소화: 비슷한 요청은 캐싱
- n8n 워크플로우 최적화: 불필요한 노드 제거
- Playwright 사용 최소화: 로그 기반 디버깅 우선

---

**문제가 있으신가요?**
[GitHub Issues](https://github.com/yourusername/bsd-n8n-ai-studio/issues)에 등록해주세요!
