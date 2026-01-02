/**
 * Context7 API Service
 * 최신 라이브러리 문서와 정보를 가져와서 정확한 워크플로우 생성을 지원
 */

export interface Context7Library {
  id: string;
  title: string;
  description: string;
  branch: string;
  lastUpdateDate: string;
  state: string;
  totalTokens: number;
  totalSnippets: number;
  stars: number;
  trustScore: number;
  benchmarkScore: number;
  versions: string[];
}

export interface Context7SearchResult {
  results: Context7Library[];
}

export interface Context7SnippetResult {
  snippets: Array<{
    id: string;
    title: string;
    content: string;
    relevance: number;
    path: string;
  }>;
}

export class Context7Service {
  private apiKey: string;
  private baseUrl = 'https://context7.com/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for libraries
   */
  async searchLibraries(libraryName: string, query?: string): Promise<Context7SearchResult> {
    try {
      const params = new URLSearchParams({
        libraryName,
        ...(query && { query })
      });

      const response = await fetch(`${this.baseUrl}/libs/search?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Context7 API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to search Context7 libraries:', error);
      throw error;
    }
  }

  /**
   * Get specific library documentation snippets
   */
  async getLibrarySnippets(libraryId: string, query: string, limit = 10): Promise<Context7SnippetResult> {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/libs/${encodeURIComponent(libraryId)}/snippets?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Context7 API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Context7 snippets:', error);
      throw error;
    }
  }

  /**
   * Get enriched context for n8n workflow generation
   *
   * This method analyzes the user's intent and fetches relevant library documentation
   * to provide accurate, up-to-date information for workflow creation.
   */
  async getWorkflowContext(userInput: string, requiredNodes: string[]): Promise<string> {
    try {
      const contextParts: string[] = [];

      // Add n8n node context first
      contextParts.push(this.getN8nNodeContext(requiredNodes, userInput));

      // Extract library/service names from required nodes
      const libraries = this.extractLibrariesFromNodes(requiredNodes);

      // Fetch external library documentation if needed
      if (libraries.length > 0) {
        for (const library of libraries) {
          try {
            // Search for the library
            const searchResult = await this.searchLibraries(library, userInput);

            if (searchResult.results && searchResult.results.length > 0) {
              const lib = searchResult.results[0];

              // Get relevant snippets
              const snippets = await this.getLibrarySnippets(lib.id, userInput, 5);

              if (snippets.snippets && snippets.snippets.length > 0) {
                contextParts.push(`\n## ${lib.title} (Latest: ${lib.versions[0] || 'N/A'})\n`);
                contextParts.push(`**Trust Score**: ${lib.trustScore}/10 | **Stars**: ${lib.stars.toLocaleString()}\n`);
                contextParts.push(`**Updated**: ${new Date(lib.lastUpdateDate).toLocaleDateString()}\n\n`);

                snippets.snippets.forEach((snippet, index) => {
                  if (index < 3) { // Limit to top 3 snippets
                    contextParts.push(`### ${snippet.title}\n`);
                    contextParts.push(`\`\`\`\n${snippet.content.substring(0, 500)}\n\`\`\`\n\n`);
                  }
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch context for ${library}:`, error);
            // Continue with other libraries even if one fails
          }
        }
      }

      return contextParts.join('');
    } catch (error) {
      console.error('Failed to get workflow context:', error);
      return '';
    }
  }

  /**
   * Get n8n-specific node context and recommendations
   */
  private getN8nNodeContext(requiredNodes: string[], userInput: string): string {
    const contextParts: string[] = [];
    const userInputLower = userInput.toLowerCase();

    contextParts.push(`\n## 🎯 n8n 노드 활용 가이드\n\n`);

    // Check for AI/LLM related requests
    const isAIRelated = userInputLower.includes('ai') ||
                        userInputLower.includes('분석') ||
                        userInputLower.includes('생성') ||
                        userInputLower.includes('번역') ||
                        userInputLower.includes('요약') ||
                        userInputLower.includes('gemini') ||
                        userInputLower.includes('gpt') ||
                        userInputLower.includes('claude');

    if (isAIRelated) {
      contextParts.push(`### ⭐ AI Agent 노드 적극 활용 권장\n\n`);
      contextParts.push(`**@n8n/n8n-nodes-langchain.agent** 노드를 우선 사용하세요:\n`);
      contextParts.push(`- AI 기반 작업 자동화에 최적화\n`);
      contextParts.push(`- Chat Model 연동 (Google Gemini, OpenAI 등)\n`);
      contextParts.push(`- Memory 기능으로 대화 컨텍스트 유지\n`);
      contextParts.push(`- Tool 통합으로 다양한 작업 수행\n\n`);

      contextParts.push(`**Chat Model 노드들**:\n`);
      contextParts.push(`- \`@n8n/n8n-nodes-langchain.lmChatGoogleGemini\` - Google Gemini (추천)\n`);
      contextParts.push(`- \`@n8n/n8n-nodes-langchain.lmChatOpenAi\` - OpenAI GPT\n`);
      contextParts.push(`- \`@n8n/n8n-nodes-langchain.lmChatAnthropic\` - Claude\n\n`);
    }

    // Check for existing n8n nodes and provide guidance
    contextParts.push(`### 📌 기본 n8n 노드 우선 사용\n\n`);
    contextParts.push(`**중요**: 커스텀 노드를 만들기 전에 기존 n8n 노드를 먼저 확인하세요!\n\n`);

    const nodeRecommendations: Record<string, string> = {
      'webhook': '`n8n-nodes-base.webhook` - HTTP 요청 수신',
      'http': '`n8n-nodes-base.httpRequest` - HTTP 요청 전송',
      'code': '`n8n-nodes-base.code` - JavaScript/Python 코드 실행',
      'gmail': '`n8n-nodes-base.gmail` - Gmail 읽기/쓰기',
      'slack': '`n8n-nodes-base.slack` - Slack 메시지',
      'sheets': '`n8n-nodes-base.googleSheets` - Google Sheets 작업',
      'notion': '`n8n-nodes-base.notion` - Notion DB 작업',
      'discord': '`n8n-nodes-base.discord` - Discord 메시지',
      'telegram': '`n8n-nodes-base.telegram` - Telegram Bot',
      'gemini': '`@n8n/n8n-nodes-langchain.lmChatGoogleGemini` - Google Gemini AI'
    };

    const relevantNodes: string[] = [];
    for (const [keyword, desc] of Object.entries(nodeRecommendations)) {
      if (userInputLower.includes(keyword) ||
          requiredNodes.some(n => n.toLowerCase().includes(keyword))) {
        relevantNodes.push(`- ${desc}`);
      }
    }

    if (relevantNodes.length > 0) {
      contextParts.push(`**이 작업에 사용 가능한 노드**:\n`);
      contextParts.push(relevantNodes.join('\n'));
      contextParts.push(`\n\n`);
    }

    // General best practices
    contextParts.push(`### ✅ 워크플로우 설계 Best Practices\n\n`);
    contextParts.push(`1. **노드 재사용**: 이미 있는 n8n 노드를 최대한 활용\n`);
    contextParts.push(`2. **AI Agent 활용**: AI 관련 작업은 AI Agent 노드 우선 고려\n`);
    contextParts.push(`3. **Code 노드**: 간단한 데이터 변환은 Code 노드 사용\n`);
    contextParts.push(`4. **Error Handling**: 중요한 작업에는 에러 처리 추가\n`);
    contextParts.push(`5. **테스트 가능**: 각 노드가 독립적으로 테스트 가능하도록 구성\n\n`);

    return contextParts.join('');
  }

  /**
   * Extract library names from n8n node types
   */
  private extractLibrariesFromNodes(requiredNodes: string[]): string[] {
    const libraries: string[] = [];

    // Map n8n nodes to popular libraries
    const nodeToLibrary: Record<string, string> = {
      'gmail': 'googleapis',
      'slack': 'slack',
      'googlesheets': 'googleapis',
      'googledrive': 'googleapis',
      'github': 'octokit',
      'stripe': 'stripe',
      'twilio': 'twilio',
      'sendgrid': 'sendgrid',
      'mailchimp': 'mailchimp',
      'hubspot': 'hubspot',
      'salesforce': 'jsforce',
      'notion': '@notionhq/client',
      'airtable': 'airtable',
      'mongodb': 'mongodb',
      'mysql': 'mysql2',
      'postgres': 'pg',
      'redis': 'redis',
      'aws': 'aws-sdk',
      'discord': 'discord.js',
      'telegram': 'telegraf',
      'twitter': 'twitter-api-v2',
      'openai': 'openai',
      'anthropic': '@anthropic-ai/sdk'
    };

    requiredNodes.forEach(node => {
      const nodeName = node.toLowerCase().replace('n8n-nodes-base.', '');
      if (nodeToLibrary[nodeName]) {
        libraries.push(nodeToLibrary[nodeName]);
      }
    });

    return [...new Set(libraries)]; // Remove duplicates
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.searchLibraries('test', '');
      return true;
    } catch (error) {
      return false;
    }
  }
}
