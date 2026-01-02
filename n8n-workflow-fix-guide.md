# n8n 워크플로우 수정 가이드

## 문제 상황
- 웹훅 URL: `https://bsd.ai.kr/webhook/landing-form`
- 상태: 연결되지만 500 에러 발생 ("Error in workflow")
- 원인: 워크플로우가 받은 데이터를 처리하는 중 오류 발생

## 수정 방법

### 1. n8n 인스턴스 접속
1. n8n 관리 페이지 접속 (https://bsd.ai.kr 또는 로컬 인스턴스)
2. "퍼널형 랜딩페이지 자동알림" 워크플로우 열기

### 2. Webhook 노드 확인
Webhook 노드 설정에서:
- **HTTP Method**: POST
- **Path**: `/webhook/landing-form`
- **Response Mode**: "Respond Immediately" 또는 "When Last Node Finishes"
- **Response Data**: "First Entry JSON"

### 3. 수신 데이터 구조 확인
웹훅이 받는 데이터 형식:
```json
{
  "name": "사용자이름",
  "email": "이메일주소",
  "phone": "전화번호",
  "timestamp": "2026-01-02T08:22:15.000Z",
  "source": "n8n-ai-studio-newsletter"
}
```

### 4. 일반적인 오류 원인 및 해결

#### A. 필수 필드 누락 오류
워크플로우에서 특정 필드를 필수로 요구하는 경우:

**Function 노드 또는 IF 노드 추가:**
```javascript
// Function 노드에서 데이터 검증
const body = $input.item.json.body;

if (!body.name || !body.email || !body.phone) {
  throw new Error('필수 필드가 누락되었습니다');
}

return {
  json: {
    name: body.name,
    email: body.email,
    phone: body.phone,
    timestamp: body.timestamp || new Date().toISOString(),
    source: body.source || 'unknown'
  }
};
```

#### B. 데이터 매핑 오류
Webhook 노드 다음에 **Set 노드** 추가:
- `{{ $json.body.name }}` → `name`
- `{{ $json.body.email }}` → `email`
- `{{ $json.body.phone }}` → `phone`

#### C. 알림 노드 오류 (Slack, Email 등)
- Slack 노드: 웹훅 URL이 올바른지 확인
- Email 노드: SMTP 설정 확인
- 필드 매핑: `{{ $json.name }}`, `{{ $json.email }}` 등 올바른 경로 사용

### 5. 권장 워크플로우 구조

```
Webhook (POST /webhook/landing-form)
  ↓
Set 노드 (데이터 정리)
  ↓
IF 노드 (데이터 검증 - 선택사항)
  ↓
Slack/Email/Google Sheets 등 (알림 전송)
  ↓
Respond to Webhook (성공 응답)
```

### 6. 수정된 워크플로우 예시

#### Webhook 노드
- Method: POST
- Path: landing-form
- Response Code: 200
- Response Data: `{"success": true, "message": "구독 신청이 접수되었습니다"}`

#### Set 노드 (데이터 정리)
```json
{
  "name": "={{ $json.body.name }}",
  "email": "={{ $json.body.email }}",
  "phone": "={{ $json.body.phone }}",
  "timestamp": "={{ $json.body.timestamp }}",
  "source": "={{ $json.body.source }}"
}
```

#### Slack 노드 (알림)
메시지 템플릿:
```
🔔 새로운 n8n 소식 구독 신청

👤 이름: {{ $json.name }}
📧 이메일: {{ $json.email }}
📱 전화번호: {{ $json.phone }}
⏰ 신청시간: {{ $json.timestamp }}
📍 출처: {{ $json.source }}
```

### 7. 테스트 방법

1. n8n에서 워크플로우 활성화
2. 워크플로우 실행 목록에서 "Execute Workflow" 클릭
3. 테스트 데이터로 실행:
```json
{
  "body": {
    "name": "홍길동",
    "email": "test@example.com",
    "phone": "010-1234-5678",
    "timestamp": "2026-01-02T08:22:15.000Z",
    "source": "n8n-ai-studio-newsletter"
  }
}
```

4. 각 노드의 실행 결과 확인
5. 오류가 있다면 해당 노드 클릭하여 오류 메시지 확인

### 8. 디버깅 팁

- **Webhook 테스트 URL 사용**: n8n에서 제공하는 테스트 URL로 먼저 테스트
- **실행 로그 확인**: 워크플로우 실행 목록에서 실패한 실행 클릭
- **각 노드 출력 확인**: 각 노드를 클릭하여 INPUT/OUTPUT 데이터 확인
- **에러 메시지 읽기**: 에러 메시지에 어떤 필드나 값이 문제인지 나옴

## 빠른 해결책

만약 워크플로우 수정이 어렵다면, **새 워크플로우**를 만드는 것을 권장합니다:

1. n8n에서 새 워크플로우 생성
2. Webhook 노드 추가
3. Path를 `/webhook/newsletter-signup`으로 설정
4. 간단한 Slack 알림 노드만 추가
5. 새 웹훅 URL을 프론트엔드 코드에 업데이트

프론트엔드 코드 수정 위치:
- 파일: `src/components/NewsletterModal.tsx`
- 라인 32: `axios.post('https://bsd.ai.kr/webhook/newsletter-signup', ...)`
