import OpenAI from 'openai';
import type { IntentAnalysis, N8nWorkflow } from '@/types';

type AIProvider = 'openai' | 'xai' | 'gemini' | 'anthropic' | 'deepseek';

export class AIWorkflowBuilder {
  private client: any;
  private provider: AIProvider;

  constructor(provider: AIProvider = 'openai', apiKey?: string) {
    this.provider = provider;

    if (provider === 'openai' || provider === 'xai' || provider === 'deepseek') {
      this.client = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
        baseURL:
          provider === 'xai' ? 'https://api.x.ai/v1' :
          provider === 'deepseek' ? 'https://api.deepseek.com/v1' :
          undefined,
      });
    } else if (provider === 'gemini') {
      this.client = { apiKey: apiKey || process.env.GEMINI_API_KEY };
    } else if (provider === 'anthropic') {
      this.client = { apiKey: apiKey || process.env.ANTHROPIC_API_KEY };
    }
  }

  private systemPrompt = `당신은 n8n 워크플로우 JSON을 생성하는 전문가입니다.

중요한 규칙:
1. 모든 노드는 실제로 실행 가능해야 합니다
2. 필수 파라미터를 모두 포함해야 합니다
3. 노드 연결(connections)이 정확해야 합니다
4. position은 반드시 [숫자, 숫자] 형태여야 합니다

n8n 노드 타입 예시:
- n8n-nodes-base.webhook (Webhook 트리거)
- n8n-nodes-base.gmail (Gmail 트리거/액션)
- n8n-nodes-base.slack (Slack 메시지)
- n8n-nodes-base.googleSheets (Google Sheets)
- n8n-nodes-base.httpRequest (HTTP 요청)
- n8n-nodes-base.code (Code 노드 - 데이터 변환용)
- n8n-nodes-base.set (Set 노드 - 데이터 설정용)

완전하고 실행 가능한 n8n 워크플로우 JSON만 반환하세요.`;

  async buildWorkflow(analysis: IntentAnalysis, userInput: string): Promise<N8nWorkflow> {
    try {
      let content: string | null = null;

      const exampleWorkflow = {
        "name": "Gmail → Slack",
        "nodes": [
          {
            "id": "trigger",
            "type": "n8n-nodes-base.emailReadImap",
            "typeVersion": 2,
            "position": [0, 300],
            "parameters": {
              "mailbox": "INBOX",
              "postProcessAction": "mark",
              "options": {}
            },
            "name": "Gmail Trigger"
          },
          {
            "id": "code1",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [200, 300],
            "parameters": {
              "language": "javaScript",
              "jsCode": "return items.map(item => ({\n  json: {\n    subject: item.json.subject,\n    from: item.json.from,\n    text: item.json.text\n  }\n}));"
            },
            "name": "데이터 추출"
          },
          {
            "id": "slack1",
            "type": "n8n-nodes-base.slack",
            "typeVersion": 2,
            "position": [400, 300],
            "parameters": {
              "resource": "message",
              "operation": "post",
              "channel": "#general",
              "text": "={{$json.subject}}"
            },
            "name": "Slack"
          }
        ],
        "connections": {
          "Gmail Trigger": {
            "main": [[
              {
                "node": "데이터 추출",
                "type": "main",
                "index": 0
              }
            ]]
          },
          "데이터 추출": {
            "main": [[
              {
                "node": "Slack",
                "type": "main",
                "index": 0
              }
            ]]
          }
        },
        "settings": {
          "executionOrder": "v1"
        }
      };

      const promptContent = `Intent 분석 결과:
${JSON.stringify(analysis, null, 2)}

사용자 요청: "${userInput}"

위 분석을 바탕으로 완전히 실행 가능한 n8n 워크플로우 JSON을 생성하세요.

참고 예시:
${JSON.stringify(exampleWorkflow, null, 2)}

요구사항:
1. Trigger 노드 1개 (id, type, typeVersion, position, parameters, name 모두 포함)
2. 데이터 변환이 필요하면 Code 노드 추가
3. Action 노드들 (Slack, Gmail, Google Sheets 등)
4. 모든 노드 간 connections 정확히 설정
5. position은 [x좌표, y좌표] 형태 (x는 200씩 증가, y는 300 고정)
6. settings 필드 필수 포함: {"executionOrder": "v1"}

**중요**: 반드시 settings 필드를 포함해야 합니다!

JSON만 반환하세요 (설명 없이):`;

      if (this.provider === 'openai' || this.provider === 'xai' || this.provider === 'deepseek') {
        const model =
          this.provider === 'openai' ? 'gpt-4' :
          this.provider === 'xai' ? 'grok-4-latest' :
          'deepseek-chat';
        const response = await this.client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: promptContent }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });
        content = response.choices[0]?.message?.content;
      } else if (this.provider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.client.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${this.systemPrompt}\n\n${promptContent}` }]
              }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            })
          }
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(`Gemini API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
          console.error('Gemini response:', JSON.stringify(data, null, 2));
        }
      } else if (this.provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.client.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [
              { role: 'user', content: `${this.systemPrompt}\n\n${promptContent}` }
            ],
            temperature: 0.1
          })
        });
        const data = await response.json();
        content = data.content?.[0]?.text;
      }

      if (!content) {
        throw new Error('No response from AI');
      }

      const workflow: N8nWorkflow = JSON.parse(content);

      // Ensure settings exist (required by n8n API)
      if (!workflow.settings) {
        workflow.settings = { executionOrder: 'v1' };
      }

      // Validate workflow
      this.validateWorkflow(workflow);

      return workflow;
    } catch (error) {
      console.error('Workflow building failed:', error);
      throw new Error(`Failed to build workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateWorkflow(workflow: N8nWorkflow): void {
    if (!workflow.name) {
      throw new Error('Workflow must have a name');
    }

    if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    // Validate each node
    workflow.nodes.forEach((node, index) => {
      if (!node.id && !node.name) {
        throw new Error(`Node ${index} must have id or name`);
      }
      if (!node.type) {
        throw new Error(`Node ${node.name || index} must have type`);
      }
      if (!Array.isArray(node.position) || node.position.length !== 2) {
        throw new Error(`Node ${node.name || index} position must be [x, y] array`);
      }
      if (typeof node.position[0] !== 'number' || typeof node.position[1] !== 'number') {
        throw new Error(`Node ${node.name || index} position must contain numbers`);
      }
    });

    // Validate connections
    if (workflow.connections) {
      for (const [sourceName, connectionData] of Object.entries(workflow.connections)) {
        const sourceNode = workflow.nodes.find(n => n.name === sourceName);
        if (!sourceNode) {
          throw new Error(`Connection source node "${sourceName}" not found`);
        }

        connectionData.main.forEach((connections) => {
          connections.forEach(conn => {
            const targetNode = workflow.nodes.find(n => n.name === conn.node);
            if (!targetNode) {
              throw new Error(`Connection target node "${conn.node}" not found`);
            }
          });
        });
      }
    }
  }
}
