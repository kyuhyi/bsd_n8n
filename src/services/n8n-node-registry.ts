/**
 * n8n Node Registry Service
 * n8n 인스턴스에서 사용 가능한 노드 목록을 조회하고 검색
 */

export interface N8nNodeType {
  name: string;
  displayName: string;
  description: string;
  group: string[];
  version: number;
  defaults: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export interface NodeSearchResult {
  nodeName: string;
  displayName: string;
  description: string;
  category: 'trigger' | 'action' | 'transform' | 'ai';
  isBuiltIn: boolean;
  reason?: string;
}

export class N8nNodeRegistry {
  private n8nUrl: string;
  private apiKey: string;
  private nodeCache: N8nNodeType[] | null = null;
  private cacheTime: number = 0;
  private cacheDuration = 30 * 60 * 1000; // 30분

  constructor(n8nUrl: string, apiKey: string) {
    this.n8nUrl = n8nUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * n8n 인스턴스에서 사용 가능한 모든 노드 타입 조회
   */
  async getAvailableNodes(): Promise<N8nNodeType[]> {
    // Check cache
    if (this.nodeCache && Date.now() - this.cacheTime < this.cacheDuration) {
      return this.nodeCache;
    }

    try {
      const response = await fetch(`${this.n8nUrl}/api/v1/node-types`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`n8n API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.nodeCache = data;
      this.cacheTime = Date.now();

      return data;
    } catch (error) {
      console.error('Failed to fetch n8n nodes:', error);
      // Return fallback built-in nodes list
      return this.getBuiltInNodesList();
    }
  }

  /**
   * 키워드로 노드 검색
   */
  async searchNodes(keyword: string): Promise<NodeSearchResult[]> {
    const nodes = await this.getAvailableNodes();
    const keywordLower = keyword.toLowerCase();
    const results: NodeSearchResult[] = [];

    for (const node of nodes) {
      const nameLower = node.name.toLowerCase();
      const displayNameLower = node.displayName?.toLowerCase() || '';
      const descLower = node.description?.toLowerCase() || '';

      // 검색어가 노드 이름, 표시명, 설명에 포함되는지 확인
      if (
        nameLower.includes(keywordLower) ||
        displayNameLower.includes(keywordLower) ||
        descLower.includes(keywordLower)
      ) {
        results.push({
          nodeName: node.name,
          displayName: node.displayName || node.name,
          description: node.description || '',
          category: this.categorizeNode(node),
          isBuiltIn: node.name.startsWith('n8n-nodes-base.')
        });
      }
    }

    // Built-in 노드 우선 정렬
    results.sort((a, b) => {
      if (a.isBuiltIn && !b.isBuiltIn) return -1;
      if (!a.isBuiltIn && b.isBuiltIn) return 1;
      return 0;
    });

    return results;
  }

  /**
   * 특정 기능에 적합한 노드 추천
   */
  async recommendNodes(functionality: string): Promise<NodeSearchResult[]> {
    const keywords = this.extractKeywords(functionality);
    const allResults: NodeSearchResult[] = [];

    for (const keyword of keywords) {
      const results = await this.searchNodes(keyword);
      allResults.push(...results);
    }

    // 중복 제거 및 우선순위 정렬
    const uniqueResults = this.deduplicateResults(allResults);
    return uniqueResults.slice(0, 5); // 상위 5개만 반환
  }

  /**
   * 노드를 카테고리로 분류
   */
  private categorizeNode(node: N8nNodeType): 'trigger' | 'action' | 'transform' | 'ai' {
    const nameLower = node.name.toLowerCase();

    if (nameLower.includes('trigger') || nameLower.includes('webhook')) {
      return 'trigger';
    }
    if (nameLower.includes('langchain') || nameLower.includes('ai') || nameLower.includes('chat')) {
      return 'ai';
    }
    if (nameLower.includes('code') || nameLower.includes('set') || nameLower.includes('transform')) {
      return 'transform';
    }
    return 'action';
  }

  /**
   * 기능 설명에서 키워드 추출
   */
  private extractKeywords(functionality: string): string[] {
    const functionalityLower = functionality.toLowerCase();
    const keywords: string[] = [];

    // 서비스 이름 매핑
    const serviceMap: Record<string, string[]> = {
      'slack': ['slack'],
      'gmail': ['gmail', 'google'],
      'sheets': ['googlesheets', 'google', 'spreadsheet'],
      'discord': ['discord'],
      'telegram': ['telegram'],
      'notion': ['notion'],
      'webhook': ['webhook', 'http'],
      'email': ['gmail', 'email', 'imap', 'smtp'],
      'ai': ['langchain', 'openai', 'gemini', 'anthropic', 'agent'],
      'gemini': ['gemini', 'google', 'langchain'],
      'gpt': ['openai', 'langchain'],
      'translate': ['code', 'http'], // 번역은 Code 노드나 HTTP로 처리
      'analyze': ['langchain', 'agent', 'code'] // 분석은 AI Agent나 Code로
    };

    // 서비스 키워드 추출
    for (const [key, values] of Object.entries(serviceMap)) {
      if (functionalityLower.includes(key)) {
        keywords.push(...values);
      }
    }

    // 기본 키워드도 추가
    const words = functionalityLower.split(/\s+/);
    keywords.push(...words.filter(w => w.length > 2));

    return [...new Set(keywords)]; // 중복 제거
  }

  /**
   * 검색 결과 중복 제거
   */
  private deduplicateResults(results: NodeSearchResult[]): NodeSearchResult[] {
    const seen = new Set<string>();
    const unique: NodeSearchResult[] = [];

    for (const result of results) {
      if (!seen.has(result.nodeName)) {
        seen.add(result.nodeName);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * n8n API 연결 실패시 사용할 기본 내장 노드 목록
   */
  private getBuiltInNodesList(): N8nNodeType[] {
    return [
      // Triggers
      { name: 'n8n-nodes-base.webhook', displayName: 'Webhook', description: 'HTTP 요청 수신', group: ['trigger'], version: 1, defaults: {}, inputs: [], outputs: ['main'] },
      { name: 'n8n-nodes-base.manualTrigger', displayName: 'Manual Trigger', description: '수동 실행', group: ['trigger'], version: 1, defaults: {}, inputs: [], outputs: ['main'] },
      { name: 'n8n-nodes-base.scheduleTrigger', displayName: 'Schedule Trigger', description: '스케줄 실행', group: ['trigger'], version: 1, defaults: {}, inputs: [], outputs: ['main'] },
      { name: 'n8n-nodes-base.emailReadImap', displayName: 'Email Read (IMAP)', description: '이메일 읽기', group: ['trigger'], version: 2, defaults: {}, inputs: [], outputs: ['main'] },

      // Actions
      { name: 'n8n-nodes-base.slack', displayName: 'Slack', description: 'Slack 메시지 전송', group: ['communication'], version: 2, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.gmail', displayName: 'Gmail', description: 'Gmail 전송', group: ['communication'], version: 2, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.discord', displayName: 'Discord', description: 'Discord 메시지', group: ['communication'], version: 2, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.telegram', displayName: 'Telegram', description: 'Telegram Bot', group: ['communication'], version: 1, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.googleSheets', displayName: 'Google Sheets', description: 'Google Sheets 작업', group: ['productivity'], version: 4, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.notion', displayName: 'Notion', description: 'Notion DB', group: ['productivity'], version: 2, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.httpRequest', displayName: 'HTTP Request', description: 'HTTP 요청', group: ['core'], version: 4, defaults: {}, inputs: ['main'], outputs: ['main'] },

      // Transform
      { name: 'n8n-nodes-base.code', displayName: 'Code', description: 'JavaScript/Python 코드', group: ['transform'], version: 2, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.set', displayName: 'Set', description: '데이터 설정', group: ['transform'], version: 3, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: 'n8n-nodes-base.itemLists', displayName: 'Item Lists', description: '배열 처리', group: ['transform'], version: 3, defaults: {}, inputs: ['main'], outputs: ['main'] },

      // AI/LLM
      { name: '@n8n/n8n-nodes-langchain.agent', displayName: 'AI Agent', description: 'AI Agent', group: ['ai'], version: 1, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini', displayName: 'Google Gemini Chat Model', description: 'Google Gemini', group: ['ai'], version: 1, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: '@n8n/n8n-nodes-langchain.lmChatOpenAi', displayName: 'OpenAI Chat Model', description: 'OpenAI GPT', group: ['ai'], version: 1, defaults: {}, inputs: ['main'], outputs: ['main'] },
      { name: '@n8n/n8n-nodes-langchain.lmChatAnthropic', displayName: 'Anthropic Chat Model', description: 'Claude', group: ['ai'], version: 1, defaults: {}, inputs: ['main'], outputs: ['main'] }
    ];
  }
}
