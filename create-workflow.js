const https = require('https');

const workflow = {
  name: '퍼널형 랜딩페이지 자동알림',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'landing-form',
        responseMode: 'lastNode',
        options: {}
      },
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [250, 300]
    },
    {
      parameters: {
        jsCode: `const inputData = $input.item.json;
const body = inputData.body || inputData;

console.log('받은 데이터:', JSON.stringify(body, null, 2));

const name = body.name || '';
const email = body.email || '';
const phone = body.phone || '';

if (!name || !email) {
  return { success: false, message: '이름과 이메일은 필수입니다' };
}

return {
  success: true,
  message: '구독 신청이 완료되었습니다',
  data: {
    name: name,
    email: email,
    phone: phone,
    timestamp: body.timestamp || new Date().toISOString(),
    source: body.source || 'unknown'
  }
};`
      },
      name: '데이터 처리',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [450, 300]
    }
  ],
  connections: {
    'Webhook': {
      main: [[{ node: '데이터 처리', type: 'main', index: 0 }]]
    }
  },
  active: true,
  settings: {},
  tags: []
};

const data = JSON.stringify(workflow);
const options = {
  hostname: 'bsd.ai.kr',
  port: 443,
  path: '/api/v1/workflows',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWQwNDBiMy03NjYwLTRhMTAtOWY2My04YTNlYTMzMjVkYWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MzQyMzYwfQ.qMyvvmaTNC1deM95TjBuB_dwE1tUXn2wkvIZHxAAsog'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => responseData += chunk);
  res.on('end', () => {
    console.log('✅ 워크플로우 생성 완료!');
    console.log('상태 코드:', res.statusCode);
    const result = JSON.parse(responseData);
    console.log('워크플로우 ID:', result.id);
    console.log('Webhook URL: https://bsd.ai.kr/webhook/landing-form');
    console.log('\n테스트 명령:');
    console.log('curl -X POST https://bsd.ai.kr/webhook/landing-form -H "Content-Type: application/json" -d \'{"name":"테스트","email":"test@example.com","phone":"010-1234-5678"}\'');
  });
});

req.on('error', (error) => {
  console.error('❌ 오류:', error.message);
});

req.write(data);
req.end();
