/**
 * HomeScreen — CHECKPOINT DIAG-EFFECTS
 * Has ALL Zustand subscriptions + ALL useEffects from real HomeScreen.
 * Returns STATIC UI only (no complex render tree).
 * If this crashes → crash is in a useEffect.
 * The log output will show which effect ran last before crash.
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, useWindowDimensions } from 'react-native';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as Selectors from '../store/selectors';
import { supabase } from '../services/supabase';
import { ENV } from '../config/env';
import { semanticOutputService } from '../services/semantic-output';

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  // useWindowDimensions — same as real HomeScreen line 149
  const { width, height } = useWindowDimensions();
  // --- Mirror of all real HomeScreen useStore subscriptions ---
  const user = useStore(useShallow(Selectors.selectUser));
  const activeMemberId = useStore(Selectors.selectActiveMemberId);
  const credits = useStore(Selectors.selectCredits);
  const measurements = useStore(useShallow(Selectors.selectMeasurements));
  const installedAppIds = useStore(useShallow((state) => state.installedAppIds || []));
  const isGuestMode = useStore(state => state.isGuestMode);
  const guestProfile = useStore(useShallow(state => state.guestProfile));
  const isMeasuring = useStore(Selectors.selectIsMeasuring);
  const isNfcLoading = useStore(Selectors.selectIsNfcLoading);
  const hasResultsAccess = useStore(Selectors.selectHasResultsAccess);
  const rawEvents = useStore(useShallow((state) => state.appContributionEvents));
  const analyses = useStore(useShallow((state) => state.analyses));
  const activeAnalysisId = useStore(state => state.activeAnalysisId);
  const demoAnalysis = useStore(useShallow(state => state.demoAnalysis));
  const measurementCount = useStore(state => (state.measurements || []).length);
  const setAnalyses = useStore(state => state.setAnalyses);
  const setActiveAnalysisId = useStore(state => state.setActiveAnalysisId);

  // Stable ID
  const userId = user?.id ?? null;

  // Local state mirrors (from real HomeScreen)
  const [syncFlowState, setSyncFlowState] = useState<'idle'|'searching'|'connected'|'syncing'|'success'|'failed'>('idle');
  const [showProfile, setShowProfile] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [themesInteractive, setThemesInteractive] = useState(false);
  const [dataInteractive, setDataInteractive] = useState(false);
  const [diagLog, setDiagLog] = useState('mounted');
  const isMeasuringRef = useRef(false);

  // Animated.Values that depend on width — SAME AS REAL HOMESCREEN
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(1)).current;
  const themesAnim = useRef(new Animated.Value(-width)).current;
  const dataAnim = useRef(new Animated.Value(width)).current;
  const DRAWER_DOWN = 583;
  const drawerAnim = useRef(new Animated.Value(DRAWER_DOWN)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;
  const lastDrawerY = useRef(DRAWER_DOWN);

  // PanResponder — same as real HomeScreen
  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        let newY = lastDrawerY.current + dy;
        if (newY < 0) newY = 0;
        if (newY > DRAWER_DOWN) newY = DRAWER_DOWN;
        drawerAnim.setValue(newY);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const toValue = (vy < -0.2 || dy < -25) ? 0 : DRAWER_DOWN;
        Animated.spring(drawerAnim, { toValue, bounciness: 0, useNativeDriver: false })
          .start(() => { lastDrawerY.current = toValue; });
      }
    })
  ).current;

  // interpolates from width — same pattern as HomeScreen
  const themesBackdropOpacity = themesAnim.interpolate({ inputRange: [-width, 0], outputRange: [0, 0.88], extrapolate: 'clamp' });
  const dataBackdropOpacity = dataAnim.interpolate({ inputRange: [0, width], outputRange: [0.88, 0], extrapolate: 'clamp' });

  // EFFECT 1: loadData [userId, isGuestMode]
  useEffect(() => {
    setDiagLog('effect1:loadData running');
    console.log('[DIAG-EFFECTS] effect1:loadData fired userId=', userId, 'isGuest=', isGuestMode);
    async function loadData() {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const currentUser = useStore.getState().isGuestMode ? null : useStore.getState().user;
      if (currentUser && token && !useStore.getState().isGuestMode) {
        try {
          const analysesRes = await fetch(`${ENV.BACKEND_URL}/analyses`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (analysesRes.ok) {
            const realAnalyses = await analysesRes.json();
            setAnalyses(realAnalyses);
            const persistedId = currentUser?.activeAnalysisId;
            const existsInReal = realAnalyses.some((a: any) => a.id === persistedId);
            if (persistedId && existsInReal) {
              setActiveAnalysisId(persistedId);
            } else if (realAnalyses.length > 0) {
              setActiveAnalysisId(realAnalyses[0].id);
            } else {
              setActiveAnalysisId(null);
            }
          }
        } catch (err) {
          console.error('[DIAG-EFFECTS] loadData failed:', err);
        }
      }
      setDiagLog('effect1:loadData done');
      console.log('[DIAG-EFFECTS] effect1:loadData done');
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isGuestMode]);

  // EFFECT 2: semanticOutputService.init [userId]
  useEffect(() => {
    setDiagLog('effect2:semanticInit running');
    console.log('[DIAG-EFFECTS] effect2:semanticInit fired userId=', userId);
    const uid = userId || 'user_current_session_1';
    const t = setTimeout(() => {
      semanticOutputService.init(uid);
      setDiagLog('effect2:semanticInit done');
      console.log('[DIAG-EFFECTS] effect2:semanticInit done');
    }, 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // EFFECT 3: isMeasuring sync [isMeasuring, syncFlowState]
  useEffect(() => {
    console.log('[DIAG-EFFECTS] effect3:isMeasuring fired isMeasuring=', isMeasuring, 'syncFlow=', syncFlowState);
    setDiagLog(`effect3:isMeasuring(${isMeasuring},${syncFlowState})`);
    if (!isMeasuring) {
      isMeasuringRef.current = false;
    }
    // executeSyncReal intentionally NOT connected here — just the guard check
  }, [isMeasuring, syncFlowState]);

  // EFFECT 4: arrowAnim loop [once]
  useEffect(() => {
    console.log('[DIAG-EFFECTS] effect4:arrowAnim starting');
    setDiagLog('effect4:arrowAnim starting');
    let isActive = true;
    const runAnimation = () => {
      if (!isActive) return;
      arrowAnim.setValue(0);
      Animated.timing(arrowAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
        isInteraction: false,
      }).start(() => {
        if (isActive) setTimeout(runAnimation, 20);
      });
    };
    runAnimation();
    return () => { isActive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0014', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ backgroundColor: '#550055', padding: 16, borderRadius: 12, marginBottom: 16, width: '100%', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>CHECKPOINT: DIAG-FULL-HOOKS</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 }}>All hooks + width Animated + PanResponder · Static UI</Text>
      </View>
      <Text style={{ color: '#00F2FF', fontSize: 12, textAlign: 'center' }}>
        w:{width} h:{height}{'\n'}
        userId: {userId || 'null'}{'\n'}
        analyses: {analyses?.length ?? 0}{'\n'}
        last: {diagLog}
      </Text>
    </View>
  );
};
