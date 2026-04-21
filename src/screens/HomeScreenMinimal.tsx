/**
 * HomeScreenMinimal — CHECKPOINT DIAG-SELECTORS
 * Has ALL Zustand subscriptions from real HomeScreen.
 * Has ZERO useEffects.
 * If this crashes → crash is in a selector/subscription.
 * If this doesn't crash → crash is in a useEffect.
 */
import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as Selectors from '../store/selectors';

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

  // Stable ID
  const userId = user?.id ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0014', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ backgroundColor: '#005599', padding: 16, borderRadius: 12, marginBottom: 16, width: '100%', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>CHECKPOINT: DIAG-SELECTORS</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 }}>All Zustand subscriptions · Zero useEffects</Text>
      </View>
      <Text style={{ color: '#00F2FF', fontSize: 12, textAlign: 'center' }}>
        userId: {userId || 'null'}{'\n'}
        isGuest: {String(isGuestMode)}{'\n'}
        analyses: {analyses?.length ?? 0}{'\n'}
        measurements: {measurementCount}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
        Se vês isto sem crash →{'\n'}crash está num useEffect.{'\n\n'}
        Se ainda crasha →{'\n'}crash está num selector/subscription.
      </Text>
    </View>
  );
};
