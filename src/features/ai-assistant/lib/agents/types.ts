// Types for AI assistant

export interface ActionCard {
  id: string;
  title: string;
  description?: string;
  buttons?: Array<{ label: string; payload: any }>;
  formFields?: Array<{ name: string; type: string; required?: boolean }>;
  approvalRequired?: boolean;
}

export interface AgentResponse {
  content: string;
  actions?: ActionCard[];
  confidence: number;       // 0-1
  clarificationNeeded?: boolean;
  reasoning?: string;
} 