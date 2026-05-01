/**
 * AI Gateway Client — Frontend adapter for POST /ai-gateway/generate-insights.
 *
 * Consumes activeAnalysis (real or demo) and returns the canonical backend shape.
 * The frontend NEVER talks directly to OpenAI.
 */

import { Analysis } from '../../store/types';
import { useStore } from '../../store/useStore';
import { ENV } from '../../config/env';
import { supabase } from '../supabase';

async function getAuthTokenForApi(): Promise<{ token: string | null; source: string; isAuthenticated: boolean; hasSessionObj: boolean }> {
  const state = useStore.getState();
  const isAuthenticated = !!state.user && state.user.id !== 'guest' && state.user.id !== 'guest_stub';
  
  if (state.sessionToken) {
    return { token: state.sessionToken, source: 'store_sessionToken', isAuthenticated, hasSessionObj: false };
  }

  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || null;
    if (token) {
      useStore.getState().setSessionToken(token);
      return { token, source: 'supabase_getSession', isAuthenticated, hasSessionObj: !!data?.session };
    }
  } catch (err) {
    console.warn('[getAuthTokenForApi] Supabase getSession error:', err);
  }

  return { token: null, source: 'none', isAuthenticated, hasSessionObj: false };
}

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

export function normaliseAiGatewayError(errObj: any, status?: number, fallbackCode?: string): AiGatewayError & { provider: 'local_fallback', status?: number } {
  let code = errObj?.code || fallbackCode || 'UNKNOWN_ERROR';
  
  if (status && !errObj?.code) {
    if (status === 401) code = 'UNAUTHORIZED';
    else if (status === 403) code = 'FORBIDDEN';
    else if (status === 404) code = 'ROUTE_NOT_FOUND';
    else if (status >= 500) code = `SERVER_ERROR_${status}`;
    else code = `BACKEND_ERROR_${status}`;
  }

  return {
    ok: false,
    provider: 'local_fallback',
    error: {
      code,
      message: errObj?.message || 'Erro inesperado',
    },
    status
  };
}

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
    
    const { token, source, isAuthenticated, hasSessionObj } = await getAuthTokenForApi();

    const isDemo = analysis?.source === 'demo';
    const isDemoId = analysis?.id?.startsWith('demo_analysis') || false;
    const effectivelyDemo = isDemo || isDemoId;
    
    const endpointFinal = `${AI_GATEWAY_BASE_URL}/ai-gateway/generate-v2`;
    
    const dimensionsCount = Object.keys(context?.dimensions || {}).length;
    
    console.log(`[R5C9_AI_V2_PAYLOAD_CLIENT] endpoint=${endpointFinal} | hasToken=${!!token} | isDemo=${effectivelyDemo} | analysisSessionId=${analysis?.id} | analysisSessionIdIsNull=${analysis?.id == null} | analysisIdLooksDemo=${isDemoId} | hasSourcePayload=${!!context} | hasContextV2=true | hasDimensions=${dimensionsCount > 0} | dimensionsCount=${dimensionsCount} | hasSourceSnapshotHash=true | sourceSnapshotHashShort=${context ? JSON.stringify(context).length + 'B' : 'none'} | bodySizeApprox=${context ? JSON.stringify(context).length : 0}`);
    
    console.log(`[R5C8_AI_V2_REQUEST] endpoint=${endpointFinal} | hasToken=${!!token} | isDemo=${effectivelyDemo} | analysisId=${analysis?.id} | hasSourcePayload=${!!context} | sourceSnapshotHash=${context ? JSON.stringify(context).length + ' bytes' : 'none'}`);
    
    console.log(`[R5C7_AUTH_TOKEN] isAuthenticatedFromStore=${isAuthenticated} | hasSessionObject=${hasSessionObj} | hasSessionToken=${!!token} | hasSupabaseSession=${source==='supabase_getSession'} | tokenLength=${token ? token.length : 0} | tokenSource=${source} | endpoint=${endpointFinal} | willSendAuthorization=${!!token}`);
    console.log(`[R5C6_AI_V2_CLIENT] requestWillStart | isDemo=${isDemo} | hasToken=${!!token} | tokenLength=${token ? token.length : 0} | backendUrl=${AI_GATEWAY_BASE_URL} | endpointFinal=${endpointFinal}`);

    if (!AI_GATEWAY_BASE_URL) {
      console.log(`[R5C6_AI_V2_CLIENT] fallbackReason=BACKEND_URL_MISSING`);
      return { ok: false, error: { code: 'BACKEND_URL_MISSING', message: 'Backend URL não configurado' } };
    }

    if (!token) {
      console.log(`[R5C6_AI_V2_CLIENT] fallbackReason=NO_TOKEN`);
      return normaliseAiGatewayError({ code: 'NO_TOKEN', message: 'Autenticação necessária para a Leitura AI Avançada' });
    }

    const payload = {
      activeMemberId: analysis ? (analysis as any).userId || 'default' : 'default',
      analysisSessionId: isDemo ? null : (analysis ? analysis.id : null),
      forceRegenerate: false,
      sourcePayload: context
    };

    console.log(`[R5C6_AI_V2_CLIENT] requestStarted=true`);
    const res = await fetch(endpointFinal, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).catch(err => {
      console.error(`[R5C10_AI_V2_CLIENT] Fetch exception:`, err);
      throw err;
    });

    clearTimeout(timeoutId);

    if (requestId !== activeRequestId) return null;

    console.log(`[R5C10_AI_V2_CLIENT] responseStatus=${res.status} | responseOk=${res.ok}`);

    let json: any;
    let text = '';
    try {
      text = await res.text();
      if (text) {
        console.log(`[R5C10_AI_V2_CLIENT] responseTextFirstChars=${text.substring(0, 50)}...`);
        json = JSON.parse(text);
      }
    } catch (e) {
      // Ignora erro de parsing
    }

    if (!res.ok) {
      const errPayload = json?.error || json || {};
      const err = normaliseAiGatewayError(errPayload, res.status, `SERVER_ERROR_${res.status}`);
      console.log(`[R5C10_AI_V2_CLIENT] fallbackReason=${err.error.code}`);
      return err;
    }

    if (!json) {
      console.log(`[R5C10_AI_V2_CLIENT] fallbackReason=INVALID_RESPONSE`);
      return normaliseAiGatewayError({ code: 'INVALID_RESPONSE', message: 'Resposta não é JSON válido' }, res.status);
    }

    if (json.ok === false) {
      const backendCode = json.error?.code || 'RESPONSE_OK_FALSE_WITHOUT_CODE';
      console.log(`[R5C10_AI_V2_CLIENT] fallbackReason=${backendCode}`);
      return normaliseAiGatewayError(json.error, res.status, backendCode);
    }

    console.log(`[R5C10_AI_V2_CLIENT] SUCCESS | responseProvider=${json.provider} | engineSource=${json.meta?.engineSource}`);
    return json as AiGatewayResponse;
  } catch (err: any) {
    console.error(`[R5C10_AI_V2_CLIENT] errorName=${err.name} | errorMessage=${err.message} | fallbackReason=NETWORK_ERROR`);
    if (requestId !== activeRequestId) return null;
    return normaliseAiGatewayError({ code: 'NETWORK_ERROR', message: err.message || 'Falha de rede ou CORS' });
  }
}

/**
 * Cancel any in-flight request (used when activeAnalysis changes).
 */
export function cancelPendingInsights() {
  activeRequestId++;
}
