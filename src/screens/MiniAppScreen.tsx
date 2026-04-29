// @ts-nocheck
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { Container, Typography } from '../components/Base';
import { SuperAppBridge } from '../services/SuperAppBridge';
import { theme } from '../theme';
import { X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export const MiniAppScreen: React.FC<any> = ({ route, navigation }) => {
  const { appId, name, url } = route.params || {};
  console.log('[MiniAppScreen] Params:', { appId, name, url });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handler = (event: MessageEvent) => {
        SuperAppBridge.handleMessage(event, appId);
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }
  }, [appId]);

  // Mock user data for the bridge
  const mockUser = { id: 'user_123', name: 'Nuno', preferences: { theme: 'dark' } };

  if (!url) {
    return (
      <Container safe style={styles.container}>
        <Typography>Erro: URL da Mini-App não encontrada.</Typography>
      </Container>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <Container safe style={styles.container} withAura={false}>
        <View style={styles.header}>
          <Typography variant="h3" style={styles.title}>{name}</Typography>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.webviewContainer}>
          <iframe 
            src={url} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title={name}
            onLoad={() => setLoading(false)}
          />
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          )}
        </View>
      </Container>
    );
  }

  return (
    <Container safe style={styles.container} withAura={false}>
      <View style={styles.header}>
        <Typography variant="h3" style={styles.title}>{name}</Typography>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: url }}
          onMessage={(event) => SuperAppBridge.handleMessage(event, appId)}
          injectedJavaScript={SuperAppBridge.getInjectionScript(mockUser)}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView HTTP error: ', nativeEvent);
          }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          )}
          renderError={(errorName) => (
            <View style={styles.errorContainer}>
              <Typography style={styles.errorText}>Erro ao carregar Mini-App: {errorName}</Typography>
              <Typography variant="caption" style={styles.errorSubText}>Verifica se o servidor em {url} está acessível no mesmo Wi-Fi.</Typography>
            </View>
          )}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#ffffff',
  },
  closeBtn: {
    padding: 5,
  },
  webviewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05070A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#FF4B4B',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },
  errorSubText: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontSize: 12,
  }
});
