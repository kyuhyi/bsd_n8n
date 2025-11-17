import { NextRequest, NextResponse } from 'next/server';
import { AIIntentAnalyzer } from '@/services/ai-intent-analyzer';
import type { IntentAnalysis } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalAnalysis, modificationRequest } = body;

    if (!originalAnalysis || !modificationRequest) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields', code: 'MISSING_FIELDS' } },
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

    const analyzer = new AIIntentAnalyzer(provider, apiKey || envKey);
    const modifiedAnalysis = await analyzer.analyzeWithModification(
      originalAnalysis as IntentAnalysis,
      modificationRequest
    );

    return NextResponse.json({
      success: true,
      data: modifiedAnalysis
    });
  } catch (error) {
    console.error('Modification API error:', error);
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
