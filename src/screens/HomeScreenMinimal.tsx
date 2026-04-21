import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useStore } from '../store/useStore';

/**
 * STEP LIVE 05C — HOME REAL PROBE (Minimal Variant)
 * Direct replacement of the HOME view contents to ensure no previous content remains.
 */

export const HomeScreen = () => {
  const [currentView, setCurrentView] = useState<'root' | 'home' | 'profile'>('root');
  
  // Real data primitives only
  const user = useStore((state) => state.user);
  const activeMemberId = useStore((state) => state.activeMemberId);
  const analyses = useStore((state) => state.analyses);
  const authAccount = useStore((state) => state.authAccount);

  const analysesCount = analyses?.length ?? 0;
  const userId = user?.id ?? 'unavailable';
  const displayMemberId = activeMemberId ?? 'unavailable';
  
  const profileName = user?.name ?? 'unavailable';
  const profileEmail = authAccount?.email ?? 'unavailable';
  const profileCountry = user?.country ?? 'unavailable';
  const profileTimezone = user?.timezone ?? 'unavailable';

  const finalCommitSha = "f97e04c"; 

  const renderContent = () => {
    if (currentView === 'home') {
      return (
        <View style={styles.center}>
          <View style={styles.probeHeader}>
            <Text style={styles.probeStep}>STEP LIVE 05C — HOME REAL PROBE</Text>
            <Text style={styles.probeSub}>PROVA DIRETA DA LEITURA REAL</Text>
          </View>

          <View style={[styles.card, { backgroundColor: '#1a0033' }]}>
            <Text style={styles.cardHeader}>HOME REAL — SLICE 01</Text>
            <View style={styles.divider} />
            
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>userId:</Text>
              <Text style={styles.dataValue}>{userId}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>activeMemberId:</Text>
              <Text style={styles.dataValue}>{displayMemberId}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>analysesCount:</Text>
              <Text style={styles.dataValue}>{analysesCount}</Text>
            </View>
            
            <View style={styles.divider} />
            <Text style={styles.footerSha}>commit: {finalCommitSha}</Text>
          </View>
          
          <TouchableOpacity onPress={() => setCurrentView('root')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentView === 'profile') {
      return (
        <View style={styles.center}>
          <View style={[styles.card, { backgroundColor: '#001a1a', borderColor: '#00F2FF' }]}>
            <Text style={styles.cardHeader}>PERFIL REAL — SLICE 01</Text>
            <View style={styles.divider} />
            
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nome:</Text>
              <Text style={styles.dataValue}>{profileName}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Email:</Text>
              <Text style={styles.dataValue}>{profileEmail}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>País:</Text>
              <Text style={styles.dataValue}>{profileCountry}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Timezone:</Text>
              <Text style={styles.dataValue}>{profileTimezone}</Text>
            </View>
            
            <View style={styles.divider} />
            <Text style={styles.footerSha}>commit: {finalCommitSha}</Text>
          </View>

          <TouchableOpacity onPress={() => setCurrentView('root')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>VOLTAR</Text>
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
  probeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  probeStep: {
    color: '#FF00FF', 
    fontSize: 18,
    fontWeight: '900',
  },
  probeSub: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FF00FF',
    marginBottom: 40,
  },
  cardHeader: {
    color: '#00F2FF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    marginVertical: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dataLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  dataValue: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
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
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#00F2FF',
    fontWeight: '600',
    fontSize: 14,
  },
});
