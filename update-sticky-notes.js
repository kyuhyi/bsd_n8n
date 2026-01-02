const https = require('https');

const N8N_URL = 'bsd.ai.kr';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWQwNDBiMy03NjYwLTRhMTAtOWY2My04YTNlYTMzMjVkYWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MzQyMzYwfQ.qMyvvmaTNC1deM95TjBuB_dwE1tUXn2wkvIZHxAAsog';
const WORKFLOW_ID = 'UOLIO5KWqbKJHL2G';

console.log('📝 스티키 노트 업데이트 중...\n');

const getOptions = {
  hostname: N8N_URL,
  port: 443,
  path: `/api/v1/workflows/${WORKFLOW_ID}`,
  method: 'GET',
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Accept': 'application/json'
  }
};

const getReq = https.request(getOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => data += chunk);

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('❌ 오류:', res.statusCode);
      console.error(data);
      return;
    }

    const workflow = JSON.parse(data);

    console.log('📋 현재 워크플로우:', workflow.name);

    // 기존 스티키 노트 모두 제거
    console.log('\n🗑️  기존 스티키 노트 제거 중...');
    const oldStickyCount = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote').length;
    workflow.nodes = workflow.nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote');
    console.log(`   제거된 스티키 노트: ${oldStickyCount}개`);

    // 새로운 스티키 노트 추가
    console.log('\n✨ 새 스티키 노트 추가 중...\n');

    const newStickyNotes = [
      {
        parameters: {
          height: 380,
          width: 420,
          content: `## 📬 퍼널형 랜딩페이지 자동알림 시스템

**🎯 목적**: 웹사이트 방문자의 뉴스레터 구독 신청을 자동으로 처리

**✅ 완벽하게 작동하는 워크플로우**
- 웹훅 즉시 응답 (사용자 경험 최적화)
- 백그라운드 비동기 처리
- 에러 발생시에도 사용자는 성공 메시지 수신

**📅 최종 업데이트**: 2026-01-02
**🔧 상태**: ✅ 프로덕션 레디`
        },
        id: 'sticky-main-guide',
        name: '📌 메인 가이드',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [-600, 200]
      },
      {
        parameters: {
          height: 280,
          width: 350,
          content: `## 🔗 웹훅 설정

**URL**: https://bsd.ai.kr/webhook/landing-form

**설정**:
- HTTP Method: POST
- Path: landing-form
- Response Mode: On Received (즉시 응답)
- Response Code: 200

**응답 데이터**:
\`\`\`json
{
  "success": true,
  "message": "구독 신청이 완료되었습니다. 감사합니다!"
}
\`\`\`

✅ 사용자는 즉시 성공 메시지를 받습니다!`
        },
        id: 'sticky-webhook-config',
        name: '🔗 웹훅 설정',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [-600, 520]
      },
      {
        parameters: {
          height: 320,
          width: 350,
          content: `## 📊 Google Sheets 자동 저장

**문서 ID**: 1YMRIXQpEcMK2gQb5zU6XnDKLrHbbW7vKZ0iOe_V8Ozc
**시트명**: n8n 랜딩페이지

**저장 항목**:
- 신청날짜 (자동 생성)
- 이름
- 전화번호 (숫자만, 하이픈 없이)
- 이메일

**데이터 소스**: 웹훅에서 직접 참조
- name: \`{{ $json.name }}\`
- phone: \`{{ $json.phone }}\`
- email: \`{{ $json.email }}\`

✅ 실시간 스프레드시트 업데이트`
        },
        id: 'sticky-sheets-config',
        name: '📊 Google Sheets',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [50, 520]
      },
      {
        parameters: {
          height: 300,
          width: 350,
          content: `## 📧 Gmail 자동 발송

**받는 사람**: 신청자 이메일
**제목**: ✅ 신청이 완료되었습니다!

**본문 템플릿**:
{{ $json.name }}님, 안녕하세요!

신청해 주셔서 감사합니다.
신청이 정상적으로 완료되었습니다.

곧 연락드리겠습니다.

감사합니다.

**Credential**: Gmail account (OAuth2)

✅ 자동 확인 이메일 발송`
        },
        id: 'sticky-gmail-config',
        name: '📧 Gmail 설정',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [450, 520]
      },
      {
        parameters: {
          height: 320,
          width: 350,
          content: `## 📱 SMS 문자 발송 (Solapi)

**발신번호**: 01097482040
**받는 사람**: 웹훅 데이터의 전화번호

**문자 내용**:
{{ $node["랜딩페이지 폼 수신"].json["name"] }}님,
신청하신 AI 바이브코딩 비밀특강이
이메일로 전송되었습니다!

비밀특강 영상
https://www.bsdclass.co.kr/31

**Credential**: Solapi Key account

**데이터 참조**: 웹훅에서 직접
- To: \`{{ $node["랜딩페이지 폼 수신"].json["phone"] }}\`

✅ 즉시 SMS 알림 발송`
        },
        id: 'sticky-sms-config',
        name: '📱 SMS 설정',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [850, 520]
      },
      {
        parameters: {
          height: 400,
          width: 350,
          content: `## 🎯 워크플로우 실행 흐름

**1단계**: 웹훅 수신
   → 사용자가 폼 제출
   → 즉시 200 OK 응답 반환

**2단계**: 병렬 처리
   → Google Sheets 저장
   → ConvertKit 구독자 추가

**3단계**: 알림 발송 (병렬)
   → Gmail 확인 이메일
   → SMS 문자 발송

**핵심 특징**:
✅ 사용자는 즉시 성공 메시지 수신
✅ 백그라운드에서 비동기 처리
✅ 에러 발생해도 사용자 경험 유지
✅ 모든 노드 독립적으로 작동

**테스트 방법**:
\`\`\`bash
curl -X POST https://bsd.ai.kr/webhook/landing-form \\
  -H "Content-Type: application/json" \\
  -d '{"name":"홍길동","email":"test@example.com","phone":"01012345678"}'
\`\`\``
        },
        id: 'sticky-workflow-flow',
        name: '🎯 워크플로우 흐름',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [-600, 860]
      },
      {
        parameters: {
          height: 280,
          width: 350,
          content: `## 🌐 프론트엔드 연동

**웹사이트**: http://localhost:3000
**버튼**: "n8n 소식 받기" (Bell 아이콘)

**입력 폼**:
- 이름 (필수)
- 이메일 (필수, 이메일 형식)
- 전화번호 (필수, 10-11자리 숫자만)

**전화번호 처리**:
- 사용자가 하이픈 입력해도 자동 제거
- 숫자만 저장: 01012345678
- 최대 11자리

**제출 후**:
→ 즉시 "구독 신청이 완료되었습니다!" 표시
→ 2초 후 모달 자동 닫힘

✅ 완벽한 사용자 경험`
        },
        id: 'sticky-frontend',
        name: '🌐 프론트엔드',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [50, 860]
      },
      {
        parameters: {
          height: 320,
          width: 350,
          content: `## 🔐 필요한 Credentials

**1. Google Sheets OAuth2**
   - ID: U7Vt55tnZvJ8dySm
   - Name: Google Sheets account 3
   - 용도: 스프레드시트 데이터 저장

**2. Gmail OAuth2**
   - ID: RhzJ7XHmmtV2Upw4
   - Name: Gmail account
   - 용도: 확인 이메일 발송

**3. Solapi API Key**
   - ID: 69OvKQBQqqXcMvXj
   - Name: Solapi Key account
   - 용도: SMS 문자 발송

**4. ConvertKit API** (선택사항)
   - ID: xXe5lxnEOPnSpOkK
   - Name: ConvertKit account
   - 용도: 이메일 마케팅 리스트

✅ 모든 credential 설정 완료`
        },
        id: 'sticky-credentials',
        name: '🔐 Credentials',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [450, 860]
      },
      {
        parameters: {
          height: 260,
          width: 350,
          content: `## ✅ 완료된 최적화

**1. 웹훅 응답 최적화**
   ✅ 즉시 응답 (onReceived)
   ✅ Respond to Webhook 노드 제거
   ✅ 사용자 대기시간 제로

**2. SMS 노드 수정**
   ✅ 웹훅에서 직접 데이터 참조
   ✅ Google Sheets 의존성 제거
   ✅ 에러 해결 완료

**3. 프론트엔드 개선**
   ✅ 전화번호 자동 필터링 (숫자만)
   ✅ 실시간 검증
   ✅ 직관적인 UI/UX

**상태**: 🚀 프로덕션 배포 완료`
        },
        id: 'sticky-optimizations',
        name: '✅ 완료 사항',
        type: 'n8n-nodes-base.stickyNote',
        typeVersion: 1,
        position: [850, 860]
      }
    ];

    // 스티키 노트 추가
    workflow.nodes.push(...newStickyNotes);

    console.log('추가된 스티키 노트:');
    newStickyNotes.forEach(note => {
      console.log(`   ✅ ${note.name}`);
    });

    // 워크플로우 업데이트
    const updatePayload = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {}
    };

    const updateData = JSON.stringify(updatePayload);
    const updateOptions = {
      hostname: N8N_URL,
      port: 443,
      path: `/api/v1/workflows/${WORKFLOW_ID}`,
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateData)
      }
    };

    console.log('\n🔄 워크플로우 업데이트 중...\n');

    const updateReq = https.request(updateOptions, (updateRes) => {
      let updateResData = '';

      updateRes.on('data', (chunk) => updateResData += chunk);

      updateRes.on('end', () => {
        if (updateRes.statusCode === 200) {
          console.log('✅ 완료! 스티키 노트가 업데이트되었습니다.\n');
          console.log('📋 총 9개의 새로운 가이드 노트 추가:');
          console.log('   - 📌 메인 가이드');
          console.log('   - 🔗 웹훅 설정');
          console.log('   - 📊 Google Sheets');
          console.log('   - 📧 Gmail 설정');
          console.log('   - 📱 SMS 설정');
          console.log('   - 🎯 워크플로우 흐름');
          console.log('   - 🌐 프론트엔드');
          console.log('   - 🔐 Credentials');
          console.log('   - ✅ 완료 사항\n');
          console.log('💡 n8n 페이지를 새로고침하여 새 가이드를 확인하세요!');
        } else {
          console.error('❌ 업데이트 실패:', updateRes.statusCode);
          console.error(updateResData);
        }
      });
    });

    updateReq.on('error', (error) => {
      console.error('❌ 오류:', error.message);
    });

    updateReq.write(updateData);
    updateReq.end();
  });
});

getReq.on('error', (error) => {
  console.error('❌ 요청 오류:', error.message);
});

getReq.end();
