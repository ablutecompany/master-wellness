import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, Platform, Dimensions, Alert } from 'react-native';
import { Container, Typography, LinearGradient, BlurView } from '../components/Base';
import { theme } from '../theme';
import { 
  Database, 
  Activity, 
  Heart,
  Smartphone,
  Info,
  X,
  Droplets,
  Zap,
  LayoutGrid,
  ChevronRight,
  Clock,
  History,
  TrendingUp,
  FlaskConical,
  Brain
} from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as Selectors from '../store/selectors';
import { GatingOverlay } from '../components/GatingOverlay';
import { StateSurface } from '../components/ShellStateSurfaces';

const { width } = Dimensions.get('window');

type ResultsTab = 'urina' | 'fezes' | 'fisiologicos' | 'contextuais';

interface FormattedResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  timestamp: number;
  dateStr: string;
  source: 'ablute' | 'health_kit' | 'ecosystem';
  type: string;
  marker?: string;
  category?: string;
  origin?: string;
  contribution_type?: string;
}

export const AnalysesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<ResultsTab>('urina');
  const [selectedItem, setSelectedItem] = useState<FormattedResult | null>(null);

  const isGuestMode = useStore(state => state.isGuestMode);
  const user = useStore(Selectors.selectUser);
  const storeMeasurements = useStore(useShallow(Selectors.selectMeasurements));
  const contextualResults = useStore(useShallow(Selectors.selectContextualResults));
  const hasResultsAccess = useStore(Selectors.selectHasResultsAccess);
  const isDemoMode = useStore(state => state.isDemoMode);
  const dataFreshness = useStore(useShallow(Selectors.selectDataFreshness));

  // 1. Mapeamento e Normalização de Dados
  const allResults = useMemo(() => {
    const formatted: FormattedResult[] = [];

    // Biomarcadores e Fisiológicos (do store principal)
    storeMeasurements.forEach(m => {
      const date = new Date(m.timestamp);
      
      // Suporte a estrutura flat (demo) ou nested (real)
      const displayMarker = m.marker || (typeof m.value === 'object' ? m.value?.marker : null) || m.type.toUpperCase();
      const displayValue = typeof m.value === 'object' ? (m.value.displayValue || m.value.value || '---') : String(m.value || '---');
      const displayUnit = m.unit || (typeof m.value === 'object' ? m.value?.unit : '') || '';

      formatted.push({
        id: m.id,
        name: displayMarker,
        value: displayValue,
        unit: displayUnit,
        timestamp: m.timestamp,
        dateStr: isDemoMode ? 'SIMULAÇÃO' : date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
        source: 'ablute',
        type: m.type, // FIX: Usar o tipo real da medição (urinalysis, fecal, etc)
        category: m.type,
        origin: 'nfc',
        contribution_type: 'device'
      });
    });

    // Dados Contextuais (do Ecossistema)
    contextualResults.forEach((ctx: any) => {
      if (isDemoMode) {
        // Handle raw facts from demo scenario
        formatted.push({
          id: `demo_ctx_${ctx.id}`,
          name: (ctx.type || 'SINAL').replace(/_/g, ' ').toUpperCase(),
          value: String(ctx.value || '---'),
          unit: '',
          timestamp: ctx.last_update || 1714172400000,
          dateStr: 'DEMO',
          source: 'ecosystem',
          type: 'contextual',
          category: ctx.domain || 'demo',
          origin: 'mock',
          contribution_type: 'action'
        });
        return;
      }

      const summary = ctx.summary_data || {};
      Object.keys(summary).forEach(key => {
        formatted.push({
          id: `ctx_${ctx.domain}_${key}`,
          name: key.replace(/_/g, ' ').toUpperCase(),
          value: String(summary[key]),
          unit: '',
          timestamp: ctx.last_update,
          dateStr: new Date(ctx.last_update).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
          source: 'ecosystem',
          type: 'contextual',
          category: ctx.domain,
          origin: ctx.origin_mode,
          contribution_type: ctx.contribution_type
        });
      });
    });

    return formatted.sort((a, b) => b.timestamp - a.timestamp);
  }, [storeMeasurements, contextualResults]);

  // 2. Filtragem por Tab
  const filteredResults = useMemo(() => {
    switch (activeTab) {
      case 'urina':
        return allResults.filter(r => r.type === 'urinalysis');
      case 'fezes':
        return allResults.filter(r => r.type === 'fecal');
      case 'fisiologicos':
        return allResults.filter(r => ['ecg', 'ppg', 'weight', 'temp', 'impedance'].includes(r.type));
      case 'contextuais':
        return allResults.filter(r => r.type === 'contextual');
      default:
        return [];
    }
  }, [allResults, activeTab]);

  // 3. Separação Recente vs Histórico
  const recent = filteredResults.slice(0, 1);
  const historical = filteredResults.slice(1);

  const renderTabButton = (id: ResultsTab, label: string, Icon: any) => (
    <TouchableOpacity 
      onPress={() => setActiveTab(id)}
      style={[styles.tabButton, activeTab === id && styles.tabButtonActive]}
    >
      <Icon size={14} color={activeTab === id ? '#00F2FF' : 'rgba(255,255,255,0.4)'} />
      <Typography style={[styles.tabLabel, activeTab === id && styles.tabLabelActive]}>
        {label}
      </Typography>
    </TouchableOpacity>
  );

  const renderResultRow = (item: FormattedResult) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.resultRow}
      onPress={() => setSelectedItem(item)}
    >
      <View style={styles.rowLeft}>
        <Typography style={styles.rowName} numberOfLines={1}>{item.name}</Typography>
        {item.type === 'contextual' && (
           <Typography variant="caption" style={styles.rowCategory}>{item.category?.toUpperCase()}</Typography>
        )}
      </View>
      <View style={styles.rowRight}>
        <Typography style={styles.rowValue}>{item.value}</Typography>
        {!!item.unit && <Typography style={styles.rowUnit}>{item.unit}</Typography>}
      </View>
    </TouchableOpacity>
  );

  return (
    <Container safe style={styles.container}>
      <View style={styles.atmosphere}>
        <LinearGradient 
          colors={['rgba(0, 242, 255, 0.05)', 'transparent']}
          style={[styles.glowBall, { top: -100, right: -100 }]} 
        />
      </View>

      {/* HEADER FIXO */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.titleWrapper}>
            <Typography variant="h2" style={styles.title}>Bioanálise</Typography>
            {isDemoMode && (
              <View style={styles.demoPill}>
                <Zap size={10} color="#00F2FF" />
                <Typography style={styles.demoPillText}>SIMULAÇÃO</Typography>
              </View>
            )}
          </View>
          
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.secondaryRow}>
          <Typography style={styles.dateText}>
            {isDemoMode ? 'SIMULAÇÃO' : (filteredResults[0]?.dateStr || new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }))}
          </Typography>
          <TouchableOpacity 
            onPress={() => {
              const msg = 'O histórico biográfico consolidado está a ser processado para este membro.';
              if (Platform.OS === 'web') window.alert(msg);
              else Alert.alert('Histórico', msg);
            }} 
            style={styles.historyShortcut}
          >
            <History size={12} color="rgba(255,255,255,0.4)" />
            <Typography style={styles.historyText}>Histórico</Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {renderTabButton('urina', 'Urina', Droplets)}
          {renderTabButton('fezes', 'Fezes', Database)}
          {renderTabButton('fisiologicos', 'Fisiológico', Heart)}
          {renderTabButton('contextuais', 'Contexto', LayoutGrid)}
        </View>
      </View>

      <GatingOverlay
        isBlocked={isGuestMode && !isDemoMode}
        message="Inicie sessão para gerir o seu histórico biográfico completo."
        actionLabel="Voltar"
        onAction={() => navigation.navigate('Home')}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {!hasResultsAccess ? (
            <StateSurface 
              type="restricted"
              title="Acesso Privado"
              description="Este membro optou por não partilhar os seus registos factuais."
              color="#FF6060"
            />
          ) : filteredResults.length === 0 ? (
            <StateSurface 
              type="no_data"
              title="Sem Registos"
              description={`Ainda não existem dados sincronizados para a categoria ${activeTab}.`}
              color="rgba(255,255,255,0.2)"
            />
          ) : (
            <>
              {/* LISTA DE RESULTADOS (LINHAS COMPACTAS) */}
              <View style={styles.resultsList}>
                {filteredResults.map(r => renderResultRow(r))}
              </View>
            </>
          )}

          <View style={styles.footer}>
             <Info size={14} color="rgba(255,255,255,0.2)" />
              <Typography variant="caption" style={styles.footerDisclaimer}>
                Dados de referência biológica para suporte funcional. Não constitui diagnóstico clínico.
              </Typography>
              <Typography variant="caption" style={styles.markerText}>
                {isDemoMode ? 'MODO DEMO ATIVO • ' : ''}RESULTS V2.2 • {dataFreshness.temporalLabel.toUpperCase()}
              </Typography>
              <Typography variant="caption" style={[styles.markerText, { marginTop: 4, opacity: 0.5 }]}>
                ANALYSES HOTFIX LIVE MARKER: HOTFIX_VER_02
              </Typography>
          </View>
        </ScrollView>
      </GatingOverlay>

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedItem} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedItem(null)}>
           <BlurView intensity={90} tint="dark" style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Typography variant="h3" style={styles.modalName}>{selectedItem?.name}</Typography>
              <Typography variant="caption" style={styles.modalDate}>{selectedItem?.dateStr}</Typography>
              
              <View style={styles.modalValueBox}>
                 <Typography style={styles.modalValue}>{selectedItem?.value}</Typography>
                 <Typography style={styles.modalUnit}>{selectedItem?.unit}</Typography>
              </View>

              <View style={styles.infoBox}>
                 <Typography style={styles.infoTitle}>Audit Trace</Typography>
                 <Typography style={styles.infoText}>
                   Este registo foi capturado via {selectedItem?.source === 'ablute' ? 'infraestrutura Ablute_' : 'dispositivo periférico'} 
                   e indexado na sua memória biográfica longitudinal para análise de tendências.
                 </Typography>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                 <Typography style={styles.closeBtnText}>FECHAR</Typography>
              </TouchableOpacity>
           </BlurView>
        </TouchableOpacity>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05070A',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowBall: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    letterSpacing: -0.5,
  },
  titleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  demoPillText: {
    color: '#00F2FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  dateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  historyShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  tabButtonActive: {
    borderColor: '#00F2FF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: '#00F2FF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  resultsList: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  rowName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rowCategory: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  rowValue: {
    color: '#00F2FF',
    fontSize: 20,
    fontWeight: '800',
  },
  rowUnit: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  footerDisclaimer: {
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  markerText: {
    color: 'rgba(0, 242, 255, 0.3)',
    fontSize: 8,
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0E14',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginBottom: 24,
  },
  domainBadge: {
    backgroundColor: 'rgba(160, 32, 240, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(160, 32, 240, 0.3)',
  },
  domainBadgeText: {
    color: '#A020F0',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  semanticBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  originBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
  },
  originBadgeText: {
    fontSize: 7,
    fontWeight: '800',
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  typeBadgeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 7,
    fontWeight: '800',
  },
  demoBanner: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
  },
  demoBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  demoBannerText: {
    color: '#00F2FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  modalName: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalDate: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 32,
  },
  modalValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  modalValue: {
    color: '#00F2FF',
    fontSize: 48,
    fontWeight: '900',
  },
  modalUnit: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 20,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 2,
  }
});
