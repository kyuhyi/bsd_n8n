const https = require('https');

const N8N_URL = 'bsd.ai.kr';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWQwNDBiMy03NjYwLTRhMTAtOWY2My04YTNlYTMzMjVkYWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MzQyMzYwfQ.qMyvvmaTNC1deM95TjBuB_dwE1tUXn2wkvIZHxAAsog';
const WORKFLOW_ID = 'UOLIO5KWqbKJHL2G';

console.log('🔧 SMS 노드 수정 중...\n');

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

    // SMS 노드 찾기
    const smsNode = workflow.nodes.find(n => n.type === 'n8n-nodes-solapi.solapi');
    const webhookNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');

    if (!smsNode) {
      console.error('❌ SMS 노드를 찾을 수 없습니다');
      return;
    }

    console.log('\n현재 SMS 노드 설정:');
    console.log('  To:', smsNode.parameters.to);
    console.log('  Text:', smsNode.parameters.text);

    console.log('\n✅ 수정 내용:');
    console.log('  1. To 필드: 웹훅에서 직접 전화번호 참조');
    console.log('  2. Text 필드: 웹훅에서 직접 이름 참조\n');

    // SMS 노드 파라미터 수정
    smsNode.parameters.to = '={{ $node["랜딩페이지 폼 수신"].json["phone"] }}';
    smsNode.parameters.text = '={{ $node["랜딩페이지 폼 수신"].json["name"] }}님, 신청하신 AI 바이브코딩 비밀특강이 이메일로 전송되었습니다! 비밀특강 영상 https://www.bsdclass.co.kr/31 ';

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
          console.log('✅ 완료! SMS 노드가 수정되었습니다.\n');
          console.log('📋 이제 SMS도 정상 작동합니다:');
          console.log('   - 웹훅에서 직접 phone, name 값을 가져옵니다');
          console.log('   - Google Sheets 참조 의존성 제거\n');
          console.log('💡 n8n 페이지를 새로고침하고 다시 확인해보세요!');
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
