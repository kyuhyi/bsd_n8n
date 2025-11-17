import { NextRequest, NextResponse } from 'next/server';
import { AIIntentAnalyzer } from '@/services/ai-intent-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid input', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    // Get provider and API key from headers
    const provider = (request.headers.get('x-ai-provider') || 'openai') as 'openai' | 'xai' | 'gemini' | 'anthropic' | 'deepseek';
    const apiKey = request.headers.get('x-api-key');

    // Check for API key in environment if not provided
    const envKey =
      provider === 'openai' ? process.env.OPENAI_API_KEY :
      provider === 'xai' ? process.env.XAI_API_KEY :
      provider === 'gemini' ? process.env.GEMINI_API_KEY :
      provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
      provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY :
      undefined;

    if (!apiKey && !envKey) {
      return NextResponse.json(
        { success: false, error: { message: `${provider.toUpperCase()} API key is required`, code: 'MISSING_API_KEY' } },
        { status: 401 }
      );
    }

    const analyzer = new AIIntentAnalyzer(provider, apiKey || envKey);
    const analysis = await analyzer.analyzeIntent(input);

    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Intent analysis API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'ANALYSIS_FAILED'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const analyzer = new AIIntentAnalyzer();
    const examples = analyzer.getExampleIntents();

    return NextResponse.json({
      success: true,
      data: { examples }
    });
  } catch (error) {
    console.error('Get examples API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'GET_EXAMPLES_FAILED'
        }
      },
      { status: 500 }
    );
  }
}
