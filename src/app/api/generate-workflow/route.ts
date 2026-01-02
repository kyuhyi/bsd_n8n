import { NextRequest, NextResponse } from 'next/server';
import { AIWorkflowBuilder } from '@/services/ai-workflow-builder';
import { Context7Service } from '@/services/context7-service';
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
    const context7ApiKey = request.headers.get('x-context7-api-key');
    const n8nUrl = request.headers.get('x-n8n-url');
    const n8nApiKey = request.headers.get('x-n8n-api-key');

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

    // Get Context7 enriched context if API key is provided
    let context7Context = '';
    if (context7ApiKey || process.env.CONTEXT7_API_KEY) {
      try {
        const context7 = new Context7Service(context7ApiKey || process.env.CONTEXT7_API_KEY!);
        context7Context = await context7.getWorkflowContext(
          user_input || '',
          (intent_analysis as IntentAnalysis).required_nodes
        );
        console.log('✅ Context7 enriched context fetched:', context7Context.substring(0, 200));
      } catch (error) {
        console.warn('⚠️ Failed to fetch Context7 context, continuing without it:', error);
        // Continue without Context7 context - it's optional
      }
    }

    // Create workflow builder with n8n credentials if available
    const finalN8nUrl = n8nUrl || process.env.N8N_INSTANCE_URL;
    const finalN8nApiKey = n8nApiKey || process.env.N8N_API_KEY;

    const builder = new AIWorkflowBuilder(
      provider,
      apiKey || envKey,
      finalN8nUrl || undefined,
      finalN8nApiKey || undefined
    );

    console.log('🔍 n8n Node Registry:', finalN8nUrl && finalN8nApiKey ? 'Enabled' : 'Disabled (using fallback nodes)');

    const workflow = await builder.buildWorkflow(
      intent_analysis as IntentAnalysis,
      user_input || '',
      context7Context
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
