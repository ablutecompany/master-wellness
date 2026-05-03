import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, TextInput, SafeAreaView, Switch, Modal } from 'react-native';
import { Typography, BlurView } from '../components/Base';
import { theme } from '../theme';
import { ChevronRight, Globe, Activity, Settings, Shield, Bell, X, Droplet, LayoutGrid, Zap, Brain, Info, Database, User, CreditCard, LogOut, Download, Trash2, Camera, Image as ImageIcon, MapPin, Smartphone, Wifi, Clock, Bug, Terminal, FileJson, AlertTriangle } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { ECOSYSTEM_REGISTRY } from '../services/ecosystem/registry';
import { ENV } from '../config/env';

const ListItem = ({ icon, title, subtitle, rightElement, onPress, noBorder, titleColor }: any) => (
  <TouchableOpacity style={[styles.groupItem, noBorder && { borderBottomWidth: 0 }]} onPress={onPress} disabled={!onPress && !rightElement}>
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {icon && <View style={{ marginRight: 12 }}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Typography style={[styles.menuTitle, titleColor && { color: titleColor }]}>{title}</Typography>
        {subtitle && <Typography variant="caption" style={styles.groupSubtitle}>{subtitle}</Typography>}
      </View>
    </View>
    {rightElement ? rightElement : (onPress ? <ChevronRight size={20} color={theme.colors.textMuted} /> : null)}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useStore(state => state.user);
  const isGuestMode = useStore(state => state.isGuestMode);
  const ecosystemConfig = useStore(state => state.ecosystemConfig) || {};
  const setEcosystemConfig = useStore(state => state.setEcosystemConfig);
  const purgeDomainData = useStore(state => state.purgeDomainData);
  const resetDemoData = useStore(state => state.resetDemoData);

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleUpdateLocation = (val: string) => {
    const updates = { location: val };
    if (isGuestMode) {
      useStore.getState().updateGuestProfile(updates);
    } else {
      useStore.getState().updateAuthenticatedProfile(updates);
    }
  };

  const handleApagarTudo = () => {
    if (resetConfirmText === 'APAGAR') {
      resetDemoData();
      setResetModalVisible(false);
      setResetConfirmText('');
    }
  };

  const showDebug = process.env.EXPO_PUBLIC_SHOW_DEBUG_TOOLS === 'true' || (ENV as any)?.EXPO_PUBLIC_SHOW_DEBUG_TOOLS === 'true';

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
            {/* 1. CONTA */}
            <Typography variant="caption" style={styles.sectionLabel}>1. CONTA</Typography>
            <View style={styles.cardGroup}>
              <ListItem icon={<User size={20} color="#fff" />} title="Perfil" onPress={() => navigation.navigate('Profile')} />
              <ListItem icon={<Database size={20} color="#fff" />} title="Membros do agregado" onPress={() => {}} />
              <ListItem icon={<CreditCard size={20} color="#fff" />} title="Plano e tokens" onPress={() => {}} />
              <ListItem icon={<LogOut size={20} color="#FF3366" />} title="Sessão" titleColor="#FF3366" onPress={() => {}} noBorder />
            </View>

            {/* LOCALIZAÇÃO E REGIÃO */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>LOCALIZAÇÃO E REGIÃO</Typography>
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

            {/* 2. DADOS E CONSENTIMENTOS */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>2. DADOS E CONSENTIMENTOS</Typography>
            <View style={styles.cardGroup}>
              <ListItem icon={<Shield size={20} color="#00F2FF" />} title="Controlo de dados" onPress={() => {}} />
              <ListItem icon={<Activity size={20} color="#fff" />} title="Fontes autorizadas" onPress={() => {}} />
              <ListItem icon={<Brain size={20} color="#fff" />} title="Utilização em Leitura AI" onPress={() => {}} />
              <ListItem icon={<LayoutGrid size={20} color="#fff" />} title="Utilização por mini-apps" onPress={() => {}} />
              <ListItem icon={<Download size={20} color="#fff" />} title="Exportar dados" onPress={() => {}} />
              <ListItem icon={<Trash2 size={20} color="#FF3366" />} title="Apagar dados e histórico" titleColor="#FF3366" onPress={() => setResetModalVisible(true)} noBorder />
            </View>

            {/* 3. FONTES DE DADOS */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>3. FONTES DE DADOS</Typography>
            <View style={styles.cardGroup}>
              {[
                { id: 'urinalysis', label: 'Análise urinária', status: 'Ativo' },
                { id: 'fecal', label: 'Caracterização fecal', status: 'Ativo' },
                { id: 'vitals', label: 'Sinais vitais', status: 'Inativo' },
                { id: 'impedance', label: 'Impedância', status: 'Inativo' },
                { id: 'ecg', label: 'ECG', status: 'Sem dados' },
                { id: 'weight', label: 'Peso', status: 'Ativo' },
                { id: 'context', label: 'Contexto manual', status: 'Ativo' },
                { id: 'miniapps', label: 'Mini-apps', status: 'Ativo' },
              ].map((src, i, arr) => (
                <View key={src.id} style={[styles.govItem, i === arr.length - 1 && { borderBottomWidth: 0 }, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Typography style={styles.menuTitle}>{src.label}</Typography>
                    <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)' }}>{src.status}</Typography>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>Usar na Leitura AI</Typography>
                    <Switch value={true} disabled trackColor={{ false: '#333', true: '#00F2FF' }} thumbColor="#fff" />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>Usar no Perfil Wellness</Typography>
                    <Switch value={true} disabled trackColor={{ false: '#333', true: '#A020F0' }} thumbColor="#fff" />
                  </View>
                </View>
              ))}
            </View>

            {/* 4. APPS E INTEGRAÇÕES */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>4. APPS E INTEGRAÇÕES</Typography>
            <View style={styles.cardGroup}>
              {ECOSYSTEM_REGISTRY.map((app, idx) => {
                const config = ecosystemConfig[app.miniapp_id] || { enabled: true, influenceDisabled: false, participationDisabled: false };
                const isLast = idx === ECOSYSTEM_REGISTRY.length - 1;
                
                return (
                  <View key={app.miniapp_id} style={[styles.govItem, isLast && { borderBottomWidth: 0 }, { flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Typography style={styles.menuTitle}>{(app as any).name || app.miniapp_id.toUpperCase()}</Typography>
                      <Typography variant="caption" style={{ color: config.enabled ? '#00F2FF' : 'rgba(255,255,255,0.4)' }}>
                        {config.enabled ? 'Instalado' : 'Disponível'}
                      </Typography>
                    </View>
                    <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 16 }}>
                      DOMÍNIO: {app.domain.toUpperCase()} • VERSÃO: {app.contract_version}
                    </Typography>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>Pode contribuir para Leitura AI</Typography>
                      <Switch 
                        value={!config.participationDisabled}
                        onValueChange={(val) => setEcosystemConfig(app.miniapp_id, { ...config, participationDisabled: !val })}
                        trackColor={{ false: '#333', true: '#00F2FF' }} thumbColor="#fff" 
                      />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>Pode atualizar Perfil Wellness</Typography>
                      <Switch 
                        value={!config.influenceDisabled}
                        onValueChange={(val) => setEcosystemConfig(app.miniapp_id, { ...config, influenceDisabled: !val })}
                        trackColor={{ false: '#333', true: '#A020F0' }} thumbColor="#fff" 
                      />
                    </View>
                    <TouchableOpacity style={styles.purgeBtn} onPress={() => purgeDomainData(app.domain)}>
                      <Typography style={styles.purgeBtnText}>LIMPAR DADOS DESTA APP</Typography>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* 5. PRIVACIDADE E SEGURANÇA */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>5. PRIVACIDADE E SEGURANÇA</Typography>
            <View style={styles.cardGroup}>
              <ListItem icon={<Shield size={20} color="#fff" />} title="Consentimentos" onPress={() => {}} />
              <ListItem icon={<Smartphone size={20} color="#fff" />} title="Permissões do dispositivo" onPress={() => {}} />
              <ListItem icon={<Camera size={20} color="#fff" />} title="Câmara" onPress={() => {}} />
              <ListItem icon={<ImageIcon size={20} color="#fff" />} title="Galeria" onPress={() => {}} />
              <ListItem icon={<Bell size={20} color="#fff" />} title="Notificações" onPress={() => {}} />
              <ListItem icon={<MapPin size={20} color="#fff" />} title="Localização" onPress={() => {}} />
              <ListItem icon={<Download size={20} color="#fff" />} title="Exportar dados" onPress={() => {}} />
              <ListItem icon={<Trash2 size={20} color="#FF3366" />} title="Apagar conta/dados" titleColor="#FF3366" onPress={() => setResetModalVisible(true)} noBorder />
            </View>

            {/* 6. SISTEMA E EQUIPAMENTO */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>6. SISTEMA E EQUIPAMENTO</Typography>
            <View style={styles.cardGroup}>
              <ListItem icon={<Settings size={20} color="#fff" />} title="Modo de funcionamento" subtitle="Simulação" onPress={() => {}} />
              <ListItem icon={<Globe size={20} color="#fff" />} title="Equipamento emparelhado" subtitle="Nenhum" onPress={() => {}} />
              <ListItem icon={<MapPin size={20} color="#fff" />} title="Mapa de equipamento" onPress={() => {}} />
              <ListItem icon={<Activity size={20} color="#fff" />} title="Inputs e fontes de dados" onPress={() => {}} />
              <ListItem icon={<Wifi size={20} color="#fff" />} title="Método de ativação" subtitle="NFC / QR / preset" onPress={() => {}} />
              <ListItem icon={<Clock size={20} color="#fff" />} title="Última sincronização" subtitle="Sem dados" noBorder onPress={() => {}} />
            </View>

            {/* 7. TÉCNICO / DESENVOLVIMENTO */}
            {showDebug && (
              <>
                <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>7. TÉCNICO / DESENVOLVIMENTO</Typography>
                <View style={styles.cardGroup}>
                  <ListItem icon={<Activity size={20} color="#00F2FF" />} title="Simular Meal (Nutri)" onPress={() => {
                      const store = useStore.getState();
                      if (!store.grantedPermissions['nutri-menu']) {
                        store.grantPermissions('nutri-menu', ['all'] as any);
                      }
                      import('../services/ecosystem/bridge').then(m => {
                        m.bridge.dispatchContribution({
                          event_id: `test_${Date.now()}`,
                          miniapp_id: 'nutri-menu',
                          event_type: 'meal_logged',
                          recorded_at: Date.now(),
                          received_at: Date.now(),
                          confidence: 1.0,
                          contract_version: '1.2.0',
                          payload: { calories: 450, meal_type: 'lunch' }
                        });
                      });
                  }} />
                  <ListItem icon={<FileJson size={20} color="#00F2FF" />} title="Solicitar Context Bundle" onPress={() => {
                      import('../services/ecosystem/bridge').then(m => {
                        m.bridge.getContextBundle();
                      });
                  }} />
                  <ListItem icon={<Database size={20} color="#00F2FF" />} title="Eventos da bridge" onPress={() => {}} />
                  <ListItem icon={<Terminal size={20} color="#00F2FF" />} title="Logs" onPress={() => {}} />
                  <ListItem icon={<Bug size={20} color="#00F2FF" />} title="Feature flags" onPress={() => {}} />
                  <ListItem icon={<Trash2 size={20} color="#FF3366" />} title="Reset técnico" titleColor="#FF3366" onPress={resetDemoData} noBorder />
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* MODAL RESET */}
        <Modal visible={resetModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <AlertTriangle size={24} color="#FF3366" style={{ marginRight: 12 }} />
                <Typography variant="h3" style={{ color: '#fff', fontWeight: '700' }}>Apagar dados e histórico</Typography>
              </View>
              
              <Typography style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16, fontSize: 13, lineHeight: 20 }}>
                Esta ação pode remover dados usados para histórico, personalização e leituras futuras.
              </Typography>
              
              <View style={{ backgroundColor: 'rgba(255,51,102,0.1)', padding: 12, borderRadius: 8, marginBottom: 24 }}>
                <Typography style={{ color: '#FF3366', fontSize: 11, fontWeight: '600', lineHeight: 16 }}>
                  Esta ação remove apenas dados locais nesta versão. O apagamento cloud será tratado numa fase posterior.
                </Typography>
              </View>

              <TouchableOpacity style={styles.resetOptionBtn} onPress={() => { setResetModalVisible(false); }}>
                <Typography style={styles.resetOptionText}>Apagar histórico de análises</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetOptionBtn} onPress={() => { setResetModalVisible(false); }}>
                <Typography style={styles.resetOptionText}>Apagar contexto AI</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetOptionBtn} onPress={() => { setResetModalVisible(false); }}>
                <Typography style={styles.resetOptionText}>Apagar dados das mini-apps</Typography>
              </TouchableOpacity>

              <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                <Typography style={{ color: '#FF3366', fontWeight: '600', marginBottom: 12 }}>Apagar tudo</Typography>
                <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 }}>
                  Para apagar tudo, escreva "APAGAR" abaixo:
                </Typography>
                <TextInput 
                  value={resetConfirmText}
                  onChangeText={setResetConfirmText}
                  placeholder="APAGAR"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  style={styles.confirmInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  style={[styles.dangerBtn, resetConfirmText !== 'APAGAR' && { opacity: 0.5 }]} 
                  disabled={resetConfirmText !== 'APAGAR'}
                  onPress={handleApagarTudo}
                >
                  <Typography style={{ color: '#fff', fontWeight: '700' }}>Confirmar Apagamento</Typography>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setResetModalVisible(false); setResetConfirmText(''); }}>
                <Typography style={{ color: '#fff', fontWeight: '600' }}>Cancelar</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
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
  groupSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
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
  govItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  purgeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.2)',
    alignItems: 'center',
  },
  purgeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF3366',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resetOptionBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  resetOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  dangerBtn: {
    backgroundColor: '#FF3366',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
