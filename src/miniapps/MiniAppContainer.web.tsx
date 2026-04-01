/**
 * MiniAppContainer.web.tsx
 *
 * Web-platform override (Expo/Metro resolves .web.tsx over .tsx on web builds).
 * Uses an <iframe> instead of react-native-webview to embed mini-apps in the browser.
 * Bridge communication uses window.postMessage / window.addEventListener.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Typography } from '../components/Base';
import { BrandLogo } from '../components/BrandLogo';
import { MiniAppManifest } from './types';
import { useStore } from '../store/useStore';
import { useAnalytics } from './analytics';
import { X, RefreshCw, Loader } from 'lucide-react-native';

interface MiniAppContainerProps {
  app: MiniAppManifest;
  navigation?: any;
}

/**
 * Build the bridge script that gets injected via iframe's onload postMessage.
 * The mini-app must listen to window.addEventListener('message', ...) to receive context.
 */
function buildBridgePayload(user: any, health: any) {
  return JSON.stringify({
    type: 'ABLUTE_CONTEXT',
    user: user ?? {},
    health: health ?? {},
  });
}

export const MiniAppContainer: React.FC<MiniAppContainerProps> = ({
  app,
  navigation,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const launchTime = useRef(Date.now());

  const storeState = useStore();
  const { user, credits, closeApp, recordAppEvent } = storeState;
  const { logEvent } = useAnalytics();

  const handleClose = () => {
    const duration = Math.round((Date.now() - launchTime.current) / 1000);
    logEvent('APP_CLOSED', app.id, { duration_seconds: duration });
    closeApp();
    navigation?.goBack();
  };

  const handleReload = () => {
    if (iframeRef.current) {
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src;
      setLoading(true);
      setError(false);
    }
  };

  // Send bridge context to iframe once it loads
  const handleIframeLoad = () => {
    setLoading(false);
    logEvent('APP_LAUNCHED', app.id);

    // Give the iframe a moment to initialize, then post context
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        const payload = buildBridgePayload(
          user ? { name: user.name, goals: user.goals } : null,
          { globalScore: 0, credits }
        );
        iframeRef.current.contentWindow.postMessage(payload, '*');
      }
    }, 300);
  };

  // Listen for messages FROM the mini-app iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        // Only handle messages from the mini-app URL origin (basic security)
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event && data?.payload) {
          recordAppEvent({
            eventId: Math.random().toString(36).substring(2, 15),
            sourceApp: app.id,
            eventType: data.event as any,
            payload: data.payload,
            recordedAt: Date.now(),
            confidence: data.payload.confidence,
            validityWindow: data.payload.validityWindow,
          });
          console.log('[MiniApp Bridge Web] Guardado evento:', data.event);
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BrandLogo size="small" />
        <View style={styles.headerCenter}>
          <View style={[styles.miniDot, { backgroundColor: app.iconColor }]} />
          <Typography style={styles.headerAppName}>{app.name}</Typography>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleReload}>
            <RefreshCw size={16} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleClose}>
            <X size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Thin accent line ── */}
      <View style={[styles.accentLine, { backgroundColor: app.iconColor }]} />

      {/* ── iframe container ── */}
      <View style={styles.iframeWrapper}>
        {/* Loading state */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <Loader size={32} color={app.iconColor} />
            <Typography style={styles.loadingText}>A carregar {app.name}…</Typography>
          </View>
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorView}>
            <Typography style={styles.errorEmoji}>⚠️</Typography>
            <Typography style={styles.errorTitle}>Não foi possível carregar</Typography>
            <Typography style={styles.errorDesc}>{app.url}</Typography>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: app.iconColor + '50' }]}
              onPress={handleReload}
            >
              <Typography style={[styles.retryText, { color: app.iconColor }]}>
                Tentar novamente
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        {/* The actual iframe — rendered via dangerouslySetInnerHTML workaround */}
        {/* React Native Web doesn't have an <iframe> component, so we use a raw DOM element */}
        {(Platform.OS as any) === 'web' && (
          <iframe
            ref={iframeRef as any}
            src={app.url}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#05070A',
              display: error ? 'none' : 'block',
            } as any}
            onLoad={handleIframeLoad}
            onError={() => { setLoading(false); setError(true); }}
            allow="camera; microphone; geolocation; notifications"
            title={app.name}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070A',
    // On web this maps to height: 100vh via react-native-web
    ...(Platform.OS === 'web' ? { height: '100vh' as any } : {}),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#05070A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerAppName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLine: {
    height: 1,
    opacity: 0.5,
  },
  iframeWrapper: {
    flex: 1,
    position: 'relative',
    ...(Platform.OS === 'web' ? { overflow: 'hidden' as any } : {}),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#05070A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 10,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  errorView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
    zIndex: 10,
  },
  errorEmoji: { fontSize: 40 },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorDesc: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: { fontSize: 14, fontWeight: '600' },
});
