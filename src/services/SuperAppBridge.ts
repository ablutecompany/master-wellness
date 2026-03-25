import { WebViewMessageEvent } from 'react-native-webview';

export interface MiniAppMessage {
  type: string;
  payload?: any;
}

export class SuperAppBridge {
  static handleMessage(event: any, appId: string) {
    try {
      const data = typeof event.nativeEvent?.data === 'string' 
        ? event.nativeEvent.data 
        : event.data;

      if (!data || typeof data !== 'string') return;
      
      const message: MiniAppMessage = JSON.parse(data);
      console.log(`[SuperAppBridge] Message from ${appId}:`, message);

      switch (message.type) {
        case 'TELEMETRY':
          // Log analytics
          break;
        case 'GET_USER':
          // Reply logic...
          break;
        default:
          console.warn(`[SuperAppBridge] Unknown message type: ${message.type}`);
      }
    } catch (e) {
      // Ignore non-JSON messages (noise)
    }
  }

  static getInjectionScript(user: any) {
    return `
      window.AbluteShell = {
        user: ${JSON.stringify(user)},
        send: (type, payload) => {
          const data = JSON.stringify({ type, payload });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(data);
          } else if (window.parent !== window) {
            window.parent.postMessage(data, '*');
          }
        }
      };
      console.log('[AbluteShell] Bridge initialized');
      true;
    `;
  }
}
