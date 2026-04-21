import React, { useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ENV } from './src/config/env';

import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreenMinimal'; // DIAGNOSTIC: swapped to minimal
import { ThemesScreen } from './src/screens/ThemesScreen';
import { AnalysesScreen } from './src/screens/AnalysesScreen';
import { AppsScreen } from './src/screens/AppsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GlobalDetailScreen } from './src/screens/GlobalDetailScreen';
import { WelcomeScreen } from './src/screens/OnboardingWelcome';
import { OnboardingGoals } from './src/screens/OnboardingGoals';
import { OnboardingPermissions } from './src/screens/OnboardingPermissions';
import { PairingScreen } from './src/screens/PairingScreen';
import { MiniAppContainer } from './src/miniapps/MiniAppContainer';
import { 
  Home as HomeIcon, 
  Brain, 
  Database, 
  LayoutGrid, 
  User as UserIcon 
} from 'lucide-react-native';
import { supabase } from './src/services/supabase';
import { useStore } from './src/store/useStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { Session } from '@supabase/supabase-js';




const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: Platform.OS === 'web' ? {
          display: 'none',
          height: 64,
          backgroundColor: '#05070A',
          borderTopColor: 'rgba(255,255,255,0.08)',
          paddingBottom: 8,
          paddingTop: 8,
        } : {
          display: 'none',
          backgroundColor: '#05070A',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ color, size }: { color: string, size: number }) => {
          if (route.name === 'Home') return <HomeIcon size={size} color={color} />;
          if (route.name === 'Temas') return <Brain size={size} color={color} />;
          if (route.name === 'Dados') return <Database size={size} color={color} />;
          if (route.name === 'Apps') return <LayoutGrid size={size} color={color} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Temas" component={ThemesScreen} />
      <Tab.Screen name="Dados" component={AnalysesScreen} />
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
          Temas: 'temas',
          Dados: 'dados',
          Apps: 'apps',
        }
      },
      Profile: 'profile',
      GlobalDetail: 'detail/:id',
    },
  },
};


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorStr: '', componentStack: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorStr: error?.toString() || 'Unknown Error' };
  }

  componentDidCatch(error, errorInfo) {
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


export default function App() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [initialized, setInitialized] = React.useState(false);
  // Local sync flag — avoids writing to Zustand store during render to prevent loops
  const [isSyncingLocal, setIsSyncingLocal] = React.useState(false);
  
  const setUser = useStore(state => state.setUser);
  const setAuthAccount = useStore(state => state.setAuthAccount);
  const profileStatus = useStore(state => state.profileStatus);
  const setProfileStatus = useStore(state => state.setProfileStatus);
  const setSessionToken = useStore(state => state.setSessionToken);
  const setHousehold = useStore(state => state.setHousehold);
  
  const isGuestMode = useStore(state => state.isGuestMode);
  const setGuestMode = useStore(state => state.setGuestMode);
  const hasHydrated = useStore(state => state.hasHydrated);

  // Guard: prevents concurrent/repeated Supabase SIGNED_IN events from
  // re-entering syncProfile while it is already running.
  const isSyncingRef = React.useRef(false);

  const syncProfile = React.useCallback(async (session: Session | null) => {
    if (!session?.user || !session.access_token) {
      setUser(null);
      setProfileStatus('idle');
      return;
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncingLocal(true);
    setSessionToken(session.access_token);

    try {
      const response = await fetch(`${ENV.BACKEND_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.profile) {
          setUser(data.profile);
          if (data.profile.household) {
            setHousehold(data.profile.household);
          }
          setProfileStatus('loaded');
          isSyncingRef.current = false;
          setIsSyncingLocal(false);
          return;
        }
      } 
      
      // Profile missing — auto-initialize
      try {
        const initRes = await fetch(`${ENV.BACKEND_URL}/auth/initialize`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (initRes.ok) {
          const autoMeRes = await fetch(`${ENV.BACKEND_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (autoMeRes.ok) {
            const autoData = await autoMeRes.json();
            if (autoData.ok && autoData.profile) {
              setUser(autoData.profile);
              if (autoData.profile.household) {
                setHousehold(autoData.profile.household);
              }
              setProfileStatus('loaded');
              isSyncingRef.current = false;
              setIsSyncingLocal(false);
              return;
            }
          }
        }
        
        // Fallback profile
        console.warn('[App] Auto-initialize backend failed, using local profile fallback');
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.email?.split('@')[0] || 'Utilizador',
          height: 170,
          baseWeight: 70,
          mainGoal: 'general_wellness',
        };
        setUser(fallbackProfile as any);
        setProfileStatus('loaded');
        isSyncingRef.current = false;
        setIsSyncingLocal(false);
      } catch (initErr) {
        console.warn('[App] Network failed during auto-initialize, fallback applied:', initErr);
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.email?.split('@')[0] || 'Utilizador',
          height: 170,
          baseWeight: 70,
          mainGoal: 'general_wellness',
        };
        setUser(fallbackProfile as any);
        setProfileStatus('loaded');
        isSyncingRef.current = false;
        setIsSyncingLocal(false);
      }
    } catch (err) {
      console.error('[App] Profile sync failed:', err);
      setProfileStatus('error');
      isSyncingRef.current = false;
      setIsSyncingLocal(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializedRef = React.useRef(false);

  useEffect(() => {
    // STEP 1: Get initial session and sync profile once
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setAuthAccount(session?.user ?? null);
        if (session) {
          setGuestMode(false);
          setSessionToken(session.access_token);
          syncProfile(session);
        } else {
          setUser(null);
          setSessionToken(null);
          setProfileStatus('idle');
        }
      })
      .catch(err => console.error('[App] Auth init failed:', err))
      .finally(() => {
        setInitialized(true);
        initializedRef.current = true;
      });

    // STEP 2: Only react to auth changes that happen AFTER boot is done
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // During initial boot, getSession already handles everything — ignore all events
      // until initialization is complete to prevent the race condition.
      if (!initializedRef.current) return;

      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        setAuthAccount(session?.user ?? null);
        setSessionToken(session?.access_token ?? null);
        setGuestMode(false);
        // Only sync if not already syncing or loaded
        if (!isSyncingRef.current && useStore.getState().profileStatus !== 'loaded') {
          syncProfile(session);
        }
      } 
      else if (event === 'SIGNED_OUT') {
        isSyncingRef.current = false;
        setIsSyncingLocal(false);
        setSession(null);
        setAuthAccount(null);
        setSessionToken(null);
        setUser(null);
        setHousehold(null);
        setProfileStatus('idle');
        useStore.getState().clearSensitiveState();
        const { installedAppIds, grantedPermissions, appEvents } = useStore.getState();
        const { saveToStorage } = require('./src/store/persistence');
        saveToStorage(installedAppIds, grantedPermissions, appEvents, []);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Silently update token without re-syncing
        setSessionToken(session.access_token);
        useStore.getState().setSessionToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Production Observer (Minimal)
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.onerror = (msg, url, line) => {
        console.warn(`[BOOT_OBSERVER] ${msg} at ${line}`);
        return false;
      };
    }
  }, []);

  // Production Error Guard (Web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handler = (event: ErrorEvent | PromiseRejectionEvent) => {
        const error = 'reason' in event ? event.reason : event.error || (event as any).message;
        console.error('[CRITICAL_RUN_FAIL]', error);
      };
      window.addEventListener('error', handler);
      window.addEventListener('unhandledrejection', handler);
      return () => {
        window.removeEventListener('error', handler);
        window.removeEventListener('unhandledrejection', handler);
      };
    }
  }, []);

  if (!initialized || !hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#010204', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 14, letterSpacing: 2 }}>CARREGANDO...</Text>
      </View>
    );
  }

  // showMain: grant navigation access once local sync flag completes.
  // Only depends on isSyncingLocal (local React state) — avoids Zustand profileStatus
  // double-render cascade that was causing React #185.
  const showMain = isGuestMode || (!!session && !isSyncingLocal);

  // Show loading spinner while syncing
  if (session && isSyncingLocal) {
    return (
      <View style={{ flex: 1, backgroundColor: '#010204', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={{ color: '#fff', fontSize: 12, letterSpacing: 2, marginTop: 20 }}>SINCRONIZANDO PERFIL...</Text>
      </View>
    );
  }


  const initialRoute = showMain ? 'Main' : 'Welcome';

  return (
    <ErrorBoundary>
      <NavigationContainer linking={linking} theme={DarkTheme} key={initialRoute}>
        <StatusBar style="light" />
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="GlobalDetail" component={GlobalDetailScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="MiniApp"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
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

