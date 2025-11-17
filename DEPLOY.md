# Vercel 배포 가이드

BSD n8n AI Dev Studio를 Vercel에 배포하는 방법입니다.

## 1. Vercel CLI 설치 (선택사항)

```bash
npm install -g vercel
```

## 2. Vercel에 배포

### 방법 1: Vercel CLI 사용

```bash
# 프로젝트 디렉토리에서
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: Vercel Dashboard 사용

1. https://vercel.com 에서 로그인
2. "New Project" 클릭
3. Git 저장소 연결 (GitHub, GitLab, Bitbucket)
4. 프로젝트 선택 후 "Import" 클릭
5. 자동으로 Next.js 감지 및 배포

## 3. 환경 변수 설정 (선택사항)

Vercel Dashboard → Settings → Environment Variables에서 설정:

### AI Provider API Keys (선택사항)
사용자가 UI에서 직접 입력할 수 있으므로 필수는 아닙니다.

- `OPENAI_API_KEY` - OpenAI API 키
- `XAI_API_KEY` - xAI (Grok) API 키
- `GEMINI_API_KEY` - Google Gemini API 키
- `ANTHROPIC_API_KEY` - Anthropic (Claude) API 키
- `DEEPSEEK_API_KEY` - DeepSeek API 키

### n8n 설정 (선택사항)
사용자가 Settings UI에서 설정하므로 필수는 아닙니다.

- `N8N_INSTANCE_URL` - n8n 인스턴스 URL
- `N8N_API_KEY` - n8n API 키

## 4. 배포 후 설정

1. 배포된 URL 확인 (예: `https://your-app.vercel.app`)
2. 브라우저에서 접속
3. Settings에서 AI Provider와 n8n 연결 정보 설정
4. 테스트 워크플로우 생성

## 5. 커스텀 도메인 설정 (선택사항)

Vercel Dashboard → Settings → Domains에서:
1. "Add Domain" 클릭
2. 도메인 입력 (예: `n8n.yourdomain.com`)
3. DNS 설정 안내에 따라 설정

## 6. 자동 배포 설정

Git 저장소와 연결하면:
- `main` 브랜치에 푸시할 때마다 자동 프로덕션 배포
- 다른 브랜치는 프리뷰 배포

## 문제 해결

### 빌드 오류
- Vercel Dashboard → Deployments → 실패한 배포 클릭 → 로그 확인

### 환경 변수 오류
- Settings → Environment Variables에서 변수 확인
- 변수 변경 후 재배포 필요 (Deployments → Redeploy)

### API 오류
- 브라우저 개발자 도구 → Network 탭에서 API 호출 확인
- API 키가 올바르게 설정되었는지 확인

## 성능 최적화

Vercel은 자동으로:
- Edge 캐싱
- 이미지 최적화
- 전 세계 CDN 배포

추가 최적화:
- `next.config.ts`에서 output: 'standalone' 설정 (이미 적용됨)
- 정적 페이지 최대한 활용

## 모니터링

Vercel Dashboard에서:
- Analytics: 트래픽 및 성능 모니터링
- Logs: 실시간 로그 확인
- Speed Insights: 페이지 로딩 속도 분석

## 지원

문제가 발생하면:
1. Vercel 문서: https://vercel.com/docs
2. Next.js 문서: https://nextjs.org/docs
3. 프로젝트 GitHub Issues
