import { ENV } from '../../config/env';

export class ProfileService {
  /**
   * Persistir dados combinados do perfil (Nome, Objetivos, etc).
   */
  static async updateProfile(token: string, updates: { name?: string; goals?: string[] }): Promise<boolean> {
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        console.error('[ProfileService] Falha ao persistir profile:', response.status);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ProfileService] Erro de rede:', err);
      return false;
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
