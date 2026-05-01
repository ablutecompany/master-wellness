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
  ShieldAlert, Info, Focus, Droplets
} from 'lucide-react-native';

const buildAnalysisValuesHash = (analysis: Analysis | null | undefined) => {
  if (!analysis) return 'none';
  const markers = analysis.measurements?.map((m: AnalysisMeasurement) => `${m.marker || m.type}=${typeof m.value === 'object' ? JSON.stringify(m.value) : m.value}`).sort().join('|') || '';
  return `${analysis.id}-${analysis.demoScenarioKey || 'real'}-${markers}`;
};

const ENABLE_OPENAI_READING = true;

const DIMENSION_INFO: Record<string, { title: string, description: string }> = {
  readiness_today: {
    title: 'Prontidão de hoje',
    description: 'Avalia se os sinais disponíveis apontam para energia, estabilidade e capacidade prática para o dia. Pode cruzar recuperação, sinais vitais, sono/contexto e equilíbrio geral. Serve para orientar intensidade, rotina e exigência diária.'
  },
  recovery_load: {
    title: 'Recuperação & carga',
    description: 'Avalia como o corpo parece estar a responder à carga recente. Pode considerar frequência cardíaca, temperatura, sinais de stress oxidativo, fadiga/contexto e recuperação. Serve para decidir se faz sentido manter, aliviar ou recuperar melhor.'
  },
  internal_balance: {
    title: 'Equilíbrio interno',
    description: 'Avalia sinais ligados a fluidos, minerais e eliminação. Pode considerar densidade urinária, sódio, potássio, rácio Na/K, pH e contexto intestinal. Serve para perceber se há sinais de concentração, desequilíbrio ou necessidade de ajustar hidratação/alimentação.'
  },
  metabolic_rhythm: {
    title: 'Ritmo metabólico',
    description: 'Avalia estabilidade energética e regularidade metabólica prática. Pode cruzar peso, impedância, glicose quando existir, rotina alimentar e sinais fisiológicos. Serve para perceber se o corpo parece estar a funcionar de forma estável ao longo do dia.'
  },
  digestive_comfort: {
    title: 'Conforto digestivo',
    description: 'Avalia sinais associados ao trânsito intestinal e conforto digestivo. Pode considerar Bristol, consistência, forma, secura, fragmentação e sinais visuais não clínicos. Serve para orientar fibra, água, rotina alimentar e observação de padrões.'
  },
  food_adjustments: {
    title: 'Ajustes alimentares',
    description: 'Transforma os sinais da leitura em focos alimentares práticos. Pode sugerir nutrientes ou grupos alimentares a favorecer, como fibra, potássio, água/alimentos ricos em água, proteína ou redução de sódio. Não indica deficiência médica.'
  },
  physiological_load: {
    title: 'Carga fisiológica',
    description: 'Avalia sinais de tensão ou exigência corporal no momento da leitura. Pode considerar frequência cardíaca, temperatura, saturação, ECG/PPG, impedância, peso/contexto corporal e desvios face ao padrão habitual. Serve para perceber se o corpo está calmo e estável ou se há sinais de maior exigência, fadiga ou stress fisiológico.'
  },
  routine_signals: {
    title: 'Sinais de rotina',
    description: 'Agrupa marcadores que ganham valor quando acompanhados ao longo do tempo. Pode incluir albumina/uACR, NGAL, KIM-1, cistatina C, nitritos, pH ou marcadores experimentais. Serve para observar repetição, tendência e necessidade de acompanhamento, sem tirar conclusões fortes de uma leitura isolada.'
  }
};

type ReadingSource = 'local' | 'openai' | 'fallback';

