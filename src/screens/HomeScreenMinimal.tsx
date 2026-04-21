/**
 * HomeScreenMinimal — CHECKPOINT DIAG-STATIC
 * Zero selectors. Zero effects. Zero services. Pure static JSX.
 * If this still crashes → bug is in App root / auth / navigator, NOT HomeScreen.
 */
import React from 'react';
import { View, Text } from 'react-native';

export const HomeScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0014', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ backgroundColor: '#7700cc', padding: 16, borderRadius: 12, marginBottom: 32, width: '100%', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>CHECKPOINT: DIAG-STATIC</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>Zero hooks · Zero store · Zero services</Text>
      </View>
      <Text style={{ color: '#00F2FF', fontSize: 14, textAlign: 'center' }}>
        Se vês este ecrã sem crash:{'\n'}o loop está na HomeScreen real.{'\n\n'}
        Se ainda crasha antes daqui:{'\n'}o loop está no App/Navigator.
      </Text>
    </View>
  );
};
