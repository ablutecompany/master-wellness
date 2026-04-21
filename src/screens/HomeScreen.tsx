import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useStore } from '../store/useStore';

/**
 * STEP LIVE 05 — CONTROLLED REAL HOME SLICE
 * Incremental reintroduction of basic primitive data from the real store.
 */

export const HomeScreen = () => {
  const [currentView, setCurrentView] = useState<'root' | 'home' | 'profile'>('root');
  
  // Real data slice - minimal and primitive only
  const user = useStore((state) => state.user);
  const activeMemberId = useStore((state) => state.activeMemberId);
  const analyses = useStore((state) => state.analyses);

  const analysesCount = analyses?.length ?? 0;
  const userId = user?.id ?? 'unavailable';
  const displayMemberId = activeMemberId ?? 'none (default profile)';

  const renderContent = () => {
    if (currentView === 'home') {
      return (
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>HOME REAL — SLICE 01</Text>
            <View style={styles.divider} />
            <Text style={styles.dataLabel}>userId: <Text style={styles.dataValue}>{userId}</Text></Text>
            <Text style={styles.dataLabel}>activeMemberId: <Text style={styles.dataValue}>{displayMemberId}</Text></Text>
            <Text style={styles.dataLabel}>analysesCount: <Text style={styles.dataValue}>{analysesCount}</Text></Text>
          </View>
          
          <TouchableOpacity onPress={() => setCurrentView('root')} style={styles.backButton}>
            <Text style={styles.backButtonText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentView === 'profile') {
      return (
        <View style={styles.center}>
          <Text style={styles.statusText}>PERFIL MÍNIMO ATIVO</Text>
          <TouchableOpacity onPress={() => setCurrentView('root')} style={styles.backButton}>
            <Text style={styles.backButtonText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.title}>Shell mínima funcional</Text>
        <Text style={styles.subtitle}>Canal de produção correto</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={() => setCurrentView('home')} 
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>HOME</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setCurrentView('profile')} 
            style={[styles.navButton, { marginTop: 16, backgroundColor: '#333' }]}
          >
            <Text style={styles.navButtonText}>PERFIL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>STEP LIVE 05 — CONTROLLED REAL HOME SLICE</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020306',
  },
  headerBar: {
    backgroundColor: '#333', // Subtle change to differentiate Step 05
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#00F2FF',
  },
  headerText: {
    color: '#00F2FF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  center: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
    marginBottom: 40,
  },
  cardTitle: {
    color: '#00F2FF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    marginVertical: 16,
  },
  dataLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  dataValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    color: '#00F2FF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  navButton: {
    width: '100%',
    padding: 18,
    backgroundColor: '#005500',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  navButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  statusText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 40,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontSize: 14,
  },
});
