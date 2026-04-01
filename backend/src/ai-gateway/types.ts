/**
 * AI Gateway Type System v1.0
 * For governed and audit-ready OpenAI integration.
 */

export interface PromptInput {
  promptCode: string;
  version: string;
  variables: Record<string, any>;
  userId: string;
  sessionId?: string;
  bypassCache?: boolean;
}

export interface PromptResult {
  requestId: string;
  promptCode: string;
  version: string;
  content: any; // O conteúdo estruturado resultante
  metadata: {
    model: string;
    tokensUsed: number;
    execMillis: number;
    finishReason: string;
    timestamp: number;
  };
}

export interface PromptDefinition {
  id: string;
  code: string;
  version: string;
  template: string; // O prompt system real com placeholders
  params: {
    temperature: number;
    maxTokens: number;
    stopSequences: string[];
    responseFormat: 'text' | 'json';
  };
}
