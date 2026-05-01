/**
 * AI Gateway Client — Frontend adapter for POST /ai-gateway/generate-insights.
 *
 * Consumes activeAnalysis (real or demo) and returns the canonical backend shape.
 * The frontend NEVER talks directly to OpenAI.
 */

import { Analysis } from '../../store/types';
import { useStore } from '../../store/useStore';
import { ENV } from '../../config/env';

// ── Backend canonical response shapes ──────────────────────────────────────────

export interface AiGatewaySuccess {
  ok: true;
  provider: string;
  model: string;
  insight: any; // O payload bruto R2, normalizado depois pelo adapter
  meta: {
    execMillis: number;
    tokensUsed: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    finishReason: string | null;
    engineSource?: string;
  };
}

export interface AiGatewayError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export type AiGatewayResponse = AiGatewaySuccess | AiGatewayError;

// ── Request builder ────────────────────────────────────────────────────────────

function buildRequestFromAnalysis(analysis: Analysis) {
  return {
    analysisId: analysis.id,
    selectedDate: analysis.analysisDate,
    measurements: analysis.measurements,
    events: analysis.ecosystemFacts,
    ecosystemFacts: analysis.ecosystemFacts,
    isDemo: analysis.source === 'demo',
    demoScenarioKey: analysis.demoScenarioKey ?? undefined,
  };
}

// ── Configuration ──────────────────────────────────────────────────────────────

const AI_GATEWAY_BASE_URL = ENV.BACKEND_URL || 'http://localhost:3000';

// ── Client ─────────────────────────────────────────────────────────────────────

let activeRequestId = 0;

/**
 * Call the AI Gateway backend to generate insights for the given analysis.
 * Returns null if the request was superseded by a newer call (race protection).
 */
export async function generateInsights(
  analysis: Analysis,
): Promise<AiGatewayResponse | null> {
  const requestId = ++activeRequestId;
  const body = buildRequestFromAnalysis(analysis);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout (OpenAI latency ~23-33s observed)

    const state = useStore.getState();
    const token = state.sessionToken;

    if (!token && analysis.source !== 'demo') {
      return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sessão expirada ou não autenticada' } };
    }

    const res = await fetch(`${AI_GATEWAY_BASE_URL}/ai/readings/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        activeMemberId: (analysis as any).userId || 'default',
        analysisSessionId: analysis.id !== 'demo-0' ? analysis.id : null,
        forceRegenerate: false,
        sourcePayload: body // Fallback payload R4A
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Race protection: if a newer request was fired, discard this result
    if (requestId !== activeRequestId) return null;

    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sessão não autorizada ou expirada' } };
      }
      if (res.status === 403) {
        return { ok: false, error: { code: 'FORBIDDEN', message: 'Análise não pertence ao utilizador' } };
      }
      if (res.status === 404) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'Análise não encontrada' } };
      }
      // If error payload is JSON, it will be caught in rawData, but we handle status first if it fails JSON parse
    }

    const rawData = await res.json();
    // Adaptador híbrido: Se o endpoint devolver o novo formato {ok: true, data: AiReadingRecord}, mapeamos de volta para o AiGatewayResponse esperado pelo frontend nesta fase
    if (rawData.ok && rawData.data) {
      return {
        ok: true,
        provider: rawData.data.provider || 'openai',
        model: rawData.data.model,
        insight: {
           summary: { title: 'Síntese do Momento', text: rawData.data.narrative, status: rawData.data.status, confidence: rawData.data.limitationsJson },
           dimensions: rawData.data.themesJson || []
        },
        meta: { execMillis: 0, tokensUsed: null, inputTokens: null, outputTokens: null, finishReason: 'hybrid-cache' }
      } as AiGatewaySuccess;
    }
    
    return rawData as AiGatewayResponse;
  } catch (err: any) {
    if (requestId !== activeRequestId) return null;

    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Falha de rede ao contactar o AI Gateway',
      },
    };
  }
}

export async function generateInsightsV2(context: any, analysis?: Analysis): Promise<AiGatewayResponse | null> {
  const requestId = ++activeRequestId;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    const state = useStore.getState();
    const token = state.sessionToken;

    if (!token) {
      return { ok: false, error: { code: 'NO_TOKEN', message: 'Autenticação necessária para a Leitura AI Avançada' } };
    }

    const payload = {
      activeMemberId: analysis ? (analysis as any).userId || 'default' : 'default',
      analysisSessionId: analysis && analysis.id !== 'demo-0' ? analysis.id : null,
      forceRegenerate: false,
      sourcePayload: context
    };

    const res = await fetch(`${AI_GATEWAY_BASE_URL}/ai-gateway/generate-v2`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (requestId !== activeRequestId) return null;

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('[R5C4_AI_V2_CLIENT] UNAUTHORIZED (401)');
        return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Não autorizado' } };
      }
      console.warn(`[R5C4_AI_V2_CLIENT] SERVER_ERROR (${res.status})`);
      return { ok: false, error: { code: `SERVER_ERROR_${res.status}`, message: 'Erro no servidor' } };
    }

    const json = await res.json() as AiGatewayResponse;
    console.log(`[R5C4_AI_V2_CLIENT] SUCCESS | engineSource=${(json as AiGatewaySuccess).meta?.engineSource}`);
    return json;
  } catch (err: any) {
    console.error('[R5C4_AI_V2_CLIENT] FETCH_ERROR:', err.message);
    if (requestId !== activeRequestId) return null;
    return { ok: false, error: { code: 'NETWORK_ERROR', message: err.message || 'Falha de rede' } };
  }
}

/**
 * Cancel any in-flight request (used when activeAnalysis changes).
 */
export function cancelPendingInsights() {
  activeRequestId++;
}
