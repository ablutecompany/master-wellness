import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

/**
 * STEP LIVE 02 — DIRECT CHECKPOINT REPLACEMENT (Minimal Variant)
 * This file replaces the one rendering "CHECKPOINT: DIAG-FULL-HOOKS".
 */

export const HomeScreen = () => {
  const [screen, setScreen] = useState<'root' | 'home_test' | 'profile_test'>('root');

  const renderContent = () => {
    if (screen === 'home_test') {
      return (
        <View style={styles.center}>
          <Text style={styles.testText}>HOME TESTE ATIVA</Text>
          <TouchableOpacity onPress={() => setScreen('root')} style={styles.backBtn}>
            <Text style={styles.btnText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (screen === 'profile_test') {
      return (
        <View style={styles.center}>
          <Text style={styles.testText}>PERFIL TESTE ATIVO</Text>
          <TouchableOpacity onPress={() => setScreen('root')} style={styles.backBtn}>
            <Text style={styles.btnText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.title}>Checkpoint antigo substituído com sucesso</Text>
        <Text style={styles.subtitle}>Se estás a ler isto, já não estás no DIAG-FULL-HOOKS</Text>
        <Text style={styles.subtitle}>Build de prova direta do ponto real de renderização</Text>

        <TouchableOpacity onPress={() => setScreen('home_test')} style={styles.btn}>
          <Text style={styles.btnText}>HOME TESTE</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen('profile_test')} style={[styles.btn, { marginTop: 16, backgroundColor: '#333' }]}>
          <Text style={styles.btnText}>PERFIL TESTE</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>STEP LIVE 02 — DIRECT CHECKPOINT REPLACEMENT</Text>
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
  banner: {
    backgroundColor: '#FF0000',
    padding: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  bannerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#00F2FF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  testText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  btn: {
    width: '100%',
    padding: 16,
    backgroundColor: '#005500',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
  },
  backBtn: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginTop: 20,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  }
});
