import { ENV } from '../../config/env';

export class ProfileService {
  /**
   * Persistir dados combinados do perfil (Nome, Objetivos, etc).
   */
  static async updateProfile(token: string, updates: { name?: string; goals?: string[]; [key: string]: any }): Promise<{ ok: boolean, profile?: any }> {
    try {
      const payload: any = {};
      if ('name' in updates) payload.name = updates.name;
      if ('goals' in updates) payload.goals = updates.goals;

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
}
