import { NextRequest, NextResponse } from 'next/server';
import { createN8nClient } from '@/services/n8n-api-client';
import type { N8nWorkflow } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow_json, n8n_instance, api_key } = body;

    if (!workflow_json || !n8n_instance || !api_key) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Missing required fields', code: 'MISSING_FIELDS' }
        },
        { status: 400 }
      );
    }

    const n8nClient = createN8nClient(n8n_instance, api_key);

    // Test connection first
    const connectionTest = await n8nClient.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Failed to connect to n8n instance', code: 'CONNECTION_FAILED' }
        },
        { status: 500 }
      );
    }

    // Create workflow
    const result = await n8nClient.createWorkflow(workflow_json as N8nWorkflow);

    // Get webhook URL if workflow has webhook trigger
    const webhookNode = workflow_json.nodes.find(
      (n: any) => n.type === 'n8n-nodes-base.webhook'
    );

    let webhook_url: string | undefined;
    if (webhookNode) {
      webhook_url = n8nClient.getWebhookUrl(
        result.id,
        webhookNode.parameters.path
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        workflow_id: result.id,
        status: 'deployed',
        webhook_url,
        n8n_version: connectionTest.version
      }
    });
  } catch (error) {
    console.error('Deploy workflow API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'DEPLOY_FAILED'
        }
      },
      { status: 500 }
    );
  }
}
