/**
 * AI Gateway Client — Frontend adapter for POST /ai-gateway/generate-insights.
 *
 * Consumes activeAnalysis (real or demo) and returns the canonical backend shape.
 * The frontend NEVER talks directly to OpenAI.
 */

import { Analysis } from '../../store/types';

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

const AI_GATEWAY_BASE_URL =
  typeof window !== 'undefined' && (window as any).__AI_GATEWAY_URL
    ? (window as any).__AI_GATEWAY_URL
    : 'http://localhost:3000';

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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(`${AI_GATEWAY_BASE_URL}/ai-gateway/generate-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Race protection: if a newer request was fired, discard this result
    if (requestId !== activeRequestId) return null;

    const data: AiGatewayResponse = await res.json();
    return data;
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

/**
 * Cancel any in-flight request (used when activeAnalysis changes).
 */
export function cancelPendingInsights() {
  activeRequestId++;
}
