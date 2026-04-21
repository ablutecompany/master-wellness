import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';

/**
 * STEP LIVE 04 — MINIMAL SHELL ON PROD
 * Minimal navigable shell for production validation.
 */

export const HomeScreen = () => {
  const [currentView, setCurrentView] = useState<'root' | 'home' | 'profile'>('root');
  const commitSha = "7c10748 (PROD UPDATED)";

  const renderContent = () => {
    if (currentView === 'home') {
      return (
        <View style={styles.center}>
          <Text style={styles.statusText}>HOME MÍNIMA ATIVA</Text>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>COMMIT: {commitSha}</Text>
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
    letterSpacing: 1,
  },
  center: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: 'monospace',
  }
});
