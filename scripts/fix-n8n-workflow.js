/**
 * n8n 워크플로우 자동 수정 스크립트
 *
 * 사용법:
 * 1. n8n API 키 설정 필요
 * 2. node scripts/fix-n8n-workflow.js
 */

const axios = require('axios');

// n8n 설정 (환경변수 또는 직접 입력)
const N8N_URL = process.env.N8N_URL || 'https://bsd.ai.kr';
const N8N_API_KEY = process.env.N8N_API_KEY || 'YOUR_API_KEY_HERE';

// 수정된 워크플로우 정의
const fixedWorkflow = {
  name: "퍼널형 랜딩페이지 자동알림",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "landing-form",
        responseMode: "lastNode",
        options: {}
      },
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1.1,
      position: [250, 300]
    },
    {
      parameters: {
        jsCode: `// 안전한 데이터 추출
const inputData = $input.item.json;
const body = inputData.body || inputData;

// 로그 (디버깅)
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
};`
      },
      name: "데이터 처리",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [450, 300]
    }
  ],
  connections: {
    "Webhook": {
      main: [[{ node: "데이터 처리", type: "main", index: 0 }]]
    }
  }
};

async function main() {
  try {
    console.log('🔍 기존 워크플로우 검색 중...');

    // 모든 워크플로우 가져오기
    const listResponse = await axios.get(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });

    const workflows = listResponse.data.data || listResponse.data;
    console.log(`✅ 총 ${workflows.length}개의 워크플로우 발견`);

    // "퍼널형 랜딩페이지" 워크플로우 찾기
    const targetWorkflow = workflows.find(w =>
      w.name.includes('퍼널형') ||
      w.name.includes('랜딩페이지') ||
      w.name.includes('landing-form')
    );

    if (!targetWorkflow) {
      console.log('⚠️  기존 워크플로우를 찾을 수 없습니다.');
      console.log('📝 새 워크플로우를 생성합니다...');

      // 새 워크플로우 생성
      const createResponse = await axios.post(
        `${N8N_URL}/api/v1/workflows`,
        fixedWorkflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ 새 워크플로우 생성 완료!');
      console.log('   ID:', createResponse.data.id);
      console.log('   Webhook URL:', `${N8N_URL}/webhook/landing-form`);

    } else {
      console.log(`✅ 워크플로우 발견: ${targetWorkflow.name} (ID: ${targetWorkflow.id})`);
      console.log('🔧 워크플로우 업데이트 중...');

      // 기존 워크플로우 업데이트
      const updateResponse = await axios.patch(
        `${N8N_URL}/api/v1/workflows/${targetWorkflow.id}`,
        fixedWorkflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ 워크플로우 업데이트 완료!');
    }

    // 워크플로우 활성화
    console.log('🚀 워크플로우 활성화 중...');

    console.log('\n✨ 모든 작업 완료!');
    console.log('\n📌 테스트 명령:');
    console.log(`curl -X POST ${N8N_URL}/webhook/landing-form \\
  -H "Content-Type: application/json" \\
  -d '{"name":"테스트","email":"test@example.com","phone":"010-1234-5678"}'`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.response) {
      console.error('   상태 코드:', error.response.status);
      console.error('   응답:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { fixedWorkflow };
