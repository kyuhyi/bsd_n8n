const https = require('https');

const N8N_URL = 'bsd.ai.kr';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWQwNDBiMy03NjYwLTRhMTAtOWY2My04YTNlYTMzMjVkYWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MzQyMzYwfQ.qMyvvmaTNC1deM95TjBuB_dwE1tUXn2wkvIZHxAAsog';
const WORKFLOW_ID = 'UOLIO5KWqbKJHL2G';

console.log('🔧 워크플로우 최종 수정 중...\n');

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

    // Webhook 노드 찾기
    const webhookNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
    // Respond to Webhook 노드 찾기
    const respondNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.respondToWebhook');

    console.log('\n✅ 수정 내용:');
    console.log('1. "응답 반환" (Respond to Webhook) 노드 제거');
    console.log('2. Webhook이 바로 응답하도록 설정 (responseMode: onReceived)\n');

    // Respond to Webhook 노드 제거
    workflow.nodes = workflow.nodes.filter(n => n.type !== 'n8n-nodes-base.respondToWebhook');

    // 연결에서도 제거
    Object.keys(workflow.connections).forEach(key => {
      if (workflow.connections[key].main) {
        workflow.connections[key].main = workflow.connections[key].main.map(connections => {
          return connections.filter(conn => {
            const targetNode = workflow.nodes.find(n => n.name === conn.node);
            return targetNode && targetNode.type !== 'n8n-nodes-base.respondToWebhook';
          });
        });
      }
    });

    // Webhook 노드 설정 변경
    if (webhookNode) {
      webhookNode.parameters.responseMode = 'onReceived';
      delete webhookNode.parameters.responseData;
      webhookNode.parameters.responseCode = 200;
      webhookNode.parameters.options = {
        ...webhookNode.parameters.options,
        responseData: JSON.stringify({
          success: true,
          message: '구독 신청이 완료되었습니다. 감사합니다!'
        })
      };
    }

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

    console.log('🔄 워크플로우 업데이트 중...\n');

    const updateReq = https.request(updateOptions, (updateRes) => {
      let updateResData = '';

      updateRes.on('data', (chunk) => updateResData += chunk);

      updateRes.on('end', () => {
        if (updateRes.statusCode === 200) {
          console.log('✅ 완료! 워크플로우가 성공적으로 수정되었습니다.\n');
          console.log('📋 이제 웹훅이 즉시 응답합니다:');
          console.log('   - 사용자 → 폼 제출 → 즉시 성공 메시지');
          console.log('   - 백그라운드에서 Google Sheets, Gmail, SMS 처리\n');
          console.log('💡 테스트:');
          console.log('웹 인터페이스에서 "n8n 소식 받기" 버튼을 클릭하고 폼을 제출해보세요!');
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
