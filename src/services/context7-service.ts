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
      // Extract library/service names from required nodes
      const libraries = this.extractLibrariesFromNodes(requiredNodes);

      if (libraries.length === 0) {
        return '';
      }

      const contextParts: string[] = [];

      // Fetch documentation for each library
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

      return contextParts.join('');
    } catch (error) {
      console.error('Failed to get workflow context:', error);
      return '';
    }
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
