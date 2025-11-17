import OpenAI from 'openai';
import type { IntentAnalysis } from '@/types';

type AIProvider = 'openai' | 'xai' | 'gemini' | 'anthropic' | 'deepseek';

export class AIIntentAnalyzer {
  private client: any;
  private provider: AIProvider;

  constructor(provider: AIProvider = 'openai', apiKey?: string) {
    this.provider = provider;

    if (provider === 'openai' || provider === 'xai' || provider === 'deepseek') {
      // OpenAI, xAI, and DeepSeek use the same SDK
      this.client = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
        baseURL:
          provider === 'xai' ? 'https://api.x.ai/v1' :
          provider === 'deepseek' ? 'https://api.deepseek.com/v1' :
          undefined,
      });
    } else if (provider === 'gemini') {
      // Gemini will use fetch directly
      this.client = { apiKey: apiKey || process.env.GEMINI_API_KEY };
    } else if (provider === 'anthropic') {
      // Anthropic will use fetch directly
      this.client = { apiKey: apiKey || process.env.ANTHROPIC_API_KEY };
    }
  }
  private systemPrompt = `당신은 n8n 워크플로우 자동화 전문가입니다.
사용자의 자연어 입력을 분석하여 n8n 워크플로우로 구현하기 위한 구조화된 정보를 추출합니다.

분석할 내용:
1. 사용자의 의도 (notification, data-sync, automation, etc.)
2. 트리거 서비스와 이벤트
3. 실행할 액션들
4. 필요한 n8n 노드 목록
5. 복잡도 평가 (simple/medium/complex)

JSON 형식으로만 응답하세요.`;

  async analyzeIntent(userInput: string): Promise<IntentAnalysis> {
    try {
      let content: string | null = null;

      const promptContent = `다음 요청을 분석하세요:\n\n${userInput}\n\n응답 형식:\n${JSON.stringify({
        intent: "string",
        trigger: {
          service: "string",
          event: "string"
        },
        actions: [{
          service: "string",
          action: "string",
          data_fields: ["string"]
        }],
        required_nodes: ["string"],
        complexity: "simple|medium|complex",
        estimated_nodes: 0
      }, null, 2)}`;

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
          temperature: 0.3,
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
                temperature: 0.3,
                responseMimeType: 'application/json'
              }
            })
          }
        );
        const data = await response.json();

        // Check for API errors
        if (data.error) {
          throw new Error(`Gemini API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Log if no content for debugging
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
            max_tokens: 2048,
            messages: [
              { role: 'user', content: `${this.systemPrompt}\n\n${promptContent}` }
            ],
            temperature: 0.3
          })
        });
        const data = await response.json();
        content = data.content?.[0]?.text;
      }

      if (!content) {
        throw new Error('No response from AI');
      }

      const analysis: IntentAnalysis = JSON.parse(content);

      // Validate and enhance the analysis
      this.validateAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Intent analysis failed:', error);
      throw new Error(`Failed to analyze intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAnalysis(analysis: IntentAnalysis): void {
    if (!analysis.intent) {
      throw new Error('Missing intent in analysis');
    }
    if (!analysis.trigger?.service || !analysis.trigger?.event) {
      throw new Error('Missing trigger information');
    }
    if (!Array.isArray(analysis.actions) || analysis.actions.length === 0) {
      throw new Error('Missing actions in analysis');
    }
    if (!Array.isArray(analysis.required_nodes) || analysis.required_nodes.length === 0) {
      throw new Error('Missing required nodes');
    }
  }

  /**
   * Get example intents for user guidance
   */
  getExampleIntents(): Array<{ input: string; description: string }> {
    return [
      {
        input: "스티비에 신규 구독자 들어오면 카톡으로 알려줘",
        description: "이메일 마케팅 도구 → 메신저 알림"
      },
      {
        input: "Gmail에 신규 메일 오면 슬랙으로 전송",
        description: "이메일 → 팀 커뮤니케이션"
      },
      {
        input: "쇼핑몰 주문 들어오면 구글 시트에 기록하고 카톡 알림",
        description: "E-commerce → 데이터 저장 + 알림"
      },
      {
        input: "매일 아침 9시에 어제 매출 슬랙으로 리포트",
        description: "스케줄 트리거 → 데이터 집계 → 리포트"
      },
      {
        input: "인스타그램 신규 팔로워 → Notion에 자동 저장",
        description: "소셜미디어 → 노트 앱 연동"
      }
    ];
  }

  /**
   * Analyze intent with modification request
   */
  async analyzeWithModification(
    originalAnalysis: IntentAnalysis,
    modificationRequest: string
  ): Promise<IntentAnalysis> {
    try {
      let content: string | null = null;

      const promptContent = `기존 워크플로우 분석:\n${JSON.stringify(originalAnalysis, null, 2)}\n\n수정 요청:\n${modificationRequest}\n\n위 수정 요청을 반영하여 워크플로우를 재분석하세요.\n\n응답 형식:\n${JSON.stringify({
        intent: "string",
        trigger: {
          service: "string",
          event: "string"
        },
        actions: [{
          service: "string",
          action: "string",
          data_fields: ["string"]
        }],
        required_nodes: ["string"],
        complexity: "simple|medium|complex",
        estimated_nodes: 0
      }, null, 2)}`;

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
          temperature: 0.3,
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
                temperature: 0.3,
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
            max_tokens: 2048,
            messages: [
              { role: 'user', content: `${this.systemPrompt}\n\n${promptContent}` }
            ],
            temperature: 0.3
          })
        });
        const data = await response.json();
        content = data.content?.[0]?.text;
      }

      if (!content) {
        throw new Error('No response from AI');
      }

      const analysis: IntentAnalysis = JSON.parse(content);
      this.validateAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Intent modification failed:', error);
      throw new Error(`Failed to modify intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced intent analysis with AI suggestions
   */
  async analyzeWithSuggestions(userInput: string): Promise<{
    analysis: IntentAnalysis;
    suggestions: string[];
    alternative_approaches: string[];
  }> {
    const analysis = await this.analyzeIntent(userInput);

    const suggestionsPrompt = `사용자 요청: "${userInput}"

다음 워크플로우에 대해:
1. 더 나은 구현 방법 제안
2. 대안적 접근 방식
3. 주의사항

간결하게 각각 3개씩 나열하세요.`;

    let content = '';

    if (this.provider === 'openai' || this.provider === 'xai' || this.provider === 'deepseek') {
      const model =
        this.provider === 'openai' ? 'gpt-4' :
        this.provider === 'xai' ? 'grok-4-latest' :
        'deepseek-chat';
      const suggestionsResponse = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'n8n 워크플로우 최적화 전문가입니다.' },
          { role: 'user', content: suggestionsPrompt }
        ],
        temperature: 0.5,
        max_tokens: 500
      });
      content = suggestionsResponse.choices[0]?.message?.content || '';
    } else if (this.provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.client.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `n8n 워크플로우 최적화 전문가입니다.\n\n${suggestionsPrompt}` }]
            }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 500 }
          })
        }
      );
      const data = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
          max_tokens: 500,
          messages: [
            { role: 'user', content: `n8n 워크플로우 최적화 전문가입니다.\n\n${suggestionsPrompt}` }
          ],
          temperature: 0.5
        })
      });
      const data = await response.json();
      content = data.content?.[0]?.text || '';
    }

    // Parse suggestions (simple implementation)
    const lines = content.split('\n').filter((l: string) => l.trim());
    const suggestions = lines.filter((l: string) => l.includes('제안') || l.includes('추천')).slice(0, 3);
    const alternatives = lines.filter((l: string) => l.includes('대안') || l.includes('방법')).slice(0, 3);

    return {
      analysis,
      suggestions: suggestions.length > 0 ? suggestions : ['워크플로우 자동 테스트 활성화', '에러 핸들링 추가', '로그 기록 설정'],
      alternative_approaches: alternatives.length > 0 ? alternatives : ['웹훅 대신 폴링 방식 고려', 'API 직접 호출로 단순화']
    };
  }
}
