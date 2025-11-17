import axios, { AxiosInstance } from 'axios';
import type { N8nWorkflow, WorkflowExecution } from '@/types';

export class N8nApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(instanceUrl: string, apiKey: string) {
    this.baseUrl = instanceUrl.endsWith('/') ? instanceUrl.slice(0, -1) : instanceUrl;

    this.client = axios.create({
      baseURL: `${this.baseUrl}/api/v1`,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: N8nWorkflow): Promise<{ id: string; workflow: N8nWorkflow }> {
    try {
      const response = await this.client.post('/workflows', workflow);
      return {
        id: response.data.id,
        workflow: response.data
      };
    } catch (error: any) {
      console.error('Failed to create workflow:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Workflow data:', JSON.stringify(workflow, null, 2));

      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to create workflow: ${errorMessage}`);
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8nWorkflow> {
    try {
      const response = await this.client.get(`/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get workflow:', error);
      throw new Error(`Failed to get workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing workflow
   */
  async updateWorkflow(workflowId: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    try {
      const response = await this.client.patch(`/workflows/${workflowId}`, workflow);
      return response.data;
    } catch (error) {
      console.error('Failed to update workflow:', error);
      throw new Error(`Failed to update workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await this.client.delete(`/workflows/${workflowId}`);
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      throw new Error(`Failed to delete workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    try {
      await this.client.patch(`/workflows/${workflowId}`, { active: true });
    } catch (error) {
      console.error('Failed to activate workflow:', error);
      throw new Error(`Failed to activate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    try {
      await this.client.patch(`/workflows/${workflowId}`, { active: false });
    } catch (error) {
      console.error('Failed to deactivate workflow:', error);
      throw new Error(`Failed to deactivate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute workflow manually
   */
  async executeWorkflow(workflowId: string, data?: Record<string, any>): Promise<{ executionId: string }> {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/execute`, {
        data: data || {}
      });
      return {
        executionId: response.data.id
      };
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw new Error(`Failed to execute workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get execution details
   */
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    try {
      const response = await this.client.get(`/executions/${executionId}`);

      const execution = response.data;

      return {
        id: execution.id,
        workflow_id: execution.workflowId,
        n8n_execution_id: execution.id,
        status: execution.finished ? (execution.data.resultData.error ? 'error' : 'success') : 'running',
        started_at: new Date(execution.startedAt),
        finished_at: execution.stoppedAt ? new Date(execution.stoppedAt) : undefined,
        error_details: execution.data.resultData.error ? {
          node: execution.data.resultData.error.node,
          message: execution.data.resultData.error.message,
          stack: execution.data.resultData.error.stack,
          input_data: execution.data.resultData.error.inputData
        } : undefined,
        output_data: execution.data.resultData.runData
      };
    } catch (error) {
      console.error('Failed to get execution:', error);
      throw new Error(`Failed to get execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recent executions for a workflow
   */
  async getWorkflowExecutions(workflowId: string, limit: number = 10): Promise<WorkflowExecution[]> {
    try {
      const response = await this.client.get('/executions', {
        params: {
          workflowId,
          limit
        }
      });

      return response.data.data.map((exec: any) => ({
        id: exec.id,
        workflow_id: exec.workflowId,
        n8n_execution_id: exec.id,
        status: exec.finished ? (exec.data.resultData.error ? 'error' : 'success') : 'running',
        started_at: new Date(exec.startedAt),
        finished_at: exec.stoppedAt ? new Date(exec.stoppedAt) : undefined,
        error_details: exec.data.resultData.error ? {
          node: exec.data.resultData.error.node,
          message: exec.data.resultData.error.message
        } : undefined
      }));
    } catch (error) {
      console.error('Failed to get workflow executions:', error);
      throw new Error(`Failed to get workflow executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test n8n connection
   */
  async testConnection(): Promise<{ success: boolean; version?: string }> {
    try {
      // n8n doesn't have a dedicated health endpoint, so we'll try to fetch workflows
      const response = await this.client.get('/workflows', {
        params: { limit: 1 }
      });

      return {
        success: true,
        version: response.headers['x-n8n-version']
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Get workflow webhook URL
   */
  getWebhookUrl(workflowId: string, path: string): string {
    return `${this.baseUrl}/webhook/${path}`;
  }

  /**
   * Get workflow test webhook URL
   */
  getTestWebhookUrl(workflowId: string, path: string): string {
    return `${this.baseUrl}/webhook-test/${path}`;
  }

  /**
   * List all workflows
   */
  async listWorkflows(limit: number = 50): Promise<N8nWorkflow[]> {
    try {
      const response = await this.client.get('/workflows', {
        params: { limit }
      });

      return response.data.data;
    } catch (error) {
      console.error('Failed to list workflows:', error);
      throw new Error(`Failed to list workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Factory function to create n8n client
 */
export function createN8nClient(instanceUrl: string, apiKey: string): N8nApiClient {
  return new N8nApiClient(instanceUrl, apiKey);
}
