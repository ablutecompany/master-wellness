import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, TextInput, SafeAreaView, Switch, Modal, Alert } from 'react-native';
import { Typography, BlurView } from '../components/Base';
import { theme } from '../theme';
import { ChevronRight, Globe, Activity, Settings, Shield, Bell, X, Droplet, LayoutGrid, Zap, Brain, Info, Database, Download, Trash2, MapPin, Smartphone, Wifi, Clock, Bug, Terminal, FileJson, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { MINI_APP_CATALOG } from '../miniapps/catalog';
import { ENV } from '../config/env';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

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

const ToggleItem = ({ title, subtitle, value, onValueChange, noBorder }: any) => (
  <View style={[styles.groupItem, noBorder && { borderBottomWidth: 0 }]}>
    <View style={{ flex: 1, paddingRight: 16 }}>
      <Typography style={styles.menuTitle}>{title}</Typography>
      {subtitle && <Typography variant="caption" style={styles.groupSubtitle}>{subtitle}</Typography>}
    </View>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,242,255,0.3)' }} thumbColor={value ? '#00F2FF' : '#999'} />
  </View>
);

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useStore(state => state.user);
  const ecosystemConfig = useStore(state => state.ecosystemConfig) || {};
  const setEcosystemConfig = useStore(state => state.setEcosystemConfig);
  const purgeDomainData = useStore(state => state.purgeDomainData);
  
  // Custom System Config
  const systemConfig: any = ecosystemConfig['system_config'] || {};
  const schedules: any = ecosystemConfig['analysis_schedules'] || {};
  
  const updateSystemConfig = (updates: any) => {
    setEcosystemConfig('system_config', { ...systemConfig, ...updates } as any);
  };
  
  const updateAnalysisSchedule = (memberId: string, schedule: any) => {
    setEcosystemConfig('analysis_schedules', { ...schedules, [memberId]: schedule } as any);
  };

  const aiConfig: any = ecosystemConfig['ai_config'] || { urinalysis: true, stool: true, physiology: true, context: true };
  const updateAiConfig = (updates: any) => {
    setEcosystemConfig('ai_config', { ...aiConfig, ...updates } as any);
  };

  const sourcesConfig: any = ecosystemConfig['sources_config'] || { urinalysis: true, stool: true, physiology: true, context: true };
  const updateSourcesConfig = (updates: any) => {
    setEcosystemConfig('sources_config', { ...sourcesConfig, ...updates } as any);
  };

  // State Modals
  const [dataControlModal, setDataControlModal] = useState(false);
  const [sourcesModal, setSourcesModal] = useState(false);
  const [aiUsageModal, setAiUsageModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [clearAppModal, setClearAppModal] = useState<{ visible: boolean, appId: string | null }>({ visible: false, appId: null });
  const [analysisModeModal, setAnalysisModeModal] = useState(false);

  // Household data for analysis mode
  const household = useStore(state => state.household);
  const householdMembers = household?.members || [];
  
  // Available profiles
  const availableProfiles = [
    { id: user?.id || 'main_user', name: user?.name || 'Eu' },
    ...householdMembers.map((m: any) => ({ id: m.id, name: m.profile?.name || 'Membro' }))
  ];

  // Analysis Mode State
  const [selectedProfileId, setSelectedProfileId] = useState(user?.id || 'main_user');
  
  const defaultSchedule = {
    mode: 'manual',
    frequencyCount: 1,
    frequencyInterval: 1,
    frequencyUnit: 'day',
    includedGroups: { urine: true, feces: true, physiological: true, context: true },
    notificationsEnabled: false
  };

  const [currentSchedule, setCurrentSchedule] = useState<any>(defaultSchedule);

  useEffect(() => {
    const saved = schedules[selectedProfileId];
    if (saved) {
      setCurrentSchedule(saved);
    } else {
      setCurrentSchedule(defaultSchedule);
    }
  }, [selectedProfileId, analysisModeModal]);

  const handleSaveSchedule = () => {
    updateAnalysisSchedule(selectedProfileId, {
      ...currentSchedule,
      updatedAt: new Date().toISOString()
    });
    const profileName = availableProfiles.find(p => p.id === selectedProfileId)?.name;
    Alert.alert('Sucesso', `Modo de análise guardado para ${profileName}.`);
    if (currentSchedule.notificationsEnabled) {
      setTimeout(() => {
        Alert.alert('Notificações', 'As notificações serão ligadas numa fase seguinte. A cadência ficou guardada.');
      }, 500);
    }
    setAnalysisModeModal(false);
  };

  // Export State
  const [exportFormat, setExportFormat] = useState('PDF');
  const [exportRange, setExportRange] = useState('7d');
  
  // Clear App State
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [clearRange, setClearRange] = useState('all');

  // Location logic
  const handleToggleLocation = async (val: boolean) => {
    if (val) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão recusada', 'Pode alterar esta opção nas definições do dispositivo.');
        updateSystemConfig({ locationGranted: false });
        return;
      }
      try {
        const loc = await Location.getLastKnownPositionAsync();
        updateSystemConfig({ locationGranted: true, lastLat: loc?.coords.latitude, lastLng: loc?.coords.longitude });
      } catch (e) {
        updateSystemConfig({ locationGranted: true });
      }
    } else {
      updateSystemConfig({ locationGranted: false });
    }
  };

  const handleExport = async () => {
    // If no history exists, block. (mock check)
    const analyses = useStore.getState().analyses || [];
    if (analyses.length === 0) {
      Alert.alert('Aviso', 'Ainda não existem dados suficientes para exportar. Faça mais análises para criar histórico.');
      return;
    }

    try {
      const fileName = `ablute_export_${Date.now()}`;
      
      if (exportFormat === 'PDF') {
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                h1 { color: #000; font-size: 24px; border-bottom: 2px solid #00F2FF; padding-bottom: 10px; }
                p { font-size: 14px; line-height: 1.6; }
                .meta { color: #666; font-size: 12px; margin-bottom: 30px; }
              </style>
            </head>
            <body>
              <h1>Relatório de Saúde Wellness</h1>
              <div class="meta">
                <p>Data de exportação: ${new Date().toLocaleString()}</p>
                <p>Total de análises: ${analyses.length}</p>
                <p>Período selecionado: ${exportRange}</p>
              </div>
              <p>Este documento contém o resumo dos dados de saúde autorizados para exportação.</p>
              <p><em>(Detalhe das análises em desenvolvimento para a versão final)</em></p>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } else {
          Alert.alert('Aviso', 'A partilha de ficheiros não está suportada neste dispositivo.');
        }
      } else {
        // @ts-ignore
        const fileUri = FileSystem.cacheDirectory + fileName + (exportFormat === 'TXT' ? '.txt' : '.json');
        let content = '';
        if (exportFormat === 'TXT') {
          content = "Relatorio Wellness Ablute\nData: " + new Date().toLocaleString() + "\nAnálises: " + analyses.length;
        } else if (exportFormat === 'JSON') {
          content = JSON.stringify(analyses, null, 2);
        }
        // @ts-ignore
        await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Limitação', 'Partilha não suportada neste dispositivo. (Download em desenvolvimento)');
        }
      }
      setExportModal(false);
    } catch (e) {
      Alert.alert('Erro', 'Ocorreu um erro ao exportar.');
    }
  };

  const handleClearApp = () => {
    if (clearRange === 'all' && clearConfirmText !== 'APAGAR') {
      Alert.alert('Atenção', 'Escreva APAGAR para confirmar a exclusão total.');
      return;
    }
    if (clearAppModal.appId) {
      purgeDomainData(clearAppModal.appId);
      Alert.alert('Dados limpos', 'Nesta fase, esta ação remove dados locais desta app. A eliminação cloud será ligada numa fase posterior.');
    }
    setClearAppModal({ visible: false, appId: null });
    setClearConfirmText('');
  };

  const showDebug = process.env.EXPO_PUBLIC_SHOW_DEBUG_TOOLS === 'true' || (ENV as any)?.EXPO_PUBLIC_SHOW_DEBUG_TOOLS === 'true';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <View style={styles.outerContainer}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <View>
              <Typography variant="h3" style={{ fontWeight: '700', color: '#fff' }}>Configurações</Typography>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>SISTEMA E PRIVACIDADE</Typography>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtnCircle}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* LOCALIZAÇÃO E REGIÃO */}
            <Typography variant="caption" style={styles.sectionLabel}>LOCALIZAÇÃO E REGIÃO</Typography>
            <View style={styles.cardGroup}>
              <ToggleItem 
                title="Permitir localização do dispositivo" 
                subtitle="Usado para contexto geográfico e saúde pública" 
                value={systemConfig?.locationGranted || false}
                onValueChange={handleToggleLocation}
              />
              <View style={[styles.groupItem, { borderBottomWidth: 0 }]}>
                <Typography style={styles.groupLabel}>Fuso horário (Local time)</Typography>
                <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{tz}</Typography>
              </View>
            </View>

            {/* DADOS E CONSENTIMENTOS */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>DADOS E CONSENTIMENTOS</Typography>
            <View style={styles.cardGroup}>
              <ListItem icon={<Shield size={20} color="#00F2FF" />} title="Controlo de dados" subtitle="Visão geral de acessos" onPress={() => setDataControlModal(true)} />
              <ListItem icon={<Database size={20} color="#00F2FF" />} title="Fontes autorizadas" subtitle="Quais sensores/logs alimentam a app" onPress={() => setSourcesModal(true)} />
              <ListItem icon={<Brain size={20} color="#FFD700" />} title="Utilização em Leitura AI" subtitle="Quais dados são enviados para a IA" onPress={() => setAiUsageModal(true)} noBorder />
            </View>

            {/* ROTINAS DE ANÁLISE */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>ROTINAS DE ANÁLISE</Typography>
            <View style={styles.cardGroup}>
              <ListItem icon={<Clock size={20} color="#00F2FF" />} title="Modo de análise" subtitle="Cadências e agendamento por perfil" onPress={() => setAnalysisModeModal(true)} noBorder />
            </View>

            {/* EXPORTAÇÃO */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>EXPORTAÇÃO E LIMPEZA</Typography>
            <View style={styles.cardGroup}>
              <ListItem icon={<Download size={20} color="#fff" />} title="Exportar dados" subtitle="TXT, PDF, JSON" onPress={() => setExportModal(true)} noBorder />
            </View>

            {/* APPS E INTEGRAÇÕES */}
            <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>APPS E INTEGRAÇÕES</Typography>
            <View style={styles.cardGroup}>
              {MINI_APP_CATALOG.map((app, i) => {
                const isEnabled = ecosystemConfig[app.id]?.enabled ?? true;
                return (
                  <View key={app.id} style={[styles.govItem, i === MINI_APP_CATALOG.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={[styles.appIconBase, { backgroundColor: (app.iconBg || '#00F2FF') + '20' }]}>
                        {app.iconName === 'activity' ? <Activity size={16} color={app.iconColor || '#00F2FF'} /> : <Droplet size={16} color={app.iconColor || '#00F2FF'} />}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Typography variant="body" style={{ fontWeight: '600' }}>{app.name}</Typography>
                        <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)' }}>Estado: Instalada</Typography>
                      </View>
                    </View>
                    <ToggleItem 
                      title="Contribuir para Leitura AI" 
                      value={!ecosystemConfig[app.id]?.influenceDisabled}
                      onValueChange={(val: boolean) => setEcosystemConfig(app.id, { ...(ecosystemConfig[app.id]||{}), influenceDisabled: !val } as any)}
                    />
                    <TouchableOpacity style={[styles.purgeBtn, { marginTop: 12 }]} onPress={() => setClearAppModal({ visible: true, appId: app.id })}>
                      <Typography style={styles.purgeBtnText}>LIMPAR DADOS DESTA APP</Typography>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* DEBUG TOOLS */}
            {showDebug && (
              <>
                <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24, color: '#FF3366' }]}>FERRAMENTAS TÉCNICAS (DEBUG)</Typography>
                <View style={styles.cardGroup}>
                  <ListItem icon={<Bug size={20} color="#FF3366" />} title="Mock API" subtitle="Disponível apenas em Dev" onPress={() => {}} />
                  <ListItem icon={<Terminal size={20} color="#FF3366" />} title="Logs Internos" onPress={() => {}} noBorder />
                </View>
              </>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* MODALS */}

      {/* ANALYSIS MODE MODAL */}
      <Modal visible={analysisModeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ color: '#00F2FF', fontWeight: '700', marginBottom: 8 }}>Modo de Análise</Typography>
            <Typography variant="body" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Defina as cadências de avaliação isoladas por perfil.</Typography>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <Typography style={{ color: 'rgba(255,255,255,0.6)', marginRight: 12 }}>Aplicar a:</Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableProfiles.map(p => (
                  <TouchableOpacity key={p.id} style={[styles.pillBtn, selectedProfileId === p.id && styles.pillBtnActive, { marginRight: 8 }]} onPress={() => setSelectedProfileId(p.id)}>
                    <Typography style={{ color: selectedProfileId === p.id ? '#000' : '#fff', fontWeight: selectedProfileId === p.id ? '700' : '500' }}>{p.name}</Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              <TouchableOpacity style={[styles.pillBtn, { flex: 1, alignItems: 'center' }, currentSchedule.mode === 'manual' && styles.pillBtnActive]} onPress={() => setCurrentSchedule({ ...currentSchedule, mode: 'manual' })}>
                <Typography style={{ color: currentSchedule.mode === 'manual' ? '#000' : '#fff', fontWeight: currentSchedule.mode === 'manual' ? '700' : '500' }}>Manual</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pillBtn, { flex: 1, alignItems: 'center' }, currentSchedule.mode === 'automatic' && styles.pillBtnActive]} onPress={() => setCurrentSchedule({ ...currentSchedule, mode: 'automatic' })}>
                <Typography style={{ color: currentSchedule.mode === 'automatic' ? '#000' : '#fff', fontWeight: currentSchedule.mode === 'automatic' ? '700' : '500' }}>Automático</Typography>
              </TouchableOpacity>
            </View>

            {currentSchedule.mode === 'automatic' && (
              <View style={{ marginBottom: 24 }}>
                <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>FREQUÊNCIA</Typography>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['day', 'week', 'month'].map(unit => {
                    const labels: any = { day: 'Dias', week: 'Semanas', month: 'Meses' };
                    return (
                      <TouchableOpacity key={unit} onPress={() => setCurrentSchedule({ ...currentSchedule, frequencyUnit: unit })} style={[styles.pillBtn, currentSchedule.frequencyUnit === unit && styles.pillBtnActive]}>
                        <Typography style={{ color: currentSchedule.frequencyUnit === unit ? '#000' : '#fff' }}>{labels[unit]}</Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <Typography style={{ color: 'rgba(255,255,255,0.7)' }}>{currentSchedule.frequencyCount} vez(es) a cada {currentSchedule.frequencyInterval} {currentSchedule.frequencyUnit}</Typography>
                </View>
              </View>
            )}

            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>GRUPOS INCLUÍDOS</Typography>
            <ToggleItem title="Urinálise" value={currentSchedule.includedGroups.urine} onValueChange={(v: boolean) => setCurrentSchedule({ ...currentSchedule, includedGroups: { ...currentSchedule.includedGroups, urine: v } })} />
            <ToggleItem title="Fezes" value={currentSchedule.includedGroups.feces} onValueChange={(v: boolean) => setCurrentSchedule({ ...currentSchedule, includedGroups: { ...currentSchedule.includedGroups, feces: v } })} />
            <ToggleItem title="Fisiológicos" value={currentSchedule.includedGroups.physiological} onValueChange={(v: boolean) => setCurrentSchedule({ ...currentSchedule, includedGroups: { ...currentSchedule.includedGroups, physiological: v } })} />
            <ToggleItem title="Contexto" value={currentSchedule.includedGroups.context} onValueChange={(v: boolean) => setCurrentSchedule({ ...currentSchedule, includedGroups: { ...currentSchedule.includedGroups, context: v } })} />
            
            <ToggleItem title="Notificações ativas" value={currentSchedule.notificationsEnabled} onValueChange={(v: boolean) => setCurrentSchedule({ ...currentSchedule, notificationsEnabled: v })} noBorder />

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveSchedule}>
              <Typography style={{ fontWeight: '600', color: '#000' }}>Guardar</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAnalysisModeModal(false)}>
              <Typography style={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI USAGE MODAL */}
      <Modal visible={aiUsageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ color: '#FFD700', fontWeight: '700', marginBottom: 8 }}>Dados usados na Leitura AI</Typography>
            <Typography variant="body" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Escolha que dados podem contribuir para as interpretações com IA. Se desligado, não entra no payload.</Typography>
            
            <ToggleItem title="Urinálise" subtitle="Análises de urina e marcadores" value={aiConfig.urinalysis} onValueChange={(v: boolean) => updateAiConfig({ urinalysis: v })} />
            <ToggleItem title="Fezes" subtitle="Bristol, cor, consistência" value={aiConfig.stool} onValueChange={(v: boolean) => updateAiConfig({ stool: v })} />
            <ToggleItem title="Fisiológicos" subtitle="Peso, altura, FC, O2" value={aiConfig.physiology} onValueChange={(v: boolean) => updateAiConfig({ physiology: v })} />
            <ToggleItem title="Contexto" subtitle="Sintomas e declarações" value={aiConfig.context} onValueChange={(v: boolean) => updateAiConfig({ context: v })} noBorder />
            
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setAiUsageModal(false)}>
              <Typography style={{ fontWeight: '600' }}>Concluído</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SOURCES MODAL */}
      <Modal visible={sourcesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ color: '#00F2FF', fontWeight: '700', marginBottom: 8 }}>Fontes Autorizadas</Typography>
            <Typography variant="body" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Selecione que fontes alimentam o ecossistema e podem ser partilhadas com Mini-Apps autorizadas.</Typography>
            
            <ToggleItem title="Urinálise" value={sourcesConfig.urinalysis} onValueChange={(v: boolean) => updateSourcesConfig({ urinalysis: v })} />
            <ToggleItem title="Fezes" value={sourcesConfig.stool} onValueChange={(v: boolean) => updateSourcesConfig({ stool: v })} />
            <ToggleItem title="Fisiológicos" value={sourcesConfig.physiology} onValueChange={(v: boolean) => updateSourcesConfig({ physiology: v })} />
            <ToggleItem title="Contexto" value={sourcesConfig.context} onValueChange={(v: boolean) => updateSourcesConfig({ context: v })} noBorder />
            
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setSourcesModal(false)}>
              <Typography style={{ fontWeight: '600' }}>Concluído</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OVERVIEW MODAL */}
      <Modal visible={dataControlModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Controlo de dados</Typography>
            <Typography variant="body" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Visão geral de acesso aos seus dados. Persistência local (não cloud) nesta fase.</Typography>
            <ListItem title="Urinálise" rightElement={<Typography style={{ color: '#00F2FF' }}>{sourcesConfig.urinalysis ? 'Ativo' : 'Inativo'}</Typography>} />
            <ListItem title="Fezes" rightElement={<Typography style={{ color: '#00F2FF' }}>{sourcesConfig.stool ? 'Ativo' : 'Inativo'}</Typography>} />
            <ListItem title="Leitura AI Autorizada" rightElement={<Typography style={{ color: '#FFD700' }}>{Object.values(aiConfig).some(Boolean) ? 'Parcial' : 'Inativo'}</Typography>} noBorder />
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setDataControlModal(false)}>
              <Typography style={{ fontWeight: '600' }}>Fechar</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EXPORT MODAL */}
      <Modal visible={exportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Exportar dados</Typography>
            <Typography variant="body" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Escolha o formato e a janela temporal que pretende exportar.</Typography>
            
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>FORMATO</Typography>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {['TXT', 'PDF', 'JSON'].map(fmt => (
                <TouchableOpacity key={fmt} onPress={() => setExportFormat(fmt)} style={[styles.pillBtn, exportFormat === fmt && styles.pillBtnActive]}>
                  <Typography style={{ color: exportFormat === fmt ? '#000' : '#fff', fontWeight: exportFormat === fmt ? '700' : '500' }}>{fmt}</Typography>
                </TouchableOpacity>
              ))}
            </View>

            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>PERÍODO</Typography>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
              {['7d', '30d', 'Tudo'].map(rng => (
                <TouchableOpacity key={rng} onPress={() => setExportRange(rng)} style={[styles.pillBtn, exportRange === rng && styles.pillBtnActive]}>
                  <Typography style={{ color: exportRange === rng ? '#000' : '#fff', fontWeight: exportRange === rng ? '700' : '500' }}>{rng}</Typography>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleExport}>
              <Typography style={{ color: '#000', fontWeight: '700' }}>Exportar e Partilhar</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setExportModal(false)}>
              <Typography style={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CLEAR APP MODAL */}
      <Modal visible={clearAppModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ color: '#FF3366', fontWeight: '700', marginBottom: 8 }}>Limpar dados desta app</Typography>
            <Typography variant="body" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Escolha que dados pretende remover. Isto não afeta análises biológicas, apenas outputs gerados por esta mini-app.</Typography>
            
            <View style={{ gap: 8, marginBottom: 24 }}>
              {[
                { id: 'last', label: 'Apenas última análise' },
                { id: 'all', label: 'Todos os dados desta app' }
              ].map(opt => (
                <TouchableOpacity key={opt.id} style={[styles.radioRow, clearRange === opt.id && { borderColor: '#FF3366' }]} onPress={() => setClearRange(opt.id)}>
                  <View style={[styles.radioCircle, clearRange === opt.id && { backgroundColor: '#FF3366', borderColor: '#FF3366' }]} />
                  <Typography style={{ color: clearRange === opt.id ? '#fff' : 'rgba(255,255,255,0.6)' }}>{opt.label}</Typography>
                </TouchableOpacity>
              ))}
            </View>

            {clearRange === 'all' && (
              <TextInput
                style={styles.confirmInput}
                placeholder="Escreva APAGAR para confirmar"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={clearConfirmText}
                onChangeText={setClearConfirmText}
                autoCapitalize="characters"
              />
            )}

            <TouchableOpacity style={styles.dangerBtn} onPress={handleClearApp}>
              <Typography style={{ color: '#fff', fontWeight: '700' }}>Confirmar Limpeza Local</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setClearAppModal({ visible: false, appId: null }); setClearConfirmText(''); }}>
              <Typography style={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#000' },
  modalPanel: { flex: 1, paddingTop: Platform.OS === 'ios' ? 48 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  closeBtnCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4, marginTop: 12 },
  cardGroup: { backgroundColor: 'rgba(20,20,20,0.6)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  groupItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  groupLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  groupSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  menuTitle: { fontWeight: '600', color: '#fff', fontSize: 14 },
  inlineInput: { color: '#00F2FF', fontSize: 13, fontWeight: '700', textAlign: 'right', flex: 1, padding: 0, margin: 0, minWidth: 120 },
  govItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  appIconBase: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  purgeBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,51,102,0.1)', borderWidth: 1, borderColor: 'rgba(255,51,102,0.2)', alignItems: 'center' },
  purgeBtnText: { fontSize: 10, fontWeight: '800', color: '#FF3366', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#111', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  confirmInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  dangerBtn: { backgroundColor: '#FF3366', padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { marginTop: 12, padding: 16, borderRadius: 12, alignItems: 'center' },
  pillBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  radioRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', marginRight: 12 }
});
