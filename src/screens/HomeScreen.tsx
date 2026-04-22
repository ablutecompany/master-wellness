import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useStore } from '../store/useStore';

/**
 * STEP LIVE 05C — HOME REAL PROBE
 * Direct replacement of the HOME view contents to ensure no previous content remains.
 */

export const HomeScreen = ({ navigation }: any) => {
  const [currentView, setCurrentView] = useState<'root' | 'home' | 'profile'>('root');
  
  console.warn('[PROFILE_DIAG] HomeScreen render', { currentView });

  // Real data primitives only
  const user = useStore((state) => state.user);
  const activeMemberId = useStore((state) => state.activeMemberId);
  const analyses = useStore((state) => state.analyses);
  const authAccount = useStore((state) => state.authAccount);

  const analysesCount = analyses?.length ?? 0;
  const userId = user?.id ?? 'unavailable';
  const displayMemberId = activeMemberId ?? 'unavailable';
  
  const sessionStatus = authAccount ? 'autenticada' : 'guest';
  const activeEmail = authAccount?.email ?? 'unavailable';
  const isProfileComplete = user?.name && authAccount?.email;
  const profileStatusLabel = authAccount 
    ? (isProfileComplete ? 'completo' : 'incompleto')
    : 'unavailable';

  const finalCommitSha = "f56470a"; // Updated after push

  // Slice 07 — Longitudinal Logic
  let longitudinalState = '';
  let availableBase = '';
  let evolutionReadiness = '';
  
  if (!authAccount) {
    longitudinalState = 'indisponível';
    availableBase = 'Sem sessão iniciada';
    evolutionReadiness = 'baixa';
  } else if (analysesCount === 0) {
    longitudinalState = 'ainda não disponível';
    availableBase = 'Conta ativa sem histórico';
    evolutionReadiness = 'base pronta';
  } else if (analysesCount === 1) {
    longitudinalState = 'muito inicial';
    availableBase = 'Existe 1 análise';
    evolutionReadiness = 'limitada';
  } else {
    longitudinalState = 'disponível';
    availableBase = `Existem ${analysesCount} análises`;
    evolutionReadiness = 'elevada';
  }

  // Slice 06 — Operational Logic
  const sessionOpLabel = authAccount ? 'ativa' : 'guest';
  const backendOpLabel = (authAccount && userId !== 'unavailable') ? 'pronta' : 'fallback';
  const profileOpLabel = user?.name ? 'sim' : 'não';
  const historyOpLabel = analysesCount > 0 ? 'disponível' : 'vazio';
  
  let globalOpState = '';
  if (!authAccount) {
    globalOpState = 'Acesso limitado';
  } else if (isProfileComplete && analysesCount === 0) {
    globalOpState = 'Conta pronta sem histórico';
  } else if (isProfileComplete && analysesCount > 0) {
    globalOpState = 'Conta pronta com histórico';
  } else {
    globalOpState = 'Conta autenticada com perfil parcial';
  }

  // Slice 05 — Orientation Logic
  let nextStep = '';
  let reason = '';
  let orientationTarget: 'root' | 'home' | 'profile' | 'Login' = 'root';

  if (!authAccount) {
    nextStep = 'Iniciar sessão';
    reason = 'Sem sessão ativa';
    orientationTarget = 'Login';
  } else if (!isProfileComplete) {
    nextStep = 'Rever perfil base';
    reason = 'Faltam dados essenciais';
    orientationTarget = 'profile';
  } else if (analysesCount === 0) {
    nextStep = 'Confirmar dados do perfil';
    reason = 'Conta ativa sem histórico disponível';
    orientationTarget = 'profile';
  } else {
    nextStep = 'Consultar detalhe técnico';
    reason = 'Já existe histórico disponível';
    orientationTarget = 'home'; // SLICE 01
  }

  // Slice 03 — Contextual Action Logic
  let actionMessage = '';
  let actionLabel = '';
  let actionTarget: 'root' | 'home' | 'profile' | 'Login' = 'root';

  if (!authAccount) {
    actionMessage = 'Inicie sessão para aceder ao seu perfil e histórico';
    actionLabel = 'LOGIN';
    actionTarget = 'Login';
  } else if (analysesCount === 0) {
    actionMessage = 'Ainda não existem análises disponíveis nesta conta';
    actionLabel = 'ABRIR PERFIL';
    actionTarget = 'profile';
  } else if (!isProfileComplete) {
    actionMessage = 'Complete o perfil base para melhorar a experiência';
    actionLabel = 'ABRIR PERFIL';
    actionTarget = 'profile';
  } else {
    actionMessage = 'Conta pronta para evoluir para superfícies mais ricas';
    actionLabel = 'VER HOME';
    actionTarget = 'home';
  }

  // Slice 04 — Summary Logic
  const accountSummaryLabel = authAccount ? 'ativa' : 'guest';
  const profileSummaryLabel = profileStatusLabel === 'completo' ? 'completo' : 'incompleto';
  const analysesSummaryLabel = analysesCount.toString();
  
  let synthesisMessage = '';
  if (!authAccount) {
    synthesisMessage = 'Sem sessão iniciada';
  } else if (analysesCount === 0) {
    synthesisMessage = 'Conta ativa sem histórico disponível';
  } else {
    synthesisMessage = 'Conta ativa com histórico disponível';
  }

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
      try {
        console.warn('[PROFILE_DIAG] Rendering profile view', {
          hasUser: !!user,
          hasAuth: !!authAccount
        });

        const profileName = user?.name ?? 'unavailable';
        const profileEmail = authAccount?.email ?? 'unavailable';
        const profileCountry = user?.country ?? 'unavailable';
        const profileTimezone = user?.timezone ?? 'unavailable';

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

            <TouchableOpacity 
              onPress={() => {
                console.warn('[PROFILE_DIAG] VOLTAR pressed (from profile)');
                setCurrentView('root');
              }} 
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>
        );
      } catch (err: any) {
        console.error('[PROFILE_DIAG] profile render crash:', err.message);
        return (
          <View style={styles.center}>
            <Text style={{ color: '#FF3B30', fontWeight: 'bold', marginBottom: 20 }}>ERRO AO RENDERIZAR PERFIL</Text>
            <Text style={{ color: '#AAA', fontSize: 10, marginBottom: 40 }}>{err.message}</Text>
            <TouchableOpacity onPress={() => setCurrentView('root')} style={styles.backBtn}>
              <Text style={styles.backBtnText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    return (
      <View style={styles.center}>
        <Text style={styles.title}>Shell mínima funcional</Text>
        <Text style={styles.subtitle}>Canal de produção correto</Text>

        {/* SLICE 02 — REAL DATA CARD */}
        <View style={[styles.card, { backgroundColor: '#001a1a', borderColor: '#00F2FF', marginBottom: 24 }]}>
          <Text style={styles.cardHeader}>HOME REAL — SLICE 02</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Estado da sessão:</Text>
            <Text style={styles.dataValue}>{sessionStatus}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email ativo:</Text>
            <Text style={styles.dataValue}>{activeEmail}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Análises disponíveis:</Text>
            <Text style={styles.dataValue}>{analysesCount}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Perfil base:</Text>
            <Text style={[styles.dataValue, { color: profileStatusLabel === 'completo' ? '#4CD964' : '#FF9500' }]}>
              {profileStatusLabel}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              console.warn('[PROFILE_DIAG] Abrir Perfil pressed (from Home Slice 02)');
              setCurrentView('profile');
            }}
            style={{ marginTop: 12, padding: 8, backgroundColor: 'rgba(0, 242, 255, 0.1)', borderRadius: 6, alignItems: 'center' }}
          >
            <Text style={{ color: '#00F2FF', fontSize: 12, fontWeight: 'bold' }}>ABRIR PERFIL</Text>
          </TouchableOpacity>
        </View>

        {/* SLICE 03 — CONTEXTUAL ACTION CARD */}
        <View style={[styles.card, { backgroundColor: '#1a1a00', borderColor: '#FFCC00', marginBottom: 24 }]}>
          <Text style={[styles.cardHeader, { color: '#FFCC00' }]}>HOME REAL — SLICE 03</Text>
          <View style={styles.divider} />
          
          <Text style={{ color: '#FFF', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            {actionMessage}
          </Text>

          <TouchableOpacity 
            onPress={() => {
              console.warn(`[PROFILE_DIAG] Contextual action pressed: ${actionLabel}`, { actionTarget });
              if (actionTarget === 'Login') {
                navigation.navigate('Login');
              } else {
                setCurrentView(actionTarget as any);
              }
            }}
            style={{ padding: 14, backgroundColor: '#FFCC00', borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SLICE 04 — SUMMARY CARD */}
        <View style={[styles.card, { backgroundColor: '#1a0000', borderColor: '#FF3B30', marginBottom: 24 }]}>
          <Text style={[styles.cardHeader, { color: '#FF3B30' }]}>HOME REAL — SLICE 04</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Conta:</Text>
            <Text style={styles.dataValue}>{accountSummaryLabel}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Perfil:</Text>
            <Text style={styles.dataValue}>{profileSummaryLabel}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Análises:</Text>
            <Text style={styles.dataValue}>{analysesSummaryLabel}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={{ color: '#FFF', fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginBottom: 16 }}>
            {synthesisMessage}
          </Text>

          <TouchableOpacity 
            onPress={() => {
              console.warn('[PROFILE_DIAG] VER DETALHE pressed (from Slice 04)');
              if (authAccount) {
                setCurrentView('home'); // Technical probe (Slice 01)
              } else {
                navigation.navigate('Login');
              }
            }}
            style={{ padding: 10, borderWidth: 1, borderColor: '#FF3B30', borderRadius: 6, alignItems: 'center' }}
          >
            <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>VER DETALHE</Text>
          </TouchableOpacity>
        </View>

        {/* SLICE 05 — ORIENTATION CARD */}
        <View style={[styles.card, { backgroundColor: '#001a00', borderColor: '#4CD964', marginBottom: 24 }]}>
          <Text style={[styles.cardHeader, { color: '#4CD964' }]}>HOME REAL — SLICE 05</Text>
          <View style={styles.divider} />
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, marginBottom: 4 }}>Próximo passo recomendado:</Text>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{nextStep}</Text>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, marginBottom: 4 }}>Motivo:</Text>
            <Text style={{ color: '#4CD964', fontSize: 13 }}>{reason}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              console.warn(`[PROFILE_DIAG] EXECUTAR pressed: ${nextStep}`, { orientationTarget });
              if (orientationTarget === 'Login') {
                navigation.navigate('Login');
              } else {
                setCurrentView(orientationTarget as any);
              }
            }}
            style={{ padding: 14, backgroundColor: '#4CD964', borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              EXECUTAR
            </Text>
          </TouchableOpacity>
        </View>

        {/* SLICE 06 — OPERATIONAL CARD */}
        <View style={[styles.card, { backgroundColor: '#000a1a', borderColor: '#007AFF', marginBottom: 24 }]}>
          <Text style={[styles.cardHeader, { color: '#007AFF' }]}>HOME REAL — SLICE 06</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Sessão:</Text>
            <Text style={styles.dataValue}>{sessionOpLabel}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Conta backend:</Text>
            <Text style={styles.dataValue}>{backendOpLabel}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Perfil carregado:</Text>
            <Text style={styles.dataValue}>{profileOpLabel}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Histórico:</Text>
            <Text style={styles.dataValue}>{historyOpLabel}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>Estado operacional global:</Text>
          <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>{globalOpState}</Text>

          <TouchableOpacity 
            onPress={() => {
              console.warn('[PROFILE_DIAG] VER ESTADO pressed (from Slice 06)');
              if (authAccount) {
                setCurrentView('home');
              } else {
                navigation.navigate('Login');
              }
            }}
            style={{ padding: 10, backgroundColor: 'rgba(0, 122, 255, 0.2)', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF' }}
          >
            <Text style={{ color: '#007AFF', fontSize: 11, fontWeight: 'bold' }}>VER ESTADO</Text>
          </TouchableOpacity>
        </View>

        {/* SLICE 07 — LONGITUDINAL CARD */}
        <View style={[styles.card, { backgroundColor: '#1a001a', borderColor: '#BF5AF2', marginBottom: 24 }]}>
          <Text style={[styles.cardHeader, { color: '#BF5AF2' }]}>HOME REAL — SLICE 07</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Leitura longitudinal:</Text>
            <Text style={styles.dataValue}>{longitudinalState}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Base disponível:</Text>
            <Text style={styles.dataValue}>{availableBase}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Prontidão para evolução:</Text>
            <Text style={styles.dataValue}>{evolutionReadiness}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              console.warn('[PROFILE_DIAG] VER BASE pressed (from Slice 07)');
              if (authAccount) {
                setCurrentView('home');
              } else {
                navigation.navigate('Login');
              }
            }}
            style={{ marginTop: 12, padding: 10, backgroundColor: 'rgba(191, 90, 242, 0.1)', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#BF5AF2' }}
          >
            <Text style={{ color: '#BF5AF2', fontSize: 11, fontWeight: 'bold' }}>VER BASE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={() => {
              console.warn('[PROFILE_DIAG] HOME button pressed');
              setCurrentView('home');
            }} 
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>PROBE TÉCNICA (SLICE 01)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              console.warn('[PROFILE_DIAG] PERFIL button pressed');
              setCurrentView('profile');
            }} 
            style={[styles.navButton, { marginTop: 16, backgroundColor: '#333' }]}
          >
            <Text style={styles.navButtonText}>PERFIL</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              console.warn('[PROFILE_DIAG] LOGIN button pressed');
              navigation.navigate('Login');
            }} 
            style={[styles.navButton, { marginTop: 16, backgroundColor: '#005577', borderColor: '#00F2FF' }]}
          >
            <Text style={styles.navButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>STEP LIVE 15 — HOME SLICE 07 ACTIVE</Text>
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
    color: '#FF00FF', // Magenta for high visibility
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
