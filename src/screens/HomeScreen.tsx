import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';

/**
 * STEP LIVE 05C — HOME REAL PROBE
 * Direct replacement of the HOME view contents to ensure no previous content remains.
 */

export const HomeScreen = ({ navigation }: any) => {
  const [currentView, setCurrentView] = useState<'root' | 'home' | 'profile'>('root');
  const [viewMode, setViewMode] = useState<'slices' | 'consolidated'>('consolidated');
  
  console.warn('[PROFILE_DIAG] HomeScreen render', { currentView, viewMode });

  // Real data primitives only
  const user = useStore((state) => state.user);
  const activeMemberId = useStore((state) => state.activeMemberId);
  const analyses = useStore((state) => state.analyses);
  const authAccount = useStore((state) => state.authAccount);  const analysesCount = analyses?.length ?? 0;
  const userId = user?.id ?? 'unavailable';
  const activeEmail = authAccount?.email ?? 'unavailable';
  const isProfileComplete = !!(user?.name && authAccount?.email);
  
  // Status Labels
  const sessionStatus = authAccount ? 'autenticada' : 'guest';
  const profileStatusLabel = authAccount ? (isProfileComplete ? 'completo' : 'incompleto') : 'unavailable';
  const accountSummaryLabel = authAccount ? 'ativa' : 'guest';

  // Logic: Longitudinal & Evolution
  let longitudinalState = 'indisponível';
  let availableBase = 'Sem sessão iniciada';
  let evolutionReadiness = 'baixa';
  
  if (authAccount) {
    if (analysesCount === 0) {
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
  }

  // Logic: Availability & Point of Certainty
  let globalAvail = 'acesso mínimo';
  let pointCertainTarget: 'Login' | 'profile' | 'home' = 'Login';

  if (authAccount) {
    const hasName = !!user?.name;
    globalAvail = hasName ? (analysesCount > 0 ? 'base funcional expandida' : 'base funcional pronta') : 'base funcional parcial';
    pointCertainTarget = hasName ? 'home' : 'profile';
  }

  // Logic: Orientation & Next Steps (BLOCO B)
  let nextStep = 'Iniciar sessão';
  let reason = 'Sem sessão ativa';
  let orientationTarget: 'root' | 'home' | 'profile' | 'Login' = 'Login';

  if (authAccount) {
    if (!isProfileComplete) {
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
      orientationTarget = 'home';
    }
  }

  // Logic: Consistency (BLOCO D)
  let dSessionAndProfile = 'não aplicável';
  let dProfileAndContact = 'não aplicável';
  let dGlobalConsistency = 'sem sessão';

  if (authAccount) {
    const hasName = !!user?.name;
    const hasEmail = !!authAccount?.email;
    const hasAnalyses = analysesCount > 0;

    dSessionAndProfile = hasName ? 'coerente' : 'parcial';
    dProfileAndContact = (hasName && hasEmail) ? 'coerente' : 'parcial';
    dGlobalConsistency = (hasName && hasEmail) ? (hasAnalyses ? 'estável' : 'pronta') : 'atenção ao perfil';
  }

  // Handlers
  const handleNavigate = (target: 'root' | 'home' | 'profile' | 'Login') => {
    console.log(`[NAV_DIAG] Navigating to: ${target}`);
    if (target === 'Login') {
      navigation.navigate('Login');
    } else {
      setCurrentView(target);
    }
  };

  const toggleViewMode = (mode: 'slices' | 'consolidated') => {
    console.log(`[VIEW_DIAG] Switching view mode to: ${mode}`);
    setViewMode(mode);
  };
  };

  const renderConsolidatedHome = () => {
    console.log('[SCROLL_DIAG] Rendering Consolidated Home');
    return (
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Text style={styles.title}>Home Consolidada</Text>
        <Text style={styles.subtitle}>Estrutura Base Preparada</Text>

        {/* BLOCO A — STATUS GLOBAL */}
        <View style={[styles.card, { borderColor: '#00F2FF', backgroundColor: '#001a1a', marginBottom: 20 }]}>
          <Text style={styles.cardHeader}>BLOCO A — STATUS GLOBAL</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Sessão:</Text>
            <Text style={styles.dataValue}>{sessionStatus}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email ativo:</Text>
            <Text style={styles.dataValue}>{activeEmail}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Perfil:</Text>
            <Text style={styles.dataValue}>{authAccount ? (user?.name ? 'disponível' : 'parcial') : 'indisponível'}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Backend:</Text>
            <Text style={styles.dataValue}>{authAccount ? (userId !== 'unavailable' ? 'pronto' : 'fallback') : 'unavailable'}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>Disponibilidade global:</Text>
          <Text style={{ color: '#00F2FF', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>{globalAvail}</Text>

          <TouchableOpacity 
            onPress={() => handleNavigate(pointCertainTarget)}
            style={{ padding: 14, backgroundColor: 'rgba(0, 242, 255, 0.1)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#00F2FF' }}
          >
            <Text style={{ color: '#00F2FF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              ABRIR PONTO CERTO
            </Text>
          </TouchableOpacity>
        </View>

        {/* BLOCO B — RECOMENDAÇÃO E AÇÃO */}
        <View style={[styles.card, { borderColor: '#FFCC00', backgroundColor: '#1a1a00', marginBottom: 20 }]}>
          <Text style={[styles.cardHeader, { color: '#FFCC00' }]}>BLOCO B — RECOMENDAÇÃO E AÇÃO</Text>
          <View style={styles.divider} />
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, marginBottom: 4 }}>Próximo passo recomendado:</Text>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{nextStep}</Text>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, marginBottom: 4 }}>Motivo:</Text>
            <Text style={{ color: '#FFCC00', fontSize: 13 }}>{reason}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => handleNavigate(orientationTarget)}
            style={{ padding: 14, backgroundColor: 'rgba(255, 204, 0, 0.1)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FFCC00' }}
          >
            <Text style={{ color: '#FFCC00', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              EXECUTAR
            </Text>
          </TouchableOpacity>
        </View>

        {/* BLOCO C — PAINEL DE INDICADORES */}
        <View style={[styles.card, { borderColor: '#4CD964', backgroundColor: '#001a00', marginBottom: 20 }]}>
          <Text style={[styles.cardHeader, { color: '#4CD964' }]}>BLOCO C — PAINEL DE INDICADORES</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Conta:</Text>
            <Text style={styles.dataValue}>{accountSummaryLabel}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Perfil:</Text>
            <Text style={styles.dataValue}>{authAccount ? (isProfileComplete ? 'completo' : 'incompleto') : 'unavailable'}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Análises:</Text>
            <Text style={styles.dataValue}>{analysesCount}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Leitura longitudinal:</Text>
            <Text style={styles.dataValue}>{longitudinalState}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Prontidão de evolução:</Text>
            <Text style={[styles.dataValue, { color: '#4CD964' }]}>
              {(!authAccount) ? 'baixa' : (
                !isProfileComplete ? 'condicionada' : (
                  analysesCount > 1 ? 'elevada' : 'moderada'
                )
              )}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => handleNavigate(authAccount ? 'home' : 'Login')}
            style={{ marginTop: 12, padding: 14, backgroundColor: 'rgba(76, 217, 100, 0.1)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4CD964' }}
          >
            <Text style={{ color: '#4CD964', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              VER BASE
            </Text>
          </TouchableOpacity>
        </View>

        {/* BLOCO D — CENTRO DE DIAGNÓSTICO */}
        <View style={[styles.card, { borderColor: '#FF00FF', backgroundColor: '#1a001a', marginBottom: 20 }]}>
          <Text style={[styles.cardHeader, { color: '#FF00FF' }]}>BLOCO D — CENTRO DE DIAGNÓSTICO</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>userId:</Text>
            <Text style={styles.dataValue}>{userId}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>activeMemberId:</Text>
            <Text style={styles.dataValue}>{activeMemberId ?? 'unavailable'}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>analysesCount:</Text>
            <Text style={styles.dataValue}>{analysesCount}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Sessão e perfil:</Text>
            <Text style={styles.dataValue}>{dSessionAndProfile}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Perfil e contacto:</Text>
            <Text style={styles.dataValue}>{dProfileAndContact}</Text>
          </View>

            <Text style={[styles.dataValue, { color: '#FF00FF' }]}>{dGlobalConsistency}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              if (authAccount) {
                toggleViewMode('slices');
                setCurrentView('home');
              } else {
                handleNavigate('Login');
              }
            }}
            style={{ marginTop: 12, padding: 14, backgroundColor: 'rgba(255, 0, 255, 0.1)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FF00FF' }}
          >
            <Text style={{ color: '#FF00FF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              ABRIR INSPEÇÃO TÉCNICA
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              toggleViewMode('slices');
              setCurrentView('root');
            }}
            style={{ marginTop: 8, padding: 6, alignItems: 'center' }}
          >
            <Text style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 10, fontWeight: 'bold', textDecorationLine: 'underline' }}>
              VER SLICES COMPLETAS
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.footerSha}>v2.0-stable</Text>
        </View>

      </View>
    );
  };

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
              <Text style={styles.dataValue}>{activeMemberId ?? 'unavailable'}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>analysesCount:</Text>
              <Text style={styles.dataValue}>{analysesCount}</Text>
            </View>
            
            <View style={styles.divider} />
            <Text style={styles.footerSha}>v2.0-stable</Text>
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
              <Text style={styles.footerSha}>v2.0-stable</Text>
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

    console.log('[SCROLL_DIAG] renderContent mounting ScrollView', { currentView, viewMode });

    return (
      <View style={{ flex: 1, width: '100%' }}>
        <ScrollView 
          contentContainerStyle={styles.scrollCenter}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          onScroll={() => console.log('[SCROLL_DIAG] scroll event detected')}
          scrollEventThrottle={16}
        >
          <Text style={styles.title}>Shell mínima funcional</Text>
          <Text style={styles.subtitle}>Canal de produção correto</Text>


        {viewMode === 'consolidated' ? renderConsolidatedHome() : (
          <>

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
            onPress={() => handleNavigate(authAccount ? 'home' : 'Login')}
            style={{ marginTop: 12, padding: 10, backgroundColor: 'rgba(191, 90, 242, 0.1)', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#BF5AF2' }}
          >
            <Text style={{ color: '#BF5AF2', fontSize: 11, fontWeight: 'bold' }}>VER BASE</Text>
          </TouchableOpacity>
        </View>


        {/* SLICE 09 — AVAILABILITY CARD */}
        <View style={[styles.card, { backgroundColor: '#1a1a1a', borderColor: '#5856D6', marginBottom: 24 }]}>
          <Text style={[styles.cardHeader, { color: '#5856D6' }]}>HOME REAL — SLICE 09</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Login:</Text>
            <Text style={styles.dataValue}>{loginAvail}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Perfil:</Text>
            <Text style={styles.dataValue}>{profileAvail}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Histórico técnico:</Text>
            <Text style={styles.dataValue}>{historyAvail}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>Disponibilidade global:</Text>
          <Text style={{ color: '#5856D6', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>{globalAvail}</Text>

          <TouchableOpacity 
            onPress={() => handleNavigate(pointCertainTarget)}
            style={{ padding: 14, backgroundColor: 'rgba(88, 86, 214, 0.2)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#5856D6' }}
          >
            <Text style={{ color: '#5856D6', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              ABRIR PONTO CERTO
            </Text>
          </TouchableOpacity>
        </View>

        {/* SLICE 10 — EVOLUTION READINESS CARD */}
        <View style={[styles.card, { backgroundColor: '#001a1a', borderColor: '#30B0C7', marginBottom: 24 }]}>
          <Text style={[styles.cardHeader, { color: '#30B0C7' }]}>HOME REAL — SLICE 10</Text>
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Base técnica:</Text>
            <Text style={styles.dataValue}>{techBase}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Base de perfil:</Text>
            <Text style={styles.dataValue}>{profileBase}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Base de histórico:</Text>
            <Text style={styles.dataValue}>{historyBase}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Prontidão de evolução:</Text>
            <Text style={[styles.dataValue, { color: '#30B0C7' }]}>{evolutionReadinessLabel}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => handleNavigate(authAccount ? (user?.name ? 'home' : 'profile') : 'Login')}
            style={{ marginTop: 12, padding: 14, backgroundColor: 'rgba(48, 176, 199, 0.2)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#30B0C7' }}
          >
            <Text style={{ color: '#30B0C7', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
              VER PRONTIDÃO
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={() => handleNavigate('home')} 
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>PROBE TÉCNICA (SLICE 01)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleNavigate('profile')} 
            style={[styles.navButton, { marginTop: 16, backgroundColor: '#333' }]}
          >
            <Text style={styles.navButtonText}>PERFIL</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleNavigate('Login')} 
            style={[styles.navButton, { marginTop: 16, backgroundColor: '#005577', borderColor: '#00F2FF' }]}
          >
            <Text style={styles.navButtonText}>LOGIN</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => toggleViewMode('consolidated')}
            style={{ marginTop: 30, padding: 14, backgroundColor: '#5856D6', borderRadius: 12, width: '100%', alignItems: 'center' }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>VER HOME CONSOLIDADA</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
        </ScrollView>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>STEP LIVE 20E — HOME CONSOLIDADA V2 FINAL</Text>
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
  scrollCenter: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 100, // Mais espaço extra para garantir scroll total
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
  placeholderText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  placeholderSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
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
