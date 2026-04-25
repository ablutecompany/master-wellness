import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, Platform, Dimensions } from 'react-native';
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
  FlaskConical
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
}

export const AnalysesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<ResultsTab>('urina');
  const [selectedItem, setSelectedItem] = useState<FormattedResult | null>(null);

  const isGuestMode = useStore(state => state.isGuestMode);
  const user = useStore(Selectors.selectUser);
  const storeMeasurements = useStore(useShallow(Selectors.selectMeasurements));
  const contextualResults = useStore(useShallow(Selectors.selectContextualResults));
  const hasResultsAccess = useStore(Selectors.selectHasResultsAccess);
  const dataFreshness = useStore(Selectors.selectDataFreshness);

  // 1. Mapeamento e Normalização de Dados
  const allResults = useMemo(() => {
    const formatted: FormattedResult[] = [];

    // Biomarcadores e Fisiológicos (do store principal)
    storeMeasurements.forEach(m => {
      const date = new Date(m.timestamp);
      formatted.push({
        id: m.id,
        name: m.value?.marker || m.type.toUpperCase(),
        value: typeof m.value === 'object' ? (m.value.displayValue || m.value.value || '---') : String(m.value),
        unit: m.value?.unit || '',
        timestamp: m.timestamp,
        dateStr: date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        source: m.type === 'urinalysis' || m.type === 'fecal' ? 'ablute' : 'health_kit',
        type: m.type,
        marker: m.value?.marker
      });
    });

    // Dados Contextuais (do Ecossistema)
    contextualResults.forEach(ctx => {
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
          category: ctx.domain
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
      <Icon size={16} color={activeTab === id ? '#00F2FF' : 'rgba(255,255,255,0.4)'} />
      <Typography style={[styles.tabLabel, activeTab === id && styles.tabLabelActive]}>
        {label}
      </Typography>
    </TouchableOpacity>
  );

  const renderResultCard = (item: FormattedResult, isSmall = false) => (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.resultCard, isSmall && styles.resultCardSmall]}
      onPress={() => setSelectedItem(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          {item.source === 'ablute' ? <FlaskConical size={14} color="#00F2FF" /> : 
           item.source === 'ecosystem' ? <LayoutGrid size={14} color="#A020F0" /> :
           <Activity size={14} color="rgba(255,255,255,0.6)" />}
        </View>
        <Typography variant="caption" style={styles.cardDate}>{item.dateStr}</Typography>
      </View>
      
      <View style={styles.cardMain}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Typography style={styles.cardName} numberOfLines={1}>{item.name}</Typography>
          {item.type === 'contextual' && item.category && (
            <View style={styles.domainBadge}>
              <Typography style={styles.domainBadgeText}>{item.category.toUpperCase()}</Typography>
            </View>
          )}
        </View>
        <View style={styles.valueRow}>
          <Typography style={styles.cardValue}>{item.value}</Typography>
          <Typography variant="caption" style={styles.cardUnit}>{item.unit}</Typography>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <Typography variant="caption" style={styles.cardSource}>
           {item.source === 'ablute' ? 'SINAL BIOLÓGICO' : item.source === 'ecosystem' ? 'CONTEXTO IA' : 'SENSOR'}
         </Typography>
         <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
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
          <Typography variant="h2" style={styles.title}>Resultados</Typography>
          <View style={styles.profileBadge}>
             <Typography style={styles.profileInitial}>{user?.name?.[0] || '?'}</Typography>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={styles.tabScroll}>
          {renderTabButton('urina', 'Urina', Droplets)}
          {renderTabButton('fezes', 'Fezes', Database)}
          {renderTabButton('fisiologicos', 'Fisiológicos', Heart)}
          {renderTabButton('contextuais', 'Contexto', LayoutGrid)}
        </ScrollView>
      </View>

      <GatingOverlay
        isBlocked={isGuestMode}
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
              {/* SECÇÃO RECENTE */}
              <View style={styles.groupHeader}>
                <Clock size={14} color="#00F2FF" />
                <Typography style={styles.groupTitle}>RECENTE</Typography>
              </View>
              {recent.map(r => renderResultCard(r))}

              {/* CONTEXTUAL CTA */}
              <TouchableOpacity 
                style={styles.contextualCTA} 
                onPress={() => navigation.navigate('Temas')}
              >
                <BlurView intensity={20} style={styles.ctaBlur}>
                  <Brain size={16} color="#00F2FF" />
                  <Typography style={styles.ctaText}>VER INTERPRETAÇÃO IA</Typography>
                  <ChevronRight size={14} color="#00F2FF" />
                </BlurView>
              </TouchableOpacity>

              {/* SECÇÃO HISTÓRICO */}
              {historical.length > 0 && (
                <>
                  <View style={[styles.groupHeader, { marginTop: 40 }]}>
                    <History size={14} color="rgba(255,255,255,0.4)" />
                    <Typography style={styles.groupTitle}>HISTÓRICO</Typography>
                  </View>
                  <View style={styles.historyGrid}>
                    {historical.map(r => renderResultCard(r, true))}
                  </View>
                </>
              )}
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
  profileBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00F2FF20',
    borderWidth: 1,
    borderColor: '#00F2FF40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#00F2FF',
    fontWeight: '800',
    fontSize: 14,
  },
  tabContainer: {
    marginBottom: -1, // Overlap border
  },
  tabScroll: {
    paddingRight: 40,
    gap: 16,
    paddingBottom: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0,242,255,0.1)',
    borderColor: 'rgba(0,242,255,0.3)',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  tabLabelActive: {
    color: '#00F2FF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 100,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    opacity: 0.6,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#fff',
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  resultCardSmall: {
    padding: 16,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDate: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '600',
  },
  cardMain: {
    marginBottom: 16,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardValue: {
    color: '#00F2FF',
    fontSize: 28,
    fontWeight: '900',
  },
  cardUnit: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  cardSource: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.25)',
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  contextualCTA: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  ctaBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  ctaText: {
    color: '#00F2FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    flex: 1,
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
