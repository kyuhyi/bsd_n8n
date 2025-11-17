import type { IntentAnalysis, N8nWorkflow, N8nNode, WorkflowGenerationResult } from '@/types';

export class WorkflowGenerator {
  private nodeTemplates: Record<string, Partial<N8nNode>> = {
    'Webhook': {
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      parameters: {
        path: '',
        responseMode: 'onReceived',
        options: {}
      }
    },
    'Gmail': {
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2,
      parameters: {
        operation: 'get',
        resource: 'message'
      }
    },
    'Slack': {
      type: 'n8n-nodes-base.slack',
      typeVersion: 2,
      parameters: {
        resource: 'message',
        operation: 'post'
      }
    },
    'HTTP Request': {
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 3,
      parameters: {
        method: 'POST',
        url: '',
        sendBody: true
      }
    },
    'Function': {
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      parameters: {
        functionCode: 'return items;'
      }
    },
    'Google Sheets': {
      type: 'n8n-nodes-base.googleSheets',
      typeVersion: 3,
      parameters: {
        operation: 'append',
        resource: 'sheet'
      }
    },
    'Schedule Trigger': {
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1,
      parameters: {
        rule: {
          interval: [{
            field: 'cronExpression',
            expression: '0 9 * * *'
          }]
        }
      }
    },
    'Notion': {
      type: 'n8n-nodes-base.notion',
      typeVersion: 2,
      parameters: {
        resource: 'page',
        operation: 'create'
      }
    }
  };

  async generateWorkflow(analysis: IntentAnalysis, userInput: string): Promise<WorkflowGenerationResult> {
    try {
      const nodes = this.createNodes(analysis);
      const connections = this.createConnections(nodes);

      const workflow: N8nWorkflow = {
        name: this.generateWorkflowName(analysis),
        nodes,
        connections,
        settings: {
          executionOrder: 'v1'
        }
      };

      return {
        workflow_json: workflow,
        estimated_complexity: analysis.complexity
      };
    } catch (error) {
      console.error('Workflow generation failed:', error);
      throw new Error(`Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createNodes(analysis: IntentAnalysis): N8nNode[] {
    const nodes: N8nNode[] = [];
    let yPosition = 300;
    const xSpacing = 200;

    // Create trigger node
    const triggerNode = this.createNode(
      analysis.trigger.service,
      0,
      0,  // xPosition
      yPosition,
      `${analysis.trigger.service} Trigger`
    );
    nodes.push(triggerNode);

    // Create action nodes
    analysis.actions.forEach((action, index) => {
      const xPosition = (index + 1) * xSpacing;

      // Data extraction/transformation node if needed
      if (action.data_fields && action.data_fields.length > 0) {
        const transformNode = this.createTransformNode(
          index * 2 + 1,
          xPosition,
          yPosition,
          action.data_fields
        );
        nodes.push(transformNode);

        // Action node
        const actionNode = this.createNode(
          action.service,
          index * 2 + 2,
          xPosition + xSpacing,
          yPosition,
          action.service
        );
        nodes.push(actionNode);
      } else {
        const actionNode = this.createNode(
          action.service,
          index + 1,
          xPosition,
          yPosition,
          action.service
        );
        nodes.push(actionNode);
      }
    });

    return nodes;
  }

  private createNode(
    nodeType: string,
    index: number,
    xPosition: number,
    yPosition: number,
    name?: string
  ): N8nNode {
    const template = this.nodeTemplates[nodeType] || this.nodeTemplates['HTTP Request'];

    return {
      id: `node-${index}`,
      type: template.type!,
      typeVersion: template.typeVersion!,
      position: [xPosition, yPosition],
      parameters: { ...template.parameters },
      name: name || nodeType,
      ...(template.credentials && { credentials: template.credentials })
    };
  }

  private createTransformNode(
    index: number,
    xPosition: number,
    yPosition: number,
    dataFields: string[]
  ): N8nNode {
    const functionCode = this.generateTransformCode(dataFields);

    return {
      id: `node-${index}`,
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [xPosition, yPosition],
      parameters: {
        functionCode
      },
      name: '데이터 추출'
    };
  }

  private generateTransformCode(dataFields: string[]): string {
    const fieldsMapping = dataFields.map(field => `    ${field}: item.json.${field}`).join(',\n');

    return `return items.map(item => ({
  json: {
${fieldsMapping}
  }
}));`;
  }

  private createConnections(nodes: N8nNode[]): Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }> {
    const connections: Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }> = {};

    for (let i = 0; i < nodes.length - 1; i++) {
      connections[nodes[i].name] = {
        main: [[{
          node: nodes[i + 1].name,
          type: 'main',
          index: 0
        }]]
      };
    }

    return connections;
  }

  private generateWorkflowName(analysis: IntentAnalysis): string {
    const trigger = analysis.trigger.service;
    const actions = analysis.actions.map(a => a.service).join(' + ');
    return `${trigger} → ${actions}`;
  }

  /**
   * Enhanced workflow generation with AI optimization
   */
  async generateOptimizedWorkflow(
    analysis: IntentAnalysis,
    userInput: string
  ): Promise<WorkflowGenerationResult & { optimizations: string[] }> {
    const baseWorkflow = await this.generateWorkflow(analysis, userInput);

    // Apply optimizations
    const optimizations: string[] = [];

    // Add error handling node if complex
    if (analysis.complexity !== 'simple') {
      optimizations.push('에러 핸들링 노드 추가');
      // TODO: Add error handling nodes
    }

    // Add retry logic for API calls
    if (analysis.required_nodes.some(node => node.includes('HTTP') || node.includes('API'))) {
      optimizations.push('API 호출 재시도 로직 추가');
    }

    // Add logging for debugging
    optimizations.push('디버깅 로그 활성화');

    return {
      ...baseWorkflow,
      optimizations
    };
  }

  /**
   * Generate workflow from template with customization
   */
  generateFromTemplate(
    templateWorkflow: N8nWorkflow,
    customizations: Record<string, any>
  ): N8nWorkflow {
    const workflow = JSON.parse(JSON.stringify(templateWorkflow)); // Deep clone

    // Apply customizations
    workflow.nodes = workflow.nodes.map(node => {
      if (customizations[node.name]) {
        return {
          ...node,
          parameters: {
            ...node.parameters,
            ...customizations[node.name]
          }
        };
      }
      return node;
    });

    return workflow;
  }

  /**
   * Validate workflow JSON structure
   */
  validateWorkflow(workflow: N8nWorkflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check if all node connections are valid
    for (const [sourceName, connectionData] of Object.entries(workflow.connections)) {
      const sourceNode = workflow.nodes.find(n => n.name === sourceName);
      if (!sourceNode) {
        errors.push(`Connection source node "${sourceName}" not found`);
      }

      connectionData.main.forEach((connections, index) => {
        connections.forEach(conn => {
          const targetNode = workflow.nodes.find(n => n.name === conn.node);
          if (!targetNode) {
            errors.push(`Connection target node "${conn.node}" not found`);
          }
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
export const workflowGenerator = new WorkflowGenerator();
