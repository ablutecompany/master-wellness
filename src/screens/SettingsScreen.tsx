import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { ChevronRight, Globe, Activity, Settings, Shield, Bell, Eye, Database, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { TextInput, SafeAreaView, Switch } from 'react-native';
import { BlurView } from '../components/Base';
import { ECOSYSTEM_REGISTRY } from '../services/ecosystem/registry';
import { Droplet, Info, LayoutGrid, Zap, Brain } from 'lucide-react-native';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useStore(state => state.user);
  const isGuestMode = useStore(state => state.isGuestMode);
  const updateGuestProfile = useStore(state => state.updateGuestProfile);
  const updateAuthenticatedProfile = useStore(state => state.updateAuthenticatedProfile);
  const ecosystemConfig = useStore(state => state.ecosystemConfig);
  const setEcosystemConfig = useStore(state => state.setEcosystemConfig);
  const purgeEcosystemData = useStore(state => state.purgeEcosystemData);
  const purgeDomainData = useStore(state => state.purgeDomainData);
  const resetDemoData = useStore(state => state.resetDemoData);
  const longitudinalMemory = useStore(state => state.longitudinalMemory);

  const handleUpdateLocation = (val: string) => {
    const updates = { location: val };
    if (isGuestMode) {
      useStore.getState().updateGuestProfile(updates);
    } else {
      useStore.getState().updateAuthenticatedProfile(updates);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <View>
              <Typography variant="h3" style={{ fontWeight: '700', color: '#fff' }}>Definições</Typography>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>CONFIGURAÇÃO DO SISTEMA</Typography>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.closeBtnCircle}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 0. GOVERNAÇÃO DO ECOSSISTEMA (Step Shell 5) */}
            <View style={styles.menuSection}>
              <Typography variant="caption" style={styles.sectionLabel}>GOVERNAÇÃO & CONSENTIMENTOS</Typography>
              <View style={styles.cardGroup}>
                <View style={styles.govHeader}>
                  <Shield size={16} color="#00F2FF" />
                  <Typography style={styles.govHeaderText}>CONTROLO DE DADOS E PRIVACIDADE</Typography>
                </View>
                
                {/* NATIVE SOURCES */}
                <View style={styles.govSubHeader}>
                  <Typography variant="caption" style={styles.govSubHeaderText}>FONTES NATIVAS (ABLUTE)</Typography>
                </View>
                {[
                  { id: 'urinalysis', label: 'Análise Urinária', icon: <Droplet size={14} color="#fff" /> },
                  { id: 'physiological', label: 'Sinais Vitais (HR/HRV)', icon: <Activity size={14} color="#fff" /> },
                ].map((src, i) => (
                  <View key={src.id} style={[styles.govItem, i === 1 && { borderBottomWidth: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.govIconBox}>{src.icon}</View>
                      <Typography style={styles.menuTitle}>{src.label}</Typography>
                    </View>
                    <Switch value={true} disabled trackColor={{ false: '#333', true: '#00F2FF' }} />
                  </View>
                ))}

                <View style={styles.divider} />

                {/* ECOSYSTEM APPS */}
                <View style={styles.govSubHeader}>
                  <Typography variant="caption" style={styles.govSubHeaderText}>MÓDULOS DE ECOSSISTEMA (MINI-APPS)</Typography>
                </View>
                
                {ECOSYSTEM_REGISTRY.map((app, idx) => {
                  const config = ecosystemConfig[app.miniapp_id] || { enabled: true, influenceDisabled: false };
                  const isLast = idx === ECOSYSTEM_REGISTRY.length - 1;
                  
                  return (
                    <View key={app.miniapp_id} style={[styles.govItem, isLast && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <LayoutGrid size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
                          <Typography style={styles.menuTitle}>{app.miniapp_id.toUpperCase()}</Typography>
                        </View>
                        <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                          DOMÍNIO: {app.domain.toUpperCase()} • v{app.contract_version}
                        </Typography>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {app.influences_global_profile && (
                            <TouchableOpacity 
                              onPress={() => setEcosystemConfig(app.miniapp_id, { ...config, influenceDisabled: !config.influenceDisabled })}
                              style={[styles.influenceBadge, config.influenceDisabled && styles.influenceDisabled]}
                            >
                              <Zap size={10} color={config.influenceDisabled ? 'rgba(255,255,255,0.3)' : '#00F2FF'} style={{ marginRight: 4 }} />
                              <Typography style={[styles.influenceText, config.influenceDisabled && { color: 'rgba(255,255,255,0.3)' }]}>
                                {config.influenceDisabled ? 'ISOLADO' : 'PERFIL'}
                              </Typography>
                            </TouchableOpacity>
                          )}
                          
                          {app.writes_longitudinal_memory && (
                            <TouchableOpacity 
                              onPress={() => setEcosystemConfig(app.miniapp_id, { ...config, participationDisabled: !config.participationDisabled })}
                              style={[styles.influenceBadge, config.participationDisabled && styles.influenceDisabled, { borderColor: config.participationDisabled ? 'rgba(255,255,255,0.1)' : 'rgba(160, 32, 240, 0.4)' }]}
                            >
                              <Brain size={10} color={config.participationDisabled ? 'rgba(255,255,255,0.3)' : '#A020F0'} style={{ marginRight: 4 }} />
                              <Typography style={[styles.influenceText, { color: config.participationDisabled ? 'rgba(255,255,255,0.3)' : '#A020F0' }]}>
                                {config.participationDisabled ? 'SEM AI' : 'PARTICIPA AI'}
                              </Typography>
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        <Switch 
                          value={config.enabled}
                          onValueChange={(val) => setEcosystemConfig(app.miniapp_id, { ...config, enabled: val })}
                          trackColor={{ false: '#333', true: '#00F2FF' }}
                          thumbColor={Platform.OS === 'ios' ? '#fff' : config.enabled ? '#fff' : '#aaa'}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* 0.1 GESTÃO DE DADOS E APAGAMENTO (Step Shell 6) */}
              <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>GESTÃO DE DADOS & APAGAMENTO</Typography>
              <View style={styles.cardGroup}>
                <View style={styles.govSubHeader}>
                  <Typography variant="caption" style={styles.govSubHeaderText}>LIMPEZA POR DOMÍNIO</Typography>
                </View>
                {Object.keys(longitudinalMemory).map((domain, i) => (
                  <View key={domain} style={[styles.govItem, i === Object.keys(longitudinalMemory).length - 1 && { borderBottomWidth: 0 }]}>
                    <View>
                      <Typography style={styles.menuTitle}>{domain.toUpperCase()}</Typography>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {longitudinalMemory[domain].contributions_count || 0} contributos ativos
                      </Typography>
                    </View>
                    <TouchableOpacity 
                      style={styles.purgeBtn}
                      onPress={() => purgeDomainData(domain)}
                    >
                      <Typography style={styles.purgeBtnText}>APAGAR</Typography>
                    </TouchableOpacity>
                  </View>
                ))}
                
                {Object.keys(longitudinalMemory).length === 0 && (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.2)' }}>Sem dados históricos armazenados.</Typography>
                  </View>
                )}

                <View style={styles.divider} />
                
                <TouchableOpacity 
                  style={[styles.govItem, { borderBottomWidth: 0, backgroundColor: 'rgba(255,51,102,0.05)' }]}
                  onPress={resetDemoData}
                >
                  <View>
                    <Typography style={[styles.menuTitle, { color: '#FF3366' }]}>Reset Total (Limpeza Ética)</Typography>
                    <Typography variant="caption" style={{ color: 'rgba(255,51,102,0.4)' }}>Apaga toda a memória longitudinal e estados derivados.</Typography>
                  </View>
                  <ChevronRight size={20} color="#FF3366" />
                </TouchableOpacity>
              </View>

              <View style={styles.govFooterInfo}>
                <Info size={12} color="rgba(255,255,255,0.2)" />
                <Typography variant="caption" style={styles.govFooterText}>
                  A desativação de um módulo impede a ingestão de novos dados. Módulos 'ISOLADOS' não afetam o resumo biográfico global.
                </Typography>
              </View>
            </View>
        {/* 1. LOCALIZAÇÃO (Migrado do Perfil) */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>GEOGRAFIA & PRIVACIDADE</Typography>
          <View style={styles.cardGroup}>
            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Localização</Typography>
              <View style={styles.groupValueRow}>
                <TextInput
                  value={user?.location || user?.country || ''}
                  onChangeText={handleUpdateLocation}
                  placeholder="Cidade, País"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.inlineInput}
                />
              </View>
            </View>
            <View style={[styles.groupItem, { borderBottomWidth: 0 }]}>
              <Typography style={styles.groupLabel}>Fuso Horário</Typography>
              <Typography variant="caption">{user?.timezone || 'A detetar...'}</Typography>
            </View>
          </View>
        </View>

        {/* 2. SISTEMA & PREFERÊNCIAS (Migrado do Perfil) */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>SISTEMA & PREFERÊNCIAS</Typography>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.groupItem} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Mapa de Equipamento</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.groupItem, { borderBottomWidth: 0 }]} 
              onPress={() => navigation.navigate('OnboardingPermissions')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Activity size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Inputs e Fontes de Dados</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. CONFIGURAÇÕES AVANÇADAS (Migrado do Perfil) */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>AVANÇADO</Typography>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.groupItem} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Shield size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Privacidade e Segurança</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.groupItem} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Bell size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Notificações</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.groupItem, { borderBottomWidth: 0 }]} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Settings size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Configurações Técnicas</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '800',
  },
  cardGroup: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  groupLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  menuTitle: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 14,
  },
  groupValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  inlineInput: {
    color: '#00F2FF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    padding: 0,
    margin: 0,
    minWidth: 120,
  },
  govHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  govHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F2FF',
    marginLeft: 8,
    letterSpacing: 1,
  },
  govSubHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  govSubHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  govItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  govIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  influenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  influenceDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  influenceText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#00F2FF',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  govFooterInfo: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  govFooterText: {
    flex: 1,
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    lineHeight: 14,
  },
  purgeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  purgeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
});
