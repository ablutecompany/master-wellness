import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, TouchableOpacity, Modal } from 'react-native';
import { Container, Typography, BlurView } from '../components/Base';
import { useStore } from '../store/useStore';
import { Analysis, AnalysisMeasurement } from '../store/types';
import { computeAIReadingFromData, AIReading, HolisticDimension, buildAiReadingLLMContextV2 } from '../services/semantic-output/ai-reading-engine';
import { normalizeAIReadingResponse } from '../services/semantic-output/ai-reading-adapter';
import { generateInsightsV2, cancelPendingInsights } from '../services/ai-gateway/client';
import Svg, { Circle } from 'react-native-svg';
import { 
  Activity, Zap, Target, Heart, Moon, FlaskConical, X, 
  ShieldAlert, Info, Focus
} from 'lucide-react-native';

const buildAnalysisValuesHash = (analysis: Analysis | null | undefined) => {
  if (!analysis) return 'none';
  const markers = analysis.measurements?.map((m: AnalysisMeasurement) => `${m.marker || m.type}=${typeof m.value === 'object' ? JSON.stringify(m.value) : m.value}`).sort().join('|') || '';
  return `${analysis.id}-${analysis.demoScenarioKey || 'real'}-${markers}`;
};

const ENABLE_OPENAI_READING = (
  typeof process !== 'undefined' &&
  (process.env as any)?.EXPO_PUBLIC_ENABLE_OPENAI_READING === 'true'
);

type ReadingSource = 'local' | 'openai' | 'fallback';

