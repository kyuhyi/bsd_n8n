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

⚠️ **절대 규칙 - 반드시 지켜야 함**:
1. **커스텀 노드 절대 금지**: 존재하지 않는 노드 타입을 만들지 마세요
2. **기본 노드만 사용**: 아래 공식 n8n 노드만 사용 가능합니다
3. 모든 노드는 실제로 실행 가능해야 합니다
4. 필수 파라미터를 모두 포함해야 합니다
5. 노드 연결(connections)이 정확해야 합니다
6. position은 반드시 [숫자, 숫자] 형태여야 합니다

✅ **사용 가능한 공식 n8n 노드 (이것만 사용하세요)**:

**트리거 노드**:
- n8n-nodes-base.webhook (Webhook HTTP 요청)
- n8n-nodes-base.emailReadImap (Gmail/이메일 읽기)
- n8n-nodes-base.scheduleTrigger (스케줄/Cron)
- n8n-nodes-base.manualTrigger (수동 실행)

**액션 노드**:
- n8n-nodes-base.slack (Slack 메시지)
- n8n-nodes-base.gmail (Gmail 전송)
- n8n-nodes-base.googleSheets (Google Sheets)
- n8n-nodes-base.discord (Discord)
- n8n-nodes-base.telegram (Telegram)
- n8n-nodes-base.notion (Notion)
- n8n-nodes-base.httpRequest (HTTP 요청)

**데이터 처리 노드**:
- n8n-nodes-base.code (JavaScript/Python 코드)
- n8n-nodes-base.set (데이터 설정)
- n8n-nodes-base.itemLists (배열/리스트 처리)

**AI/LLM 노드** (AI 작업시 우선 사용):
- @n8n/n8n-nodes-langchain.agent (AI Agent - 추천)
- @n8n/n8n-nodes-langchain.lmChatGoogleGemini (Google Gemini)
- @n8n/n8n-nodes-langchain.lmChatOpenAi (OpenAI GPT)
- @n8n/n8n-nodes-langchain.lmChatAnthropic (Claude)

❌ **절대 하지 마세요**:
- 커스텀 노드 생성 금지 (예: "Google Translate", "Analyze Feedback" 같은 존재하지 않는 노드)
- 위 목록에 없는 노드 타입 사용 금지
- 노드 이름을 임의로 만들지 마세요

완전하고 실행 가능한 n8n 워크플로우 JSON만 반환하세요.`;

  async buildWorkflow(analysis: IntentAnalysis, userInput: string, context7Context?: string): Promise<N8nWorkflow> {
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

${context7Context ? `\n## 📚 Context7 가이드 (반드시 참고)\n\n${context7Context}\n` : ''}

