import { MiniAppMessage, MiniAppMessageType, ContributionEventType, AppContributionEvent } from '../miniapps/types';

export class SuperAppBridge {
  static isValidMessage(data: any): data is MiniAppMessage {
    const validTypes: MiniAppMessageType[] = [
      'app_ready', 
      'context_request', 
      'contribution_event', 
      'analytics_event', 
      'close_app'
    ];
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      validTypes.includes(data.type)
    );
  }

  static isValidContribution(payload: any): payload is { eventType: ContributionEventType; [key: string]: any } {
    const validTypes: ContributionEventType[] = [
      'preference_changed',
      'context_note_added',
      'meal_accepted',
      'meal_rejected',
      'ingredient_disliked',
      'sleep_pattern_changed',
      'sleep_debt_detected',
      'fatigue_context_added'
    ];
    return payload && validTypes.includes(payload.eventType);
  }

  static parseMessage(raw: string): MiniAppMessage | null {
    try {
      const data = JSON.parse(raw);
      
      // Fallback para formato antigo { event, payload }
      if (data.event && !data.type) {
        return { 
          type: data.event as any, 
          payload: data.payload,
          timestamp: Date.now(),
          version: '1.0-legacy'
        };
      }

      // Hardening do envelope com defaults se faltarem campos
      return {
        type: data.type,
        payload: data.payload,
        appId: data.appId,
        timestamp: data.timestamp || Date.now(),
        version: data.version || '1.0',
        source: data.source || 'miniapp',
        sessionId: data.sessionId
      };
    } catch {
      return null;
    }
  }

  static getInjectionScript(payload: any): string {
    const payloadJson = JSON.stringify(payload ?? {});
    return `
      (function() {
        const payload = ${payloadJson};
        window.__ablute_context__ = payload;
        
        window.ablute = {
          version: '1.2',
          appId: payload.appId,
          contextVersion: payload.contextVersion,
          
          // Contrato Principal: Domain Packages
          domainPackages: payload.domainPackages || [],

          // Helpers legados para compatibilidade
          getUser:   function() { return payload.profileContext || {}; },
          getHealth: function() { return payload.healthSummaryContext || {}; },

          // Comunicação
          emit: function(type, data) {
            try {
              var msg = JSON.stringify({ 
                type: type, 
                payload: data,
                appId: payload.appId,
                timestamp: Date.now(),
                version: '1.2',
                source: 'bridge'
              });
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(msg);
              }
            } catch(e) {
              console.error('[Ablute Bridge] Error emitting:', e);
            }
          }
        };
        
        window.dispatchEvent(new CustomEvent('ablute:ready', { detail: window.ablute }));
        console.log('[Ablute Bridge] Initialized v1.2 - domainPackages: ' + (window.ablute.domainPackages.length));
        return true;
      })();
    `;
  }
}
