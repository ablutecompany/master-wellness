import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';

/**
 * STEP LIVE 03 — PROD TARGET REAL CONTROLADO (Minimal Variant)
 * This file replaces the one rendering "CHECKPOINT: DIAG-FULL-HOOKS" in the PRODUCTION branch.
 */

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
  const commitSha = "399ac1e (PROD PUSH)";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.banner}>
          <Text style={styles.title}>PROD TARGET REAL CONTROLADO</Text>
          <Text style={styles.subtitle}>STEP LIVE 03</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.text}>Se estás a ler isto, já não estás no checkpoint antigo</Text>
          <View style={styles.shaBox}>
             <Text style={styles.shaText}>COMMIT SHA: {commitSha}</Text>
             <Text style={styles.timestamp}>TIME: 2026-04-21 18:04</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD700', // Yellow
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  banner: {
    backgroundColor: '#FF0000', // Red
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 5,
    borderColor: 'white',
  },
  title: {
    color: 'white',
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    color: 'white',
    fontWeight: '800',
    fontSize: 24,
    marginTop: 10,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: '#000',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 30,
  },
  shaBox: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  shaText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  }
});
