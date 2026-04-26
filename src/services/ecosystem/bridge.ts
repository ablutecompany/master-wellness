import { useStore } from '../../store/useStore';
import { ContributionEvent, SessionSummary } from '../../store/ecosystem-contracts';

/**
 * @file bridge.ts
 * @description A bridge real operacional entre a Shell (ablute_ wellness) e as Mini-Apps.
 * Implementa os canais de entrada (ingestão) e saída (contexto).
 */

export class EcosystemBridge {
  private static instance: EcosystemBridge;

  private constructor() {}

  public static getInstance(): EcosystemBridge {
    if (!EcosystemBridge.instance) {
      EcosystemBridge.instance = new EcosystemBridge();
    }
    return EcosystemBridge.instance;
  }

  /**
   * Envia um evento de contribuição para a shell.
   * Utilizado pelas mini-apps para reportar novos factos/biomarcadores.
   */
  public dispatchContribution(event: ContributionEvent): void {
    const store = useStore.getState();
    
    store.addEcosystemLog({
      type: 'incoming',
      appId: event.miniapp_id,
      message: `Bridge: Recebido evento ${event.event_type}`,
      status: 'success'
    });

    store.ingestContributionEvent(event);
  }

  /**
   * Envia um sumário de sessão para a shell.
   * Utilizado no fecho de uma mini-app para reporte de consumo e resultados.
   */
  public dispatchSessionSummary(summary: SessionSummary): void {
    const store = useStore.getState();

    store.addEcosystemLog({
      type: 'incoming',
      appId: summary.miniapp_id,
      message: `Bridge: Recebido sumário de sessão`,
      status: 'success'
    });

    store.ingestSessionSummary(summary);
  }

  /**
   * Obtém o bundle de contexto atualizado e governado.
   * A mini-app usa isto para se adaptar ao estado biográfico do utilizador.
   */
  public getContextBundle() {
    const store = useStore.getState();
    
    const bundle = store.lastContextBundle;
    
    // Log de saída governada
    store.addEcosystemLog({
      type: 'outgoing',
      message: `Bridge: Context Bundle entregue (${bundle?.bundle_status || 'sem bundle'})`,
      status: 'success'
    });

    return bundle;
  }
}

export const bridge = EcosystemBridge.getInstance();