const DimensionGridCard = ({ dimension, isSelected, onPress, onInfoPress }: { dimension: HolisticDimension, isSelected: boolean, onPress: () => void, onInfoPress: () => void }) => {
  const getDimensionIcon = (id: string) => {
    switch(id) {
      case 'readiness_today': return Zap;
      case 'recovery_load': return Moon;
      case 'internal_balance': return Droplets;
      case 'metabolic_rhythm': return Heart;
      case 'digestive_comfort': return Target;
      case 'food_adjustments': return FlaskConical;
      case 'physiological_load': return Activity;
      case 'routine_signals': return ShieldAlert;
      case 'next_focus': return Focus;
      default: return Info;
    }
  };

  const Icon = getDimensionIcon(dimension.id);
  const color = dimension.color;
  const score = dimension.score !== null ? dimension.score : '--';
  const radius = 28;
  const strokeWidth = 6;
  const size = 60;
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
      <TouchableOpacity 
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 4 }} 
        onPress={(e) => { e.stopPropagation(); onInfoPress(); }}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Info size={16} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Icon size={22} color={color} style={{ marginRight: 8 }} />
            <Typography style={styles.gridLabel} numberOfLines={2}>{dimension.title}</Typography>
          </View>
          <View style={[styles.statusMiniBadge, { backgroundColor: `${color}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }]}>
            <Typography style={[styles.statusMiniText, { color, fontSize: 10, fontWeight: '700' }]}>{dimension.status.toUpperCase()}</Typography>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CTAGridCard = () => {
  return (
    <View style={[styles.gridCard, { justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' }]}>
      <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>Histórico</Typography>
    </View>
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
  const [infoModalContent, setInfoModalContent] = useState<{title: string, text: string} | null>(null);
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
      case 'internal_balance': return Droplets;
      case 'metabolic_rhythm': return Heart;
      case 'digestive_comfort': return Target;
      case 'food_adjustments': return FlaskConical;
      case 'physiological_load': return Activity;
      case 'routine_signals': return ShieldAlert;
      case 'next_focus': return Focus;
      default: return Info;
    }
  };

  const selectedDim = selectedDimId ? dimensions.find(d => d.id === selectedDimId) : null;
  const focusDim = reading.nextFocus ? dimensions.find(d => d.id === reading.nextFocus!.dimensionId) : null;
  const auraColor = focusDim && focusDim.color !== '#AAA' ? focusDim.color : '#00FF9D';

  return (
    <Container safe style={styles.container}>
      <View style={styles.atmosphere}>
        <View style={[styles.aura, { backgroundColor: `${auraColor}20` }]} />
      </View>
      <View style={{ flex: 1 }}>
        
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ÁREA DE TEXTO / MENSAGEM */}
        {(() => {
          if (!selectedDim) {
             return (
               <View>
                 <BlurView intensity={20} tint="dark" style={[styles.messageAreaCard, { height: 'auto', minHeight: 120, marginBottom: 12 }]}>
                   <Typography style={styles.sectionTitle}>SÍNTESE DO MOMENTO</Typography>
                   <Typography style={styles.messageTitle}>{reading.summary.title}</Typography>
                   <Typography style={styles.messageText}>{reading.summary.text}</Typography>
                 </BlurView>
                 
                 {reading.nextFocus && (() => {
                   const fDim = dimensions.find(d => d.id === reading.nextFocus!.dimensionId);
                   if (!fDim) return null;
                   const FIcon = getDimensionIcon(fDim.id);
                   const recAction = fDim.recommendations?.[0]?.text || 'Explorar detalhes para mais ações.';
                   return (
                     <TouchableOpacity 
                       onPress={() => setSelectedDimId(fDim.id)}
                       style={[styles.messageAreaCard, { padding: 16, flexDirection: 'row', alignItems: 'center', borderColor: `${fDim.color}40`, backgroundColor: 'rgba(255,255,255,0.02)' }]}
                       activeOpacity={0.7}
                     >
                       <View style={{ flex: 1, paddingRight: 16 }}>
                         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Focus size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                            <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' }}>Foco recomendado</Typography>
                         </View>
                         <Typography style={{ color: fDim.color, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>{fDim.title}</Typography>
                         <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8, lineHeight: 18 }}>É a dimensão com maior margem de melhoria nesta leitura.</Typography>
                         <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 }}>
                            <Typography style={{ color: fDim.color, fontWeight: '600' }}>Ação sugerida: </Typography>{recAction}
                         </Typography>
                       </View>
                       
                       {fDim.score !== null && (
                         <View style={{ alignItems: 'flex-start', paddingLeft: 16, paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)' }}>
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                             <FIcon size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                             <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Score atual</Typography>
                           </View>
                           <Typography style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 }}>{fDim.score}</Typography>
                           <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 }}>Estado</Typography>
                           <Typography style={{ color: fDim.color, fontSize: 10, fontWeight: '800' }}>{fDim.status.toUpperCase()}</Typography>
                         </View>
                       )}
                     </TouchableOpacity>
                   );
                 })()}
               </View>
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
                        <TouchableOpacity style={{ padding: 4 }} onPress={() => {
                          const infoKey = selectedDim.id === 'signal_oriented_nutrition' ? 'food_adjustments' : selectedDim.id;
                          const info = DIMENSION_INFO[infoKey];
                          setInfoModalContent({
                            title: info ? info.title : selectedDim.title,
                            text: info ? info.description : 'O índice holístico processa todos os marcadores interligados disponíveis para esta dimensão.'
                          });
                        }}>
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

        </ScrollView>

        {/* GRELHA DE DIMENSÕES */}
        <View style={styles.gridWrapper}>
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
                onInfoPress={() => {
                  const infoKey = d.id === 'signal_oriented_nutrition' ? 'food_adjustments' : d.id;
                  const info = DIMENSION_INFO[infoKey];
                  setInfoModalContent({
                    title: info ? info.title : d.title,
                    text: info ? info.description : 'O índice holístico processa todos os marcadores interligados disponíveis para esta dimensão.'
                  });
                }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* POPUP: GLOBAL INFO & DIMENSION INFO */}
      <Modal visible={showGlobalInfo || infoModalContent !== null} transparent animationType="fade">
         <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => { setShowGlobalInfo(false); setInfoModalContent(null); }} activeOpacity={1}/>
            <View style={styles.modalCentered}>
              <View style={styles.modalContent}>
                {infoModalContent ? (
                  <>
                    <Typography variant="h3" style={{ color: '#00F2FF', marginBottom: 8 }}>{infoModalContent.title}</Typography>
                    <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 }}>
                      {infoModalContent.text}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h3" style={{ color: '#00F2FF', marginBottom: 8 }}>Sobre a Leitura AI</Typography>
                    <Typography style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Fundamentos e transparência</Typography>
                    <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 }}>
                      Esta leitura usa um motor holístico para cruzar sinais reais. Nenhuma interpretação substitui aconselhamento clínico.
                    </Typography>
                  </>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowGlobalInfo(false); setInfoModalContent(null); }}>
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

  gridWrapper: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 8 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, minHeight: 108, justifyContent: 'center' },
  gridCardSelected: { backgroundColor: 'rgba(255,255,255,0.06)' },
  gridCardContent: { flexDirection: 'column', alignItems: 'flex-start', width: '100%', gap: 12 },
  ringContainer: { position: 'relative', width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  ringInnerContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, right: 0, bottom: 0 },
  gridRightContent: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  gridScore: { color: '#fff', fontSize: 18, fontWeight: '700' },
  gridLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600', lineHeight: 20 },

  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  modalCentered: { flex: 1, justifyContent: 'center' },
  modalContent: { backgroundColor: '#0A0D12', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  closeBtn: { marginTop: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
