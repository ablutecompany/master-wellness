import { ENV } from '../../config/env';

export class ProfileService {
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
