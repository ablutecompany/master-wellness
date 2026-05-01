import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, TouchableOpacity, Modal } from 'react-native';
import { Container, Typography, BlurView } from '../components/Base';
import { useStore } from '../store/useStore';
import { Analysis, AnalysisMeasurement } from '../store/types';
import { computeAIReadingFromData, AIReading, HolisticDimension, buildAiReadingLLMContextV2 } from '../services/semantic-output/ai-reading-engine';
import { normalizeAIReadingResponse } from '../services/semantic-output/ai-reading-adapter';
import { generateInsightsV2, cancelPendingInsights } from '../services/ai-gateway/client';
import { ENV } from '../config/env';
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

const ENABLE_OPENAI_READING = true;

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
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  const [selectedDimId, setSelectedDimId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'recommendations' | 'references'>('summary');
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);
  const [requestStarted, setRequestStarted] = useState(false);
  const [responseStatus, setResponseStatus] = useState<string | number>('n/a');

  const sourceSnapshotHash = useMemo(() => {
    return buildAnalysisValuesHash(activeAnalysis);
  }, [activeAnalysis]);

  useEffect(() => {
    setAiReading(null);
    setReadingSource('local_fallback');
    setFallbackReason('REQUEST_NOT_STARTED');
    setRequestStarted(false);
    setResponseStatus('n/a');
    setIsRefining(false);
    if (!ENABLE_OPENAI_READING || !activeAnalysis) {
      setFallbackReason('EARLY_RETURN_NO_ANALYSIS');
      return;
    }

    cancelPendingInsights();
    let cancelled = false;
    setIsRefining(true);
    setRequestStarted(true);
    setFallbackReason('LOADING');

    const llmContext = buildAiReadingLLMContextV2(localReading, isDemoMode);

    console.log(`[R5C10_AI_READING_STATE] requestStarted=true | clientReturnedOk=pending | provider=pending | fallbackReasonFromClient=pending | fallbackReasonFinal=LOADING | readingSourceFinal=local_fallback`);

    generateInsightsV2(llmContext, activeAnalysis).then((response) => {
      if (cancelled) return;
      if (response === null) {
        setReadingSource('local_fallback');
        setFallbackReason('CANCELLED_OR_SUPERSEDED');
        console.log(`[R5C10_AI_READING_STATE] requestStarted=true | clientReturnedOk=null | fallbackReasonFinal=CANCELLED_OR_SUPERSEDED`);
      } else if (response.ok) {
        try {
          const normalized = normalizeAIReadingResponse(response.insight, localReading);
          normalized.summary.mode = isDemoMode ? 'simulation' : 'real';
          setAiReading(normalized);
          setReadingSource(response.meta?.engineSource || 'backend_openai_v2');
          setFallbackReason(null);
          setResponseStatus(200);
          console.log(`[R5C10_AI_READING_STATE] requestStarted=true | clientReturnedOk=true | provider=${response.provider} | fallbackReasonFinal=null | readingSourceFinal=${response.meta?.engineSource || 'backend_openai_v2'}`);
        } catch (normErr: any) { 
          setReadingSource('local_fallback'); 
          setFallbackReason('NORMALIZE_RESPONSE_FAILED');
          console.log(`[R5C10_AI_READING_STATE] requestStarted=true | clientReturnedOk=true | provider=${response.provider} | fallbackReasonFinal=NORMALIZE_RESPONSE_FAILED`);
        }
      } else { 
        setReadingSource('local_fallback'); 
        setFallbackReason(response.error?.code || 'RESPONSE_OK_FALSE_WITHOUT_CODE');
        setResponseStatus((response as any).status || 'error');
        console.log(`[R5C10_AI_READING_STATE] requestStarted=true | clientReturnedOk=false | fallbackReasonFinal=${response.error?.code}`);
      }
      setIsRefining(false);
    }).catch((err: any) => {
      if (cancelled) return;
      setReadingSource('local_fallback');
      setFallbackReason(err.code || 'CLIENT_EXCEPTION');
      console.log(`[R5C10_AI_READING_STATE] requestStarted=true | catchError=${err.code || 'CLIENT_EXCEPTION'} | fallbackReasonFinal=${err.code || 'CLIENT_EXCEPTION'}`);
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
              { (ENV.IS_DEV || ENV.SHOW_AI_DEBUG_BADGE) ? (
                <Typography style={{ fontSize: 10, color: fallbackReason ? '#FFB800' : 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  Fonte: {readingSource}{readingSource === 'cached' ? ' · Recuperada' : ''}{fallbackReason && fallbackReason !== 'LOADING' ? ` · ${fallbackReason}` : (fallbackReason === 'LOADING' ? ' · A carregar...' : (readingSource === 'local_fallback' ? ' · UNKNOWN_FALLBACK_REASON' : ''))}
                  {'\n'}Backend: {ENV.BACKEND_URL || 'undefined'}
                  {'\n'}Status: {responseStatus} · requestStarted: {requestStarted ? 'true' : 'false'}
                </Typography>
              ) : (
                <Typography style={{ fontSize: 10, color: fallbackReason && fallbackReason !== 'LOADING' ? '#FFB800' : 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  {fallbackReason === 'LOADING' ? 'A gerar leitura...' : (readingSource === 'cached' ? 'Leitura recuperada' : (readingSource === 'local_fallback' ? 'Análise local de segurança' : (isDemoMode ? 'Simulação' : 'Leitura atualizada')))}
                </Typography>
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
               <BlurView intensity={20} tint="dark" style={[styles.messageAreaCard, { height: 'auto', minHeight: 140 }]}>
                 <Typography style={styles.sectionTitle}>SÍNTESE DO MOMENTO</Typography>
                 <Typography style={styles.messageTitle}>{reading.summary.title}</Typography>
                 <Typography style={styles.messageText}>{reading.summary.text}</Typography>
               </BlurView>
             );
          }
          
          const color = selectedDim.color;
          const Icon = getDimensionIcon(selectedDim.id);
          
          return (
             <BlurView intensity={30} tint="dark" style={[styles.messageAreaCard, { borderColor: `${color}40`, backgroundColor: 'rgba(255,255,255,0.02)', height: 'auto', minHeight: 200 }]}>
                 <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
                      <Svg width={80} height={80} style={{ transform: [{ rotate: '90deg' }], position: 'absolute' }}>
                        <Circle cx={40} cy={40} r={36} stroke="rgba(255,255,255,0.05)" strokeWidth={4} fill="transparent" />
                        {selectedDim.score !== null && (
                          <Circle cx={40} cy={40} r={36} stroke={color} strokeWidth={4} strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - selectedDim.score/100)} strokeLinecap="round" fill="transparent" />
                        )}
                      </Svg>
                      <View style={{ alignItems: 'center' }}>
                        <Icon size={16} color={color} style={{ marginBottom: 2 }} />
                        <Typography style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{selectedDim.score ?? '--'}</Typography>
                      </View>
                    </View>
                    
                    <View style={{ flex: 1, paddingLeft: 4, justifyContent: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Typography style={[styles.messageTitle, { fontSize: 14 }]} numberOfLines={2}>{selectedDim.title}</Typography>
                        <TouchableOpacity style={{ padding: 4 }}>
                          <Info size={14} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.statusMiniBadge, { backgroundColor: `${color}15`, alignSelf: 'flex-start', marginBottom: 4 }]}>
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
                        {selectedDim.id === 'food_adjustments' ? (
                           reading.nutrientPriorities && reading.nutrientPriorities.length > 0 ? (
                             reading.nutrientPriorities.map((n, i) => (
                               <View key={n.id || i} style={{ marginBottom: 10 }}>
                                 <Typography style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '500' }}>
                                   • {n.actionType === 'reduce' ? 'Limitar' : 'Favorecer'}: {n.label}
                                 </Typography>
                                 <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1, lineHeight: 16 }}>
                                   {n.reason}
                                 </Typography>
                                 {n.exampleFoods && n.exampleFoods.length > 0 && (
                                   <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>
                                     Ex: {n.exampleFoods.join(', ')}
                                   </Typography>
                                 )}
                               </View>
                             ))
                           ) : (
                             <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                               Ainda não há dados suficientes para gerar ajustes alimentares personalizados.
                             </Typography>
                           )
                        ) : (
                          selectedDim.recommendations?.length > 0 ? selectedDim.recommendations.map((r, i) => (
                            <View key={i} style={{ marginBottom: 10 }}>
                              <Typography style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '500' }}>• {r.text}</Typography>
                              <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 16 }}>{r.reason}</Typography>
                            </View>
                          )) : <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Sem ações específicas. Manter consistência.</Typography>
                        )}
                      </View>
                    )}
                    {activeTab === 'references' && (
                      <View>
                        {selectedDim.references?.length > 0 ? selectedDim.references.map((r, i) => (
                          <View key={i} style={{ marginBottom: 10 }}>
                            <Typography style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '500' }}>{r.factor} {r.observedValue ? `(${r.observedValue})` : ''}</Typography>
                            <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 16 }}>{r.whyItMatters}</Typography>
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
  
  messageAreaCard: { padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  messageTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  messageText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18, fontWeight: '400' },
  statusMiniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusMiniText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  tabsContainer: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  tabBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  tabContentArea: { paddingVertical: 4 },

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