const DimensionGridCard = ({ dimension, isSelected, onPress }: { dimension: HolisticDimension, isSelected: boolean, onPress: () => void }) => {
  const getDimensionIcon = (id: string) => {
    switch(id) {
      case 'readiness_today': return Zap;
      case 'recovery_load': return Moon;
      case 'internal_balance': return Activity;
      case 'metabolic_rhythm': return Heart;
      case 'digestive_comfort': return Target;
      case 'food_adjustments': return FlaskConical;
      case 'routine_signals': return ShieldAlert;
      case 'next_focus': return Focus;
      default: return Info;
    }
  };

  const Icon = getDimensionIcon(dimension.id);
  const color = dimension.color;
  const score = dimension.score !== null ? dimension.score : '--';
  const radius = 19;
  const strokeWidth = 4;
  const size = 46;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = dimension.score !== null ? circumference - (dimension.score / 100) * circumference : circumference;

  return (
    <TouchableOpacity 
      style={[
        styles.gridCard, 
        isSelected && styles.gridCardSelected,
        isSelected && { borderColor: color, shadowColor: color, shadowOffset: {width:0, height:0}, shadowOpacity: 0.3, shadowRadius: 8 }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.gridCardContent}>
        <View style={styles.ringContainer}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '90deg' }] }}>
            <Circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="transparent" />
            <Circle cx={center} cy={center} r={radius} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" />
          </Svg>
          <View style={styles.ringInnerContent}>
            <Typography style={styles.gridScore}>{score}</Typography>
          </View>
        </View>
        <View style={styles.gridRightContent}>
          <Icon size={12} color={color} style={{ marginBottom: 2 }} />
          <Typography style={styles.gridLabel} numberOfLines={2}>{dimension.title}</Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const AIReadingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const isDemoMode = useStore(state => state.isDemoMode);
  const analyses = useStore(state => state.analyses);
  const demoAnalysis = useStore(state => state.demoAnalysis);
  
  const activeAnalysis = isDemoMode && demoAnalysis ? demoAnalysis : analyses[0];
  
  const localReading: AIReading = useMemo(() => {
    return computeAIReadingFromData(
      activeAnalysis?.measurements || [],
      activeAnalysis?.ecosystemFacts || [],
      isDemoMode
    );
  }, [activeAnalysis, isDemoMode]);

  const [aiReading, setAiReading] = useState<AIReading | null>(null);
  const [readingSource, setReadingSource] = useState<string>('local_fallback');
  const [isRefining, setIsRefining] = useState(false);

  const [selectedDimId, setSelectedDimId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'recommendations' | 'references'>('summary');
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);

  const sourceSnapshotHash = useMemo(() => {
    return buildAnalysisValuesHash(activeAnalysis);
  }, [activeAnalysis]);

  useEffect(() => {
    setAiReading(null);
    setReadingSource('local_fallback');
    setIsRefining(false);
    if (!ENABLE_OPENAI_READING || !activeAnalysis) return;

    cancelPendingInsights();
    let cancelled = false;
    setIsRefining(true);

    const llmContext = buildAiReadingLLMContextV2(localReading, isDemoMode);

    generateInsightsV2(llmContext, activeAnalysis).then((response) => {
      if (cancelled) return;
      if (response?.ok) {
        try {
          const normalized = normalizeAIReadingResponse(response.insight, localReading);
          normalized.summary.mode = isDemoMode ? 'simulation' : 'real';
          setAiReading(normalized);
          setReadingSource(response.meta?.engineSource || 'backend_openai_v2');
        } catch (normErr) { setReadingSource('local_fallback'); }
      } else { setReadingSource('local_fallback'); }
      setIsRefining(false);
    }).catch(() => {
      if (cancelled) return;
      setReadingSource('local_fallback');
      setIsRefining(false);
    });

    return () => { cancelled = true; cancelPendingInsights(); };
  }, [sourceSnapshotHash, isDemoMode]);

  const reading: AIReading = aiReading ?? localReading;
  const dimensions = reading.dimensions || [];

  const getDimensionIcon = (id: string) => {
    switch(id) {
      case 'readiness_today': return Zap;
      case 'recovery_load': return Moon;
      case 'internal_balance': return Activity;
      case 'metabolic_rhythm': return Heart;
      case 'digestive_comfort': return Target;
      case 'food_adjustments': return FlaskConical;
      case 'routine_signals': return ShieldAlert;
      case 'next_focus': return Focus;
      default: return Info;
    }
  };

  const selectedDim = selectedDimId ? dimensions.find(d => d.id === selectedDimId) : null;
  const focusDim = dimensions.find(d => d.id === 'next_focus');
  const auraColor = focusDim && focusDim.color !== '#AAA' ? focusDim.color : '#00FF9D';

  return (
    <Container safe style={styles.container}>
      <View style={styles.atmosphere}>
        <View style={[styles.aura, { backgroundColor: `${auraColor}20` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Typography variant="h1" style={styles.title}>Leitura AI</Typography>
              {readingSource === 'cached' && (
                <Typography style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Recuperada</Typography>
              )}
              {isDemoMode && (
                <View style={styles.demoBadge}>
                  <Typography style={styles.demoLabel}>SIMULAÇÃO</Typography>
                </View>
              )}
              {isRefining && (
                <View style={[styles.demoBadge, { borderColor: '#A020F0' }]}>
                  <Typography style={[styles.demoLabel, { color: '#A020F0' }]}>A refinar…</Typography>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowGlobalInfo(true)} style={styles.iconBtn}>
                <Info size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ÁREA DE TEXTO / MENSAGEM */}
        {(() => {
          if (!selectedDim) {
             return (
               <BlurView intensity={20} tint="dark" style={[styles.messageAreaCard, { height: 'auto', minHeight: 180 }]}>
                 <Typography style={styles.sectionTitle}>SÍNTESE DO MOMENTO</Typography>
                 <Typography variant="h2" style={styles.messageTitle}>{reading.summary.title}</Typography>
                 <Typography style={styles.messageText}>{reading.summary.text}</Typography>
               </BlurView>
             );
          }
          
          const color = selectedDim.color;
          const Icon = getDimensionIcon(selectedDim.id);
          
          return (
             <BlurView intensity={30} tint="dark" style={[styles.messageAreaCard, { borderColor: `${color}40`, backgroundColor: 'rgba(255,255,255,0.03)', height: 'auto', minHeight: 280 }]}>
                 <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
                      <Svg width={100} height={100} style={{ transform: [{ rotate: '90deg' }], position: 'absolute' }}>
                        <Circle cx={50} cy={50} r={44} stroke="rgba(255,255,255,0.05)" strokeWidth={6} fill="transparent" />
                        {selectedDim.score !== null && (
                          <Circle cx={50} cy={50} r={44} stroke={color} strokeWidth={6} strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - selectedDim.score/100)} strokeLinecap="round" fill="transparent" />
                        )}
                      </Svg>
                      <View style={{ alignItems: 'center' }}>
                        <Icon size={20} color={color} style={{ marginBottom: 2 }} />
                        <Typography style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{selectedDim.score ?? '--'}</Typography>
                      </View>
                    </View>
                    
                    <View style={{ flex: 1, paddingLeft: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Typography style={styles.messageTitle} numberOfLines={2}>{selectedDim.title}</Typography>
                        <TouchableOpacity style={{ padding: 4 }}>
                          <Info size={16} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.statusMiniBadge, { backgroundColor: `${color}15`, alignSelf: 'flex-start', marginBottom: 12 }]}>
                        <Typography style={[styles.statusMiniText, { color }]}>{selectedDim.status.toUpperCase()}</Typography>
                      </View>
                    </View>
                 </View>
                 
                 <View style={styles.tabsContainer}>
                   <TouchableOpacity onPress={() => setActiveTab('summary')} style={[styles.tabBtn, activeTab === 'summary' ? { backgroundColor: `${color}20` } : {}]}>
                     <Typography style={[styles.tabBtnText, activeTab === 'summary' ? { color } : {}] as any}>Resumo</Typography>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveTab('recommendations')} style={[styles.tabBtn, activeTab === 'recommendations' ? { backgroundColor: `${color}20` } : {}]}>
                     <Typography style={[styles.tabBtnText, activeTab === 'recommendations' ? { color } : {}] as any}>Ações</Typography>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => setActiveTab('references')} style={[styles.tabBtn, activeTab === 'references' ? { backgroundColor: `${color}20` } : {}]}>
                     <Typography style={[styles.tabBtnText, activeTab === 'references' ? { color } : {}] as any}>Refs</Typography>
                   </TouchableOpacity>
                 </View>

                 <View style={styles.tabContentArea}>
                    {activeTab === 'summary' && (
                      <Typography style={styles.messageText}>{selectedDim.summary}</Typography>
                    )}
                    {activeTab === 'recommendations' && (
                      <View>
                        {selectedDim.recommendations?.length > 0 ? selectedDim.recommendations.map((r, i) => (
                          <View key={i} style={{ marginBottom: 12 }}>
                            <Typography style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>• {r.text}</Typography>
                            <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{r.reason}</Typography>
                          </View>
                        )) : <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Sem ações específicas. Manter consistência.</Typography>}
                      </View>
                    )}
                    {activeTab === 'references' && (
                      <View>
                        {selectedDim.references?.length > 0 ? selectedDim.references.map((r, i) => (
                          <View key={i} style={{ marginBottom: 12 }}>
                            <Typography style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>{r.factor} {r.observedValue ? `(${r.observedValue})` : ''}</Typography>
                            <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{r.whyItMatters}</Typography>
                          </View>
                        )) : <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Refs incorporadas no resumo holístico.</Typography>}
                      </View>
                    )}
                 </View>

             </BlurView>
          );
        })()}

        {/* GRELHA DE DIMENSÕES */}
        <View style={styles.gridContainer}>
          {dimensions.map(d => (
            <DimensionGridCard 
              key={d.id}
              dimension={d}
              isSelected={selectedDimId === d.id}
              onPress={() => {
                if (selectedDimId !== d.id) setActiveTab('summary');
                setSelectedDimId(prev => prev === d.id ? null : d.id);
              }}
            />
          ))}
        </View>

      </ScrollView>

      {/* POPUP: GLOBAL INFO */}
      <Modal visible={showGlobalInfo} transparent animationType="fade">
         <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowGlobalInfo(false)} activeOpacity={1}/>
            <View style={styles.modalCentered}>
              <View style={styles.modalContent}>
                <Typography variant="h3" style={{ color: '#00F2FF', marginBottom: 8 }}>Sobre a Leitura AI</Typography>
                <Typography style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Fundamentos e transparência</Typography>
                <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                  Esta leitura usa um motor holístico para cruzar sinais reais. Nenhuma interpretação substitui aconselhamento clínico.
                </Typography>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowGlobalInfo(false)}>
                   <Typography style={styles.closeBtnText}>FECHAR</Typography>
                </TouchableOpacity>
              </View>
            </View>
         </BlurView>
      </Modal>

    </Container>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#05070A', flex: 1 },
  atmosphere: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  aura: { position: 'absolute', width: 600, height: 600, borderRadius: 300, top: -200, right: -200, opacity: 0.3, ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } : {}) },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  header: { marginBottom: 8 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  demoBadge: { borderColor: '#00F2FF', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, justifyContent: 'center', height: 20 },
  demoLabel: { color: '#00F2FF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  messageAreaCard: { padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  sectionTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  messageTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  messageText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 16 },
  statusMiniBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusMiniText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  tabsContainer: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  tabBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold' },
  tabContentArea: { paddingVertical: 8 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 10, minHeight: 76, justifyContent: 'center' },
  gridCardSelected: { backgroundColor: 'rgba(255,255,255,0.06)' },
  gridCardContent: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  ringContainer: { position: 'relative', width: 46, height: 46, justifyContent: 'center', alignItems: 'center' },
  ringInnerContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, right: 0, bottom: 0 },
  gridRightContent: { flex: 1, paddingLeft: 10, justifyContent: 'center', alignItems: 'flex-start' },
  gridScore: { color: '#fff', fontSize: 14, fontWeight: '800' },
  gridLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500', lineHeight: 14 },

  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  modalCentered: { flex: 1, justifyContent: 'center' },
  modalContent: { backgroundColor: '#0A0D12', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  closeBtn: { marginTop: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
