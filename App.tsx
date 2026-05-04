import React, { useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ENV } from './src/config/env';

import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
export const navigationRef = createNavigationContainerRef<any>();
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { AIReadingScreen } from './src/screens/AIReadingScreen';
import { AnalysesScreen } from './src/screens/AnalysesScreen';
import { AppsScreen } from './src/screens/AppsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GlobalDetailScreen } from './src/screens/GlobalDetailScreen';
import { WelcomeScreen } from './src/screens/OnboardingWelcome';
import { OnboardingGoals } from './src/screens/OnboardingGoals';
import { OnboardingPermissions } from './src/screens/OnboardingPermissions';
import { PairingScreen } from './src/screens/PairingScreen';
import { MiniAppContainer } from './src/miniapps/MiniAppContainer';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { 
  Home as HomeIcon, 
  Brain, 
  Database, 
  LayoutGrid, 
} from 'lucide-react-native';
import { supabase } from './src/services/supabase';
import { useStore } from './src/store/useStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { Session } from '@supabase/supabase-js';
import { ProfileService } from './src/services/user/profileService';
import { normalizeProfile } from './src/store/slices/profile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ color, size }: { color: string, size: number }) => {
          if (route.name === 'Home') return <HomeIcon size={size} color={color} />;
          if (route.name === 'Leitura AI') return <Brain size={size} color={color} />;
          if (route.name === 'Resultados') return <Database size={size} color={color} />;
          if (route.name === 'Apps') return <LayoutGrid size={size} color={color} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leitura AI" component={AIReadingScreen} />
      <Tab.Screen name="Resultados" component={AnalysesScreen} />
      <Tab.Screen name="Apps" component={AppsScreen} />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: ['wellness://', 'https://ablute-wellness.onrender.com'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      Main: {
        path: '',
        screens: {
          Home: 'home',
          'Leitura AI': 'leitura-ai',
          Resultados: 'resultados',
          Apps: 'apps',
        }
      },
      Profile: 'profile',
      GlobalDetail: 'detail/:id',
    },
  },
};

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorStr: '', componentStack: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorStr: error?.toString() || 'Unknown Error' };
  }

  componentDidCatch(error: any, errorInfo: any) {
    const stack = errorInfo?.componentStack || '';
    this.setState({ componentStack: stack });
    console.error('[CRASH_DETAIL] Error:', error?.toString());
    console.error('[CRASH_STACK]', stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: 'red', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>CRASH:</Text>
          <Text style={{ color: 'white', marginTop: 10 }}>{this.state.errorStr}</Text>
          <Text style={{ color: 'yellow', marginTop: 10, fontSize: 10 }}>{this.state.componentStack?.slice(0, 500)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── AUTH BOOT ──────────────────────────────────────────────────────────────────
// Design principle: the NavigationContainer is mounted ONCE and never remounted.
// Auth state is managed via a single 'authReady' flag. When authReady=false,
// the app shows a simple loading screen (no NavigationContainer involved).
// Once authReady=true, the NavigationContainer mounts with the correct initialRouteName
// and is never re-mounted again.
// This prevents the React Navigation internal setState cascade that caused React #185.

export default function App() {
  // authReady: true once the initial session check + profile sync is complete
  const [authReady, setAuthReady] = React.useState(false);
  // authDest: the screen to show once auth is ready
  const [authDest, setAuthDest] = React.useState<'Main' | 'Welcome'>('Welcome');

  const setUser = useStore(state => state.setUser);
  const setAuthAccount = useStore(state => state.setAuthAccount);
  const setProfileStatus = useStore(state => state.setProfileStatus);
  const setSessionToken = useStore(state => state.setSessionToken);
  const setHousehold = useStore(state => state.setHousehold);
  const isGuestMode = useStore(state => state.isGuestMode);
  const setGuestMode = useStore(state => state.setGuestMode);
  const setAnalyses = useStore(state => state.setAnalyses);
  const hasHydrated = useStore(state => state.hasHydrated);

  const isSyncingRef = React.useRef(false);
  const bootCompletedRef = React.useRef(false);

  const syncProfile = React.useCallback(async (session: Session | null, onDone?: (dest: 'Main' | 'Welcome') => void) => {
    console.log('[P0_PROFILE_BOOT] hasSession:', !!session);
    console.log('[P0_PROFILE_BOOT] hasToken:', !!session?.access_token);
    console.log('[P0_PROFILE_BOOT] userId:', session?.user?.id);

    if (!session?.user || !session.access_token) {
      setUser(null);
      setProfileStatus('idle');
      onDone?.('Welcome');
      return;
    }

    if (isSyncingRef.current) {
      console.warn('[AUTH_DIAG] syncProfile already in progress, aborting concurrent call');
      return;
    }
    isSyncingRef.current = true;
    console.warn('[AUTH_DIAG] syncProfile start', { userId: session.user.id });
    setSessionToken(session.access_token);

    const trySyncAnalyses = async () => {
      try {
        const anaRes = await ProfileService.getAnalyses(session.access_token);
        if (anaRes.ok && anaRes.analyses) {
          setAnalyses(anaRes.analyses);
        }
      } catch (err) {
        console.warn('[App] Failed to sync analyses:', err);
      }
    };

    const setLoaded = async (profile: any) => {
      const normalized = normalizeProfile(profile);
      if (!normalized) {
        console.warn('[P0_PROFILE_BOOT] authMeSuccess returned invalid shape, using fallback', { profile });
        await setFallback('authMe returned invalid profile shape');
        return;
      }

      console.log('[P0_PROFILE_BOOT] authMeSuccess: true');
      console.log('[P0_AUTH_ME]', {
        userId: normalized.id,
        userFound: true,
        profileFound: true,
        returnedFields: Object.keys(normalized)
      });
      console.log('[P0_AVATAR_AFTER_LOGIN]', {
        userId: normalized.id,
        authMeHasAvatarUrl: profile.avatarUrl !== undefined && profile.avatarUrl !== null,
        authMeAvatarUrlLength: profile.avatarUrl ? profile.avatarUrl.length : 0,
        storeHasAvatarUrl: normalized.avatarUrl !== undefined && normalized.avatarUrl !== null,
        storeAvatarUrlLength: normalized.avatarUrl ? normalized.avatarUrl.length : 0,
        profileScreenRenderedImage: 'tested in UI'
      });
      setUser(normalized);
      if ((normalized as any)?.household) {
        setHousehold((normalized as any).household);
        // Safe hydration: repair orphaned activeMemberId
        const state = useStore.getState();
        if (state.activeMemberId && state.activeMemberId !== normalized.id) {
          const members = (normalized as any).household.members || [];
          const isActiveMemberValid = members.some((m: any) => m.id === state.activeMemberId && !m.archived);
          if (!isActiveMemberValid) {
            console.warn('[P0_RESULTS_ACCESS] activeMemberId is orphaned/archived, resetting to user.id');
            useStore.getState().setActiveMember(normalized.id);
          }
        }
      }
      await trySyncAnalyses();
      setProfileStatus('loaded');
      isSyncingRef.current = false;
      console.warn('[AUTH_DIAG] syncProfile success: profile loaded', { userId: normalized.id });
      onDone?.('Main');
    };

    const setFallback = async (reason: string) => {
      console.log('[P0_PROFILE_BOOT] fallbackUsed: true');
      console.log('[P0_PROFILE_BOOT] fallbackReason:', reason);
      
      const prevUser = useStore.getState().user;
      if (prevUser && prevUser.id === session.user.id) {
         console.warn('[P0_PROFILE_BOOT] Keeping existing local profile despite fetch failure.');
         console.warn('[P0_DATA_FALLBACK_BLOCKED] Prevented fallback from overwriting existing profile data for user:', session.user.id);
         await trySyncAnalyses();
         setProfileStatus('error');
         isSyncingRef.current = false;
         onDone?.('Main');
         return;
      }

      const fallback = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.email?.split('@')[0] || 'Utilizador',
        height: 170,
        baseWeight: 70,
        mainGoal: 'general_wellness',
      };
      setUser(fallback as any);
      await trySyncAnalyses();
      setProfileStatus('error'); // Tratar como fallback de erro
      isSyncingRef.current = false;
      console.warn('[AUTH_DIAG] syncProfile success: fallback used', { userId: fallback.id });
      onDone?.('Main');
    };

    try {
      console.log('[P0_PROFILE_BOOT] authMeStarted: true');
      const meRes = await fetch(`${ENV.BACKEND_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.ok && data.profile) { 
          setLoaded(data.profile); 
          return; 
        }
      }

      console.log('[P0_PROFILE_BOOT] authMeError: fetch failed or returned false. Attempting initialize.');

      try {
        const initRes = await fetch(`${ENV.BACKEND_URL}/auth/initialize`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${session.access_token}`, 
            'Content-Type': 'application/json' 
          },
        });
        
        if (initRes.ok) {
          const me2 = await fetch(`${ENV.BACKEND_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (me2.ok) {
            const d2 = await me2.json();
            if (d2.ok && d2.profile) { 
              setLoaded(d2.profile); 
              return; 
            }
          }
        }
        setFallback('Initialize failed or /me after initialize failed');
      } catch (err: any) {
        setFallback('Exception during initialization: ' + err.message);
      }
    } catch (err: any) {
      console.error('[AUTH_DIAG] syncProfile critical error:', err);
      console.log('[P0_PROFILE_BOOT] authMeError:', err.message);
      setFallback('Critical exception during authMe: ' + err.message);
    }
  }, [setUser, setProfileStatus, setSessionToken, setHousehold, setAnalyses]);



  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root { 
          background-color: #010204 !important; 
          margin: 0;
          padding: 0;
          overflow: hidden;
          overscroll-behavior-y: none;
          touch-action: pan-x pan-y;
        }
      `;
      document.head.append(style);

      // FORCE UNREGISTER SERVICE WORKERS TO FIX PWA CACHE ISSUES
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
            console.warn('[PWA_CACHE] Service worker unregistered to force update.');
          }
        });
      }
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setAuthAccount(session?.user ?? null);
        if (session) {
          setGuestMode(false);
          setSessionToken(session.access_token);
          syncProfile(session, (dest) => {
            requestAnimationFrame(() => {
              setAuthDest(dest);
              setAuthReady(true);
              bootCompletedRef.current = true;
            });
          });
        } else if (isGuestMode) {
          setAuthDest('Main');
          setAuthReady(true);
          bootCompletedRef.current = true;
        } else {
          setAuthDest('Welcome');
          setAuthReady(true);
          bootCompletedRef.current = true;
        }
      })
      .catch(() => {
        setAuthDest('Welcome');
        setAuthReady(true);
        bootCompletedRef.current = true;
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!bootCompletedRef.current) return; 

      if (event === 'SIGNED_IN' && session) {
        console.warn('[AUTH_DIAG] listener: SIGNED_IN', { userId: session.user.id });
        setAuthAccount(session.user);
        setGuestMode(false);
        if (!isSyncingRef.current && useStore.getState().profileStatus !== 'loaded') {
          syncProfile(session, (dest) => {
            console.warn('[AUTH_DIAG] listener: syncProfile onDone', { dest });
            setAuthDest(dest);
            if (dest === 'Main' && navigationRef.isReady()) {
              console.warn('[AUTH_DIAG] listener: explicit navigate to Main');
              navigationRef.navigate('Main' as any);
            }
          });
        }
      } else if (event === 'SIGNED_OUT') {
        isSyncingRef.current = false;
        setAuthAccount(null);
        setSessionToken(null);
        setUser(null);
        setHousehold(null);
        setProfileStatus('idle');
        setAuthDest('Welcome');
        useStore.getState().clearSensitiveState();
        const { installedAppIds, grantedPermissions, appEvents } = useStore.getState();
        const { saveToStorage } = require('./src/store/persistence');
        saveToStorage(installedAppIds, grantedPermissions, appEvents, []);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSessionToken(session.access_token);
        useStore.getState().setSessionToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authReady || !hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#010204', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={{ color: '#fff', fontSize: 12, letterSpacing: 2, marginTop: 20 }}>CARREGANDO...</Text>
      </View>
    );
  }

  // NavigationContainer mounts ONCE with the correct initialRouteName.
  // It never remounts — auth changes are handled via navigation.navigate() or
  // screen-level guards if needed.
  return (
    <ErrorBoundary>
      <NavigationContainer theme={DarkTheme} ref={navigationRef}>
        <StatusBar style="light" />
        <Stack.Navigator initialRouteName={authDest} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Screen name="GlobalDetail" component={GlobalDetailScreen} options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Screen
            name="MiniApp"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          >
            {({ route, navigation }: any) => (
              <MiniAppContainer app={(route.params as any).app} navigation={navigation} />
            )}
          </Stack.Screen>
          <Stack.Screen name="OnboardingGoals" component={OnboardingGoals} />
          <Stack.Screen name="OnboardingPermissions" component={OnboardingPermissions} />
          <Stack.Screen name="Pairing" component={PairingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
