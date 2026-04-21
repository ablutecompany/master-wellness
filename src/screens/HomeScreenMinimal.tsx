/**
 * HomeScreenMinimal — Diagnostic shell.
 * Replaces HomeScreen to test if the React #185 crash originates inside HomeScreen.
 * If the crash stops with this version, the bug is confirmed to be inside HomeScreen hooks.
 * If it continues, it's in App.tsx / NavigationContainer / another component.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useStore } from '../store/useStore';

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const user = useStore(state => state.user);
  const isGuestMode = useStore(state => state.isGuestMode);
  
  return (
    <View style={{ flex: 1, backgroundColor: '#010204', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ backgroundColor: 'red', padding: 12, borderRadius: 8, marginBottom: 24 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>DIAGNOSTIC BUILD — MINIMAL HOME</Text>
      </View>
      <Text style={{ color: '#00F2FF', fontSize: 14, marginBottom: 8 }}>
        User: {isGuestMode ? 'Guest' : (user?.name || user?.email || 'No profile')}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
        If you see this screen without a crash, the loop is inside HomeScreen hooks.
      </Text>
    </View>
  );
};
