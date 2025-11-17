import { NextRequest, NextResponse } from 'next/server';
import { AIWorkflowBuilder } from '@/services/ai-workflow-builder';
import type { IntentAnalysis } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent_analysis, user_input } = body;

    if (!intent_analysis) {
      return NextResponse.json(
        { success: false, error: { message: 'Intent analysis is required', code: 'MISSING_ANALYSIS' } },
        { status: 400 }
      );
    }

    // Get AI provider and API key from headers
    const provider = (request.headers.get('x-ai-provider') || 'openai') as 'openai' | 'xai' | 'gemini' | 'anthropic' | 'deepseek';
    const apiKey = request.headers.get('x-api-key');

    // Environment variable fallback
    const envKey =
      provider === 'openai' ? process.env.OPENAI_API_KEY :
      provider === 'xai' ? process.env.XAI_API_KEY :
      provider === 'gemini' ? process.env.GEMINI_API_KEY :
      provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
      provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY :
      undefined;

    if (!apiKey && !envKey) {
      return NextResponse.json(
        { success: false, error: { message: 'API key is required', code: 'MISSING_API_KEY' } },
        { status: 401 }
      );
    }

    const builder = new AIWorkflowBuilder(provider, apiKey || envKey);
    const workflow = await builder.buildWorkflow(
      intent_analysis as IntentAnalysis,
      user_input || ''
    );

    return NextResponse.json({
      success: true,
      data: {
        workflow_json: workflow,
        estimated_complexity: intent_analysis.complexity
      }
    });
  } catch (error) {
    console.error('Workflow generation API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'GENERATION_FAILED',
          details: error instanceof Error ? error.stack : undefined
        }
      },
      { status: 500 }
    );
  }
}
