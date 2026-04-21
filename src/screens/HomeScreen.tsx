import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useStore } from '../store/useStore';

/**
 * STEP LIVE 05B — REAL HOME PROBE
 * Direct replacement of the HOME view to prove store connectivity.
 */

export const HomeScreen = () => {
  const [currentView, setCurrentView] = useState<'root' | 'home' | 'profile'>('root');
  
  // Real data slice
  const user = useStore((state) => state.user);
  const activeMemberId = useStore((state) => state.activeMemberId);
  const analyses = useStore((state) => state.analyses);

  const analysesCount = analyses?.length ?? 0;
  const userId = user?.id ?? 'unavailable';
  const displayMemberId = activeMemberId ?? 'unavailable';
  const currentLevelSha = "92d5905 (05B PUSH)";

  const renderContent = () => {
    if (currentView === 'home') {
      return (
        <View style={styles.center}>
          <View style={[styles.card, { backgroundColor: '#001a33' }]}>
            <Text style={styles.probeTitle}>STEP LIVE 05B — REAL HOME PROBE</Text>
            <Text style={styles.cardTitle}>HOME REAL — SLICE 01</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.dataLabel}>userId: <Text style={styles.dataValue}>{userId}</Text></Text>
            <Text style={styles.dataLabel}>activeMemberId: <Text style={styles.dataValue}>{displayMemberId}</Text></Text>
            <Text style={styles.dataLabel}>analysesCount: <Text style={styles.dataValue}>{analysesCount}</Text></Text>
            
            <View style={styles.divider} />
            <Text style={styles.footerSha}>commit: {currentLevelSha}</Text>
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
        <Text style={styles.headerText}>STEP LIVE 04 — MINIMAL SHELL ON PROD</Text>
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
    backgroundColor: '#005500',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#00F2FF',
  },
  headerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  center: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: '#00F2FF',
    marginBottom: 40,
  },
  probeTitle: {
    color: '#FFD700', // Gold for Probe title
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 242, 255, 0.2)',
    marginVertical: 16,
  },
  dataLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  dataValue: {
    color: '#00F2FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footerSha: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
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
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontSize: 14,
  },
});