⚠️ **경고: 커스텀 노드 절대 금지**
- "Google Translate", "Analyze Feedback", "Process Gemini Output" 같은 노드는 존재하지 않습니다
- System Prompt에 명시된 공식 n8n 노드만 사용하세요
- AI 작업은 반드시 \`@n8n/n8n-nodes-langchain.agent\` 또는 Chat Model 노드 사용
- 번역/분석 등은 \`n8n-nodes-base.code\` 노드에서 API 호출하거나 AI Agent 노드 사용

참고 예시:
${JSON.stringify(exampleWorkflow, null, 2)}

✅ **요구사항**:
1. **트리거 노드**: 반드시 \`n8n-nodes-base.webhook\`, \`n8n-nodes-base.manualTrigger\` 등 공식 트리거만 사용
2. **데이터 처리**: \`n8n-nodes-base.code\` 노드로 변환/가공
3. **AI 작업**: \`@n8n/n8n-nodes-langchain.agent\` + Chat Model 노드 조합
4. **액션 노드**: \`n8n-nodes-base.slack\`, \`n8n-nodes-base.gmail\` 등 공식 노드만
5. **connections**: 모든 노드 간 연결 정확히 설정
6. **position**: [x좌표, y좌표] 형태 (x는 200씩 증가)
7. **settings**: {"executionOrder": "v1"} 필수

${context7Context ? '8. **Context7 가이드 준수**: 위 가이드에서 추천한 노드를 정확히 사용\n' : ''}

**최종 체크리스트**:
- [ ] 모든 노드가 System Prompt의 공식 노드 목록에 있는가?
- [ ] 커스텀 노드를 만들지 않았는가?
- [ ] AI 작업시 AI Agent 노드를 사용했는가?

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
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.client.apiKey}`,
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

      // Add sticky notes for each node
      await this.addStickyNotesForNodes(workflow, analysis, userInput);

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

  /**
   * Add Korean sticky notes for each node explaining their purpose
   */
  private async addStickyNotesForNodes(
    workflow: N8nWorkflow,
    analysis: IntentAnalysis,
    userInput: string
  ): Promise<void> {
    try {
      // Generate sticky note descriptions for all nodes
      const nodeDescriptions = await this.generateNodeDescriptions(workflow, analysis, userInput);

      // Add sticky notes to workflow
      const stickyNotes: any[] = [];
      const nonStickyNodes = workflow.nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote');

      nonStickyNodes.forEach((node, index) => {
        const description = nodeDescriptions[node.name || node.id || `node-${index}`];
        if (description) {
          const stickyNote = {
            parameters: {
              height: 200,
              width: 300,
              content: `## 📌 ${node.name}\n\n${description}`
            },
            id: `sticky-${node.id || node.name}-${index}`,
            name: `📝 ${node.name} 설명`,
            type: 'n8n-nodes-base.stickyNote',
            typeVersion: 1,
            position: [
              (node.position[0] as number) - 350,
              (node.position[1] as number) - 100
            ]
          };
          stickyNotes.push(stickyNote);
        }
      });

      // Add sticky notes to workflow
      workflow.nodes.push(...stickyNotes);
    } catch (error) {
      console.warn('Failed to add sticky notes, continuing without them:', error);
      // Don't throw - sticky notes are nice-to-have, not essential
    }
  }

  /**
   * Generate Korean descriptions for each node using AI
   */
  private async generateNodeDescriptions(
    workflow: N8nWorkflow,
    analysis: IntentAnalysis,
    userInput: string
  ): Promise<Record<string, string>> {
    try {
      const nonStickyNodes = workflow.nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote');

      const promptContent = `사용자 요청: "${userInput}"

워크플로우 분석:
- 의도: ${analysis.intent}
- 트리거: ${analysis.trigger.service} - ${analysis.trigger.event}

다음 각 노드에 대해 **초보자도 이해할 수 있는** 한국어 설명을 작성하세요:

${nonStickyNodes.map((node, i) => `${i + 1}. **${node.name}** (${node.type})
   Parameters: ${JSON.stringify(node.parameters || {}).substring(0, 100)}`).join('\n\n')}

**설명 작성 규칙**:
1. 각 노드당 3-5줄로 작성
2. 노드의 역할과 무엇을 하는지 명확히 설명
3. 필요한 설정값 설명
4. **⚠️ 자격증명(Credentials) 설정이 필요한 경우 반드시 명시**
   - 어떤 자격증명이 필요한지
   - 어디서 발급받는지 (예: Google Cloud Console, Slack App 등)
   - 설정 방법 간단 가이드
5. 초보자가 직접 따라할 수 있도록 단계별로 설명

**자격증명 설정 예시**:
- Gmail 노드: "Google Cloud Console에서 OAuth2 자격증명 발급 → n8n 자격증명 메뉴에서 'Google OAuth2' 선택 → Client ID, Secret 입력"
- Slack 노드: "Slack App 생성 → Bot Token Scopes 권한 설정 → Bot User OAuth Token 복사 → n8n에서 'Slack OAuth2' 자격증명 추가"

JSON 형식으로 반환:
${JSON.stringify(
  Object.fromEntries(nonStickyNodes.map(n => [n.name || n.id, '설명 내용'])),
  null,
  2
)}`;

      let content: string | null = null;

      if (this.provider === 'openai' || this.provider === 'xai' || this.provider === 'deepseek') {
        const model =
          this.provider === 'openai' ? 'gpt-4' :
          this.provider === 'xai' ? 'grok-4-latest' :
          'deepseek-chat';
        const response = await this.client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: 'n8n 워크플로우 노드 설명 전문가입니다. 각 노드의 역할을 한국어로 명확히 설명합니다.' },
            { role: 'user', content: promptContent }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        content = response.choices[0]?.message?.content;
      } else if (this.provider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.client.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `n8n 워크플로우 노드 설명 전문가입니다.\n\n${promptContent}` }]
              }],
              generationConfig: {
                temperature: 0.3,
                responseMimeType: 'application/json'
              }
            })
          }
        );
        const data = await response.json();
        if (data.error) {
          throw new Error(`Gemini API Error: ${data.error.message}`);
        }
        content = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
            max_tokens: 2048,
            messages: [
              { role: 'user', content: `n8n 워크플로우 노드 설명 전문가입니다.\n\n${promptContent}` }
            ],
            temperature: 0.3
          })
        });
        const data = await response.json();
        content = data.content?.[0]?.text;
      }

      if (!content) {
        return {};
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate node descriptions:', error);
      return {};
    }
  }
}
