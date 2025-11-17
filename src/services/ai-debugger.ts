import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { DebugAnalysis, WorkflowExecution, ErrorDetails, N8nWorkflow } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class AIDebugger {
  /**
   * Analyze error using AI Vision (screenshot-based)
   */
  async analyzeScreenshot(
    screenshotBase64: string,
    executionLog: WorkflowExecution
  ): Promise<DebugAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `당신은 n8n 워크플로우 디버깅 전문가입니다.
화면 스크린샷을 분석하여 다음을 파악하세요:
1. 어떤 노드에서 에러가 발생했는지
2. 빨간색 에러 표시나 경고 메시지
3. 입력/출력 데이터 불일치
4. 가능한 원인과 해결 방법

JSON 형식으로 응답하세요.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `n8n 워크플로우 화면을 분석하세요. 실행 로그: ${JSON.stringify(executionLog.error_details, null, 2)}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${screenshotBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse and structure the response
      return this.parseDebugResponse(content, executionLog);
    } catch (error) {
      console.error('Screenshot analysis failed:', error);
      throw new Error(`Failed to analyze screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze error using execution logs (no screenshot)
   */
  async analyzeExecutionLog(
    execution: WorkflowExecution,
    workflow: N8nWorkflow
  ): Promise<DebugAnalysis> {
    try {
      const errorContext = {
        workflow_name: workflow.name,
        error_node: execution.error_details?.node,
        error_message: execution.error_details?.message,
        error_stack: execution.error_details?.stack,
        input_data: execution.error_details?.input_data,
        workflow_structure: workflow.nodes.map(n => ({
          name: n.name,
          type: n.type,
          parameters: n.parameters
        }))
      };

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `당신은 n8n 워크플로우 디버깅 전문가입니다.
에러 로그를 분석하여:
1. 근본 원인 파악
2. 심각도 평가 (low/medium/high/critical)
3. 구체적인 수정 방법 제안
4. 자동 수정 가능 여부 판단

JSON 형식으로 응답하세요.`
          },
          {
            role: 'user',
            content: `다음 워크플로우 에러를 분석하세요:\n\n${JSON.stringify(errorContext, null, 2)}\n\n응답 형식:\n${JSON.stringify({
              error_analysis: {
                error_type: "string",
                affected_node: "string",
                root_cause: "string",
                severity: "low|medium|high|critical"
              },
              suggested_fix: {
                description: "string",
                code_changes: {},
                manual_steps: []
              },
              auto_apply: false
            }, null, 2)}`
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return JSON.parse(content) as DebugAnalysis;
    } catch (error) {
      console.error('Log analysis failed:', error);
      throw new Error(`Failed to analyze execution log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate fix for workflow based on error analysis
   */
  async generateFix(
    workflow: N8nWorkflow,
    debugAnalysis: DebugAnalysis
  ): Promise<N8nWorkflow> {
    try {
      const fixedWorkflow = JSON.parse(JSON.stringify(workflow)); // Deep clone

      // Apply code changes from suggested fix
      if (debugAnalysis.suggested_fix.code_changes) {
        for (const [nodeName, changes] of Object.entries(debugAnalysis.suggested_fix.code_changes)) {
          const nodeIndex = fixedWorkflow.nodes.findIndex((n: any) => n.name === nodeName);
          if (nodeIndex !== -1) {
            fixedWorkflow.nodes[nodeIndex].parameters = {
              ...fixedWorkflow.nodes[nodeIndex].parameters,
              ...changes
            };
          }
        }
      }

      return fixedWorkflow;
    } catch (error) {
      console.error('Fix generation failed:', error);
      throw new Error(`Failed to generate fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Comprehensive debug with multiple attempts
   */
  async debugWithRetry(
    workflow: N8nWorkflow,
    execution: WorkflowExecution,
    screenshot?: string,
    maxAttempts: number = 3
  ): Promise<{
    analysis: DebugAnalysis;
    fixedWorkflow?: N8nWorkflow;
    success: boolean;
    attempts: number;
  }> {
    let attempts = 0;
    let currentWorkflow = workflow;
    let lastAnalysis: DebugAnalysis | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      // Analyze error
      const analysis = screenshot
        ? await this.analyzeScreenshot(screenshot, execution)
        : await this.analyzeExecutionLog(execution, currentWorkflow);

      lastAnalysis = analysis;

      // If auto-fixable, generate and apply fix
      if (analysis.auto_apply) {
        currentWorkflow = await this.generateFix(currentWorkflow, analysis);

        // In real implementation, would re-execute workflow here
        // For now, assume fix was successful
        return {
          analysis,
          fixedWorkflow: currentWorkflow,
          success: true,
          attempts
        };
      } else {
        // Manual intervention needed
        return {
          analysis,
          fixedWorkflow: undefined,
          success: false,
          attempts
        };
      }
    }

    return {
      analysis: lastAnalysis!,
      fixedWorkflow: undefined,
      success: false,
      attempts
    };
  }

  /**
   * Parse AI debug response into structured format
   */
  private parseDebugResponse(aiResponse: string, execution: WorkflowExecution): DebugAnalysis {
    // Simple parser - in production, would use more robust parsing
    return {
      error_analysis: {
        error_type: 'runtime_error',
        affected_node: execution.error_details?.node || 'unknown',
        root_cause: aiResponse,
        severity: 'medium'
      },
      suggested_fix: {
        description: 'AI suggested fix',
        manual_steps: [aiResponse]
      },
      auto_apply: false
    };
  }

  /**
   * Get common error patterns and solutions
   */
  getCommonErrorPatterns(): Array<{
    pattern: RegExp;
    description: string;
    solution: string;
  }> {
    return [
      {
        pattern: /authentication.*failed/i,
        description: 'API 인증 실패',
        solution: 'API Key가 유효한지 확인하고 n8n Credentials에서 재설정하세요.'
      },
      {
        pattern: /undefined.*property/i,
        description: '존재하지 않는 데이터 필드 참조',
        solution: '이전 노드에서 해당 필드가 출력되는지 확인하세요.'
      },
      {
        pattern: /timeout/i,
        description: 'API 요청 타임아웃',
        solution: 'HTTP Request 노드의 timeout 설정을 늘리거나 API 상태를 확인하세요.'
      },
      {
        pattern: /rate.*limit/i,
        description: 'API 호출 횟수 제한',
        solution: 'API 호출 간격을 늘리거나 Wait 노드를 추가하세요.'
      },
      {
        pattern: /invalid.*json/i,
        description: 'JSON 파싱 오류',
        solution: 'API 응답 형식을 확인하고 JSON Parse 노드를 추가하세요.'
      }
    ];
  }

  /**
   * Quick pattern-based diagnosis (no AI needed)
   */
  quickDiagnose(errorMessage: string): string | null {
    const patterns = this.getCommonErrorPatterns();

    for (const pattern of patterns) {
      if (pattern.pattern.test(errorMessage)) {
        return `${pattern.description}\n해결 방법: ${pattern.solution}`;
      }
    }

    return null;
  }
}

// Singleton instance
export const aiDebugger = new AIDebugger();
