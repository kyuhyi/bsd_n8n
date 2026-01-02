const https = require('https');

const N8N_URL = 'bsd.ai.kr';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWQwNDBiMy03NjYwLTRhMTAtOWY2My04YTNlYTMzMjVkYWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MzQyMzYwfQ.qMyvvmaTNC1deM95TjBuB_dwE1tUXn2wkvIZHxAAsog';
const WORKFLOW_ID = 'UOLIO5KWqbKJHL2G';

console.log('🔧 워크플로우 정보 확인 중...\n');

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

    console.log('📋 현재 워크플로우 구조:\n');
    console.log('이름:', workflow.name);
    console.log('ID:', workflow.id);
    console.log('활성화:', workflow.active);
    console.log('\n노드 목록:');

    workflow.nodes.forEach(node => {
      console.log(`  - ${node.name} (${node.type})`);
      if (node.type === 'n8n-nodes-base.webhook') {
        console.log('    📍 Webhook 설정:');
        console.log('       path:', node.parameters.path);
        console.log('       httpMethod:', node.parameters.httpMethod);
        console.log('       responseMode:', node.parameters.responseMode || '설정 안됨');
        console.log('       responseData:', node.parameters.responseData || '설정 안됨');
      }
    });

    console.log('\n연결 구조:');
    Object.entries(workflow.connections).forEach(([from, connections]) => {
      console.log(`  ${from} →`, connections.main[0].map(c => c.node).join(', '));
    });

    // 수정할 워크플로우 만들기
    const webhookNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
    const dataNode = workflow.nodes.find(n => n.name === '데이터 검증');

    console.log('\n\n💡 해결 방법:');
    console.log('현재 웹훅이 "데이터 검증" 노드의 응답을 기다리고 있지만,');
    console.log('그 뒤의 ConvertKit, SMS 노드에서 에러가 발생하고 있습니다.\n');

    console.log('✅ 해결책: 데이터 검증 노드가 바로 응답하도록 설정\n');

    // Webhook 파라미터 수정
    if (webhookNode) {
      webhookNode.parameters.responseMode = 'lastNode';
      delete webhookNode.parameters.responseData;
      delete webhookNode.parameters.responseCode;
    }

    // 워크플로우 업데이트용 최소 데이터 (active는 read-only)
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

    console.log('🔄 워크플로우 업데이트 중...\n');

    const updateReq = https.request(updateOptions, (updateRes) => {
      let updateResData = '';

      updateRes.on('data', (chunk) => updateResData += chunk);

      updateRes.on('end', () => {
        if (updateRes.statusCode === 200) {
          console.log('✅ 성공! 워크플로우가 수정되었습니다.\n');
          console.log('📋 이제 테스트해보세요:');
          console.log('\n1. 웹 인터페이스에서 "n8n 소식 받기" 버튼 클릭');
          console.log('2. 이름, 이메일, 전화번호 입력');
          console.log('3. 제출 → 성공 메시지 확인\n');
          console.log('또는 터미널에서:');
          console.log('curl -X POST https://bsd.ai.kr/webhook/landing-form \\');
          console.log('  -H "Content-Type: application/json" \\');
          console.log('  -d \'{"name":"홍길동","email":"test@example.com","phone":"010-1234-5678"}\'');
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
