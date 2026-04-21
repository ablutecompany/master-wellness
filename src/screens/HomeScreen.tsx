import React from 'react';
import { View, Text } from 'react-native';

export const HomeScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0014', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>STEP 18 - ZERO HOOKS</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>Se isto crashar, problema é no App.tsx. Se não, é no HomeScreen real.</Text>
    </View>
  );
};
