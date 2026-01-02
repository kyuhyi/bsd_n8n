# n8n 워크플로우 수정 가이드

## 🎯 문제 해결 방법 3가지

---

### 방법 1: 자동 스크립트 실행 (가장 빠름)

1. **n8n API 키 확인**
   - n8n 관리 페이지 → Settings → API → API Key 생성
   - API 키 복사

2. **환경변수 설정**
   ```bash
   # Windows (PowerShell)
   $env:N8N_URL="https://bsd.ai.kr"
   $env:N8N_API_KEY="your-api-key-here"

   # macOS/Linux
   export N8N_URL="https://bsd.ai.kr"
   export N8N_API_KEY="your-api-key-here"
   ```

3. **스크립트 실행**
   ```bash
   cd bsd-n8n-ai-studio
   node scripts/fix-n8n-workflow.js
   ```

4. **완료!** 워크플로우가 자동으로 수정되고 활성화됩니다.

---

### 방법 2: JSON 파일 수동 Import (권장)

1. **n8n 관리 페이지 접속**
   - https://bsd.ai.kr 로그인

2. **기존 워크플로우 삭제 (선택사항)**
   - Workflows 탭 클릭
   - "퍼널형 랜딩페이지 자동알림" 워크플로우 찾기
   - 우클릭 → Delete (또는 수정할 예정이면 열어두기)

3. **새 워크플로우 Import**
   - 좌측 상단 메뉴 → Workflows → Import from File
   - `n8n-workflow-simple.json` 파일 선택
   - Import 클릭

4. **워크플로우 확인**
   - Webhook 노드 클릭
   - Path가 `landing-form`인지 확인
   - Test URL 복사: `https://bsd.ai.kr/webhook-test/[id]/landing-form`

5. **워크플로우 활성화**
   - 우측 상단 "Inactive" 스위치를 "Active"로 변경
   - Save 클릭

6. **테스트**
   ```bash
   curl -X POST https://bsd.ai.kr/webhook/landing-form \
     -H "Content-Type: application/json" \
     -d '{"name":"테스트","email":"test@example.com","phone":"010-1234-5678"}'
   ```

   성공 응답 예시:
   ```json
   {
     "success": true,
     "message": "구독 신청이 완료되었습니다",
     "data": {
       "name": "테스트",
       "email": "test@example.com",
       "phone": "010-1234-5678",
       "receivedAt": "2026-01-02T08:25:00.000Z"
     }
   }
   ```

---

### 방법 3: 기존 워크플로우 수동 수정

#### A. Webhook 노드 수정

1. 기존 워크플로우 열기
2. Webhook 노드 클릭
3. 설정 변경:
   ```
   HTTP Method: POST
   Path: landing-form
   Response Mode: When Last Node Finishes (또는 Last Node)
   ```

#### B. Code 노드 추가/수정

Webhook 노드 다음에 Code 노드를 추가하고 다음 코드 입력:

```javascript
// 안전한 데이터 추출
const inputData = $input.item.json;
const body = inputData.body || inputData;

// 로그 출력 (디버깅용)
console.log('받은 데이터:', body);

// 데이터 검증
const name = body.name || '';
const email = body.email || '';
const phone = body.phone || '';

if (!name || !email) {
  throw new Error('이름과 이메일은 필수입니다');
}

// 정제된 데이터 반환
return {
  success: true,
  message: '구독 신청이 완료되었습니다',
  data: {
    name: name,
    email: email,
    phone: phone,
    timestamp: body.timestamp || new Date().toISOString(),
    source: body.source || 'n8n-ai-studio'
  }
};
```

#### C. 연결 확인

- Webhook → Code 노드 연결되어 있는지 확인
- 다른 노드(Slack, Email 등)가 있다면 Code 노드 뒤에 연결
- 저장 및 활성화

---

## 🧪 테스트 방법

### 1. n8n 내부 테스트

1. 워크플로우에서 "Execute Workflow" 클릭
2. Webhook 노드의 "Listen for Test Event" 클릭
3. 새 터미널에서:
   ```bash
   curl -X POST https://bsd.ai.kr/webhook-test/[workflow-id]/landing-form \
     -H "Content-Type: application/json" \
     -d '{"name":"테스트","email":"test@example.com","phone":"010-1234-5678"}'
   ```
4. n8n에서 실행 결과 확인

### 2. 프로덕션 테스트

워크플로우 활성화 후:

```bash
curl -X POST https://bsd.ai.kr/webhook/landing-form \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동","email":"hong@example.com","phone":"010-9876-5432"}'
```

### 3. 웹 인터페이스 테스트

1. http://localhost:3000 접속
2. "n8n 소식 받기" 버튼 클릭
3. 폼 작성 후 "구독 신청하기" 클릭
4. 성공 메시지 확인
5. n8n에서 실행 로그 확인

---

## 📝 제공된 파일

1. **n8n-workflow-simple.json**
   - 가장 간단한 버전
   - Webhook + Code 노드만
   - 바로 작동 보장

2. **n8n-workflow-fixed.json**
   - Slack 알림 포함
   - Slack credential 설정 필요
   - 프로덕션 레벨

3. **scripts/fix-n8n-workflow.js**
   - 자동 수정 스크립트
   - API 키만 있으면 원클릭 수정

---

## ⚠️ 문제 해결

### 여전히 500 에러가 발생한다면?

1. **n8n 실행 로그 확인**
   - Workflows → Executions 탭
   - 실패한 실행 클릭
   - 오류 메시지 확인

2. **Webhook Path 확인**
   - Webhook 노드의 Path가 정확히 `landing-form`인지 확인
   - 대소문자 구분 주의

3. **Response Mode 확인**
   - "When Last Node Finishes" 또는 "Last Node" 선택
   - "On Received"는 사용하지 않기

4. **데이터 형식 로그 확인**
   - Code 노드의 `console.log` 출력 확인
   - n8n 로그에서 실제 받은 데이터 형식 확인

### Slack 알림이 작동하지 않는다면?

- n8n-workflow-simple.json 사용 (Slack 없는 버전)
- 나중에 Slack 노드는 별도로 추가

---

## 🎉 완료 확인

다음이 모두 작동하면 성공:

✅ curl 테스트에서 200 OK 응답
✅ n8n 실행 로그에 성공 기록
✅ 웹 인터페이스에서 "구독 신청이 완료되었습니다" 메시지
✅ 500 에러 없음

---

**도움이 필요하시면 n8n 실행 로그의 에러 메시지를 공유해주세요!**
