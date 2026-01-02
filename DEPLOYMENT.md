# 🚀 BSD n8n AI Studio - Vercel 배포 가이드

## 📋 배포 전 체크리스트

- ✅ Node.js 18+ 설치
- ✅ Git 설치
- ✅ Vercel 계정 생성
- ✅ GitHub/GitLab 레포지토리 준비

## 🔧 1단계: 프로젝트 준비

### Git 초기화 (아직 안 했다면)

```bash
cd bsd-n8n-ai-studio
git init
git add .
git commit -m "Initial commit: BSD n8n AI Studio"
```

### GitHub에 푸시

```bash
# GitHub에서 새 레포지토리 생성 후
git remote add origin https://github.com/your-username/bsd-n8n-ai-studio.git
git branch -M main
git push -u origin main
```

## 🚀 2단계: Vercel 배포

### 방법 1: Vercel CLI (권장)

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 디렉토리에서 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: Vercel 대시보드

1. [vercel.com](https://vercel.com) 접속 및 로그인
2. **"New Project"** 클릭
3. GitHub 레포지토리 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. **"Deploy"** 클릭

## 🔐 3단계: 환경 변수 설정

Vercel 대시보드에서 **Settings > Environment Variables** 이동:

### 선택사항: AI Provider API Keys

사용자가 UI에서 직접 입력할 수 있으므로 선택사항입니다.
서버 측 기본값을 원한다면 설정하세요:

```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=xai-...
```

### 선택사항: n8n 설정

```
N8N_INSTANCE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key
```

### Next.js 설정

```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

## ✅ 4단계: 배포 확인

1. Vercel이 자동으로 빌드 시작
2. 빌드 로그 확인
3. 배포 완료 후 URL 확인
4. 웹사이트 접속하여 테스트

## 🔄 자동 배포 설정

Vercel은 자동으로 다음을 수행합니다:

- ✅ `main` 브랜치에 푸시하면 자동 프로덕션 배포
- ✅ 다른 브랜치에 푸시하면 프리뷰 배포
- ✅ Pull Request마다 미리보기 URL 생성

## 🛠 배포 후 설정

### 1. Settings에서 AI Provider 설정

웹사이트 접속 후:
1. 우측 상단 **⚙️ Settings** 클릭
2. **AI Provider** 선택 (OpenAI, Gemini, DeepSeek 등)
3. **API Key** 입력
4. **저장**

### 2. n8n 인스턴스 연결

1. Settings > **n8n Instance URL** 입력
2. **n8n API Key** 입력
3. **저장**

## 🎯 기능 테스트

### 1. 뉴스레터 구독 테스트

- "n8n 소식 받기" 버튼 클릭
- 이름, 이메일, 전화번호 입력
- 구독 신청 → 성공 메시지 확인

### 2. 워크플로우 생성 테스트

- 자연어로 워크플로우 요청
- 예: "Gmail에 신규 메일 오면 슬랙으로 전송"
- AI가 자동으로 워크플로우 생성
- 각 노드마다 한국어 스티키 노트 자동 생성 확인

### 3. n8n 배포 테스트

- 생성된 워크플로우 n8n에 배포
- n8n 인스턴스에서 워크플로우 확인

## 🐛 문제 해결

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
npm run build

# 빌드 오류 수정 후
git add .
git commit -m "Fix build errors"
git push
```

### 환경 변수 문제

- Vercel 대시보드에서 Environment Variables 재확인
- 변수 저장 후 프로젝트 재배포 필요

### API 오류

- AI Provider API 키 유효성 확인
- API 할당량 확인
- n8n 인스턴스 연결 확인

## 📊 성능 최적화

### 이미 적용된 최적화

- ✅ Next.js 16 App Router
- ✅ Server Components
- ✅ 이미지 최적화
- ✅ Code Splitting
- ✅ Edge Functions

### 추가 최적화 옵션

```javascript
// next.config.mjs
export default {
  images: {
    domains: ['your-cdn.com'],
  },
  experimental: {
    optimizeCss: true,
  },
};
```

## 🌐 커스텀 도메인 설정

Vercel 대시보드에서:

1. **Settings > Domains** 이동
2. 커스텀 도메인 추가
3. DNS 설정 업데이트:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21`
4. SSL 자동 발급 (무료)

## 📝 업데이트 배포

```bash
# 코드 수정 후
git add .
git commit -m "Update: 새로운 기능 추가"
git push

# Vercel이 자동으로 배포 시작
```

## 🎉 완료!

배포가 완료되었습니다! 🚀

- **프로덕션 URL**: https://your-project.vercel.app
- **관리 대시보드**: https://vercel.com/dashboard
- **Analytics**: Vercel 대시보드에서 확인

---

## 📞 지원

문제가 발생하면:
- Vercel 문서: https://vercel.com/docs
- Next.js 문서: https://nextjs.org/docs
- GitHub Issues: 프로젝트 레포지토리
