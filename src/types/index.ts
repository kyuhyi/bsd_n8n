// AI Intent Analysis Types
export interface IntentAnalysis {
  intent: string;
  trigger: {
    service: string;
    event: string;
  };
  actions: Array<{
    service: string;
    action: string;
    data_fields: string[];
  }>;
  required_nodes: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimated_nodes: number;
}

// n8n Workflow Types
export interface N8nNode {
  id: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  name: string;
  credentials?: Record<string, string>;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nNode[];
  connections: Record<string, { main: N8nConnection[][] }>;
  active?: boolean;
  settings?: Record<string, any>;
}

// Workflow Generation Types
export interface WorkflowGenerationResult {
  workflow_json: N8nWorkflow;
  preview_url?: string;
  estimated_complexity: string;
}

// Execution Types
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  n8n_execution_id?: string;
  status: 'pending' | 'running' | 'success' | 'error';
  started_at?: Date;
  finished_at?: Date;
  error_details?: ErrorDetails;
  output_data?: Record<string, any>;
}

export interface ErrorDetails {
  node: string;
  message: string;
  stack?: string;
  input_data?: Record<string, any>;
}

// Debug Types
export interface DebugAnalysis {
  error_analysis: {
    error_type: string;
    affected_node: string;
    root_cause: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  suggested_fix: {
    description: string;
    code_changes?: Record<string, any>;
    manual_steps?: string[];
  };
  auto_apply: boolean;
}

// Template Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
  workflow_json: N8nWorkflow;
  usage_count: number;
  success_rate: number;
  required_credentials: string[];
  setup_guide: string;
  created_at: Date;
  created_by: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent_analysis?: IntentAnalysis;
    workflow_preview?: N8nWorkflow;
    execution_status?: WorkflowExecution;
    error_details?: ErrorDetails;
  };
}

// User Settings Types
export interface UserSettings {
  n8n_instance_url: string;
  n8n_api_key: string;
  preferred_ai_model: 'gpt-4' | 'claude-3';
  auto_test_workflows: boolean;
  auto_fix_errors: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}
