/**
 * HomeScreenMinimal — CHECKPOINT DIAG-EFFECTS
 * Has ALL Zustand subscriptions + ALL useEffects from real HomeScreen.
 * Returns STATIC UI only (no complex render tree).
 * If this crashes → crash is in a useEffect.
 * The log output will show which effect ran last before crash.
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as Selectors from '../store/selectors';
import { supabase } from '../services/supabase';
import { ENV } from '../config/env';
import { semanticOutputService } from '../services/semantic-output';

export const HomeScreen = () => {
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

  // Local state mirrors
  const [syncFlowState, setSyncFlowState] = useState<'idle'|'searching'|'connected'|'syncing'|'success'|'failed'>('idle');
  const [showProfile, setShowProfile] = useState(false);
  const [diagLog, setDiagLog] = useState('mounted');
  const isMeasuringRef = useRef(false);
  const arrowAnim = useRef(new Animated.Value(0)).current;

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
      <View style={{ backgroundColor: '#003388', padding: 16, borderRadius: 12, marginBottom: 16, width: '100%', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>CHECKPOINT: DIAG-EFFECTS</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 }}>All subs + All effects · Static UI</Text>
      </View>
      <Text style={{ color: '#00F2FF', fontSize: 12, textAlign: 'center' }}>
        userId: {userId || 'null'}{'\n'}
        isGuest: {String(isGuestMode)}{'\n'}
        analyses: {analyses?.length ?? 0}{'\n'}
        measurements: {measurementCount}{'\n\n'}
        last: {diagLog}
      </Text>
    </View>
  );
};
