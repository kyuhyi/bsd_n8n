const https = require('https');

const N8N_URL = 'bsd.ai.kr';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWQwNDBiMy03NjYwLTRhMTAtOWY2My04YTNlYTMzMjVkYWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MzQyMzYwfQ.qMyvvmaTNC1deM95TjBuB_dwE1tUXn2wkvIZHxAAsog';
const WORKFLOW_ID = 'UOLIO5KWqbKJHL2G';

console.log('🔧 n8n 워크플로우 웹훅 수정 중...\n');

// Step 1: Get current workflow
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
      console.error('❌ 워크플로우 가져오기 실패:', res.statusCode);
      console.error(data);
      return;
    }

    const workflow = JSON.parse(data);
    console.log('✅ 기존 워크플로우 불러옴:', workflow.name);

    // Step 2: Modify webhook node
    const webhookNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');

    if (!webhookNode) {
      console.error('❌ Webhook 노드를 찾을 수 없습니다');
      return;
    }

    console.log('📝 Webhook 노드 현재 설정:');
    console.log('   - responseMode:', webhookNode.parameters.responseMode);
    console.log('   - responseData:', webhookNode.parameters.responseData);

    // Change to respond immediately with last node output
    webhookNode.parameters.responseMode = 'lastNode';
    delete webhookNode.parameters.responseData;
    delete webhookNode.parameters.responseCode;

    console.log('\n🔄 변경된 설정:');
    console.log('   - responseMode: lastNode (마지막 노드가 응답)');

    // Add a simple response node after webhook if needed
    const dataValidatorNode = workflow.nodes.find(n => n.name === '데이터 검증');
    if (dataValidatorNode) {
      console.log('   - 데이터 검증 노드가 응답을 반환합니다');
    }

    // Step 3: Update workflow
    const updateData = JSON.stringify(workflow);
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

    const updateReq = https.request(updateOptions, (updateRes) => {
      let updateData = '';

      updateRes.on('data', (chunk) => updateData += chunk);

      updateRes.on('end', () => {
        if (updateRes.statusCode === 200) {
          console.log('\n✅ 워크플로우 업데이트 완료!');
          console.log('\n📋 테스트 명령:');
          console.log('curl -X POST https://bsd.ai.kr/webhook/landing-form \\');
          console.log('  -H "Content-Type: application/json" \\');
          console.log('  -d \'{"name":"테스트","email":"test@example.com","phone":"010-1234-5678"}\'');
          console.log('\n💡 이제 웹 인터페이스에서 "n8n 소식 받기" 버튼을 테스트하세요!');
        } else {
          console.error('❌ 업데이트 실패:', updateRes.statusCode);
          console.error(updateData);
        }
      });
    });

    updateReq.on('error', (error) => {
      console.error('❌ 업데이트 오류:', error.message);
    });

    updateReq.write(updateData);
    updateReq.end();
  });
});

getReq.on('error', (error) => {
  console.error('❌ 요청 오류:', error.message);
});

getReq.end();
