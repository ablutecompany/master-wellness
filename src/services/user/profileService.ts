import { ENV } from '../../config/env';

export class ProfileService {
  /**
   * Persistir dados combinados do perfil (Nome, Objetivos, etc).
   */
  static async updateProfile(token: string, updates: { name?: string; goals?: string[]; [key: string]: any }): Promise<{ ok: boolean, profile?: any }> {
    try {
      const allowedKeys = ['name', 'goals', 'dateOfBirth', 'height', 'sex', 'timezone', 'country', 'weight'];
      const payload: any = {};
      for (const k of allowedKeys) {
        if (k in updates) payload[k] = updates[k];
      }

      console.warn(`[DEV NAME 3] payload to backend:`, JSON.stringify(payload));

      const response = await fetch(`${ENV.BACKEND_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : "{}"
      });

      if (!response.ok) {
        console.error('[ProfileService] Falha ao persistir profile:', response.status);
        return { ok: false };
      }

      const data = await response.json();
      console.warn(`[DEV NAME 4] backend response:`, JSON.stringify(data));
      
      if (!data.ok) {
        console.error('[ProfileService] Backend falhou com envelope ok:false:', JSON.stringify(data));
        return { ok: false };
      }
      
      return { ok: true, profile: data.profile };
    } catch (err) {
      console.error('[ProfileService] Erro de rede:', err);
      return { ok: false };
    }
  }

  /**
   * Persistir o ID da análise activa no perfil do utilizador.
   * Apenas para utilizadores autenticados e fora do modo demo.
   */
  static async updateActiveAnalysis(token: string, analysisId: string | null): Promise<boolean> {
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/user/profile/active-analysis`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ analysisId })
      });

      if (!response.ok) {
        console.error('[ProfileService] Falha ao persistir active_analysis_id:', response.status);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ProfileService] Erro de rede:', err);
      return false;
    }
  }

  /**
   * Persistir o Household.
   */
  static async patchHousehold(token: string, household: any): Promise<{ ok: boolean, household?: any }> {
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/user/household`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(household)
      });
      if (!response.ok) return { ok: false };
      const data = await response.json();
      return { ok: data.ok, household: data.household };
    } catch (err) {
      console.error('[ProfileService] Erro patchHousehold:', err);
      return { ok: false };
    }
  }

  /**
   * Ler o Household do backend.
   */
  static async getHousehold(token: string): Promise<{ ok: boolean, household?: any }> {
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/user/household`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) return { ok: false };
      const data = await response.json();
      return { ok: data.ok, household: data.household };
    } catch (err) {
      console.error('[ProfileService] Erro getHousehold:', err);
      return { ok: false };
    }
  }

  static async createInvite(token: string, memberId: string, email: string) {
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/user/household/invite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ memberId, email })
      });
      if (!response.ok) return { ok: false };
      const data = await response.json();
      return { ok: data.ok, household: data.household };
    } catch (err) {
      console.error('[ProfileService] Erro createInvite:', err);
      return { ok: false };
    }
  }

  static async acceptInvite(token: string, inviteId: string) {
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/user/household/accept-invite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteId })
      });
      if (!response.ok) return { ok: false };
      const data = await response.json();
      return { ok: data.ok, household: data.household };
    } catch (err) {
      console.error('[ProfileService] Erro acceptInvite:', err);
      return { ok: false };
    }
  }

  /**
   * Ler a lista de análises reais do backend.
   */
  static async getAnalyses(token: string): Promise<{ ok: boolean, analyses?: any[] }> {
    try {
      console.log('[PROBE_SYNC] GET /analyses - Início do pedido');
      const response = await fetch(`${ENV.BACKEND_URL}/analyses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[PROBE_SYNC] GET /analyses - Status:', response.status);
      
      if (!response.ok) {
        console.error('[PROBE_SYNC] GET /analyses - Falha no pedido:', response.status);
        return { ok: false };
      }
      
      const data = await response.json();
      console.log('[PROBE_SYNC] GET /analyses - Payload bruto:', JSON.stringify(data));
      
      if (Array.isArray(data)) {
        console.log('[PROBE_SYNC] GET /analyses - Resposta é array, length:', data.length);
        return { ok: true, analyses: data };
      }
      
      const analyses = data.analyses || [];
      console.log('[PROBE_SYNC] GET /analyses - Resposta é objecto, analyses.length:', analyses.length);
      return { ok: !!data, analyses };
    } catch (err) {
      console.error('[PROBE_SYNC] GET /analyses - Erro de rede/runtime:', err);
      return { ok: false };
    }
  }

}

