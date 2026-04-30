import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, TouchableOpacity, LayoutAnimation, Modal } from 'react-native';
import { Container, Typography, BlurView } from '../components/Base';
import { useStore } from '../store/useStore';
import { selectDailySynthesis, selectContextualResults, selectDataFreshness } from '../store/selectors';
import { computeAIReadingFromData, AIReading } from '../services/semantic-output/ai-reading-engine';
import { normalizeAIReadingResponse } from '../services/semantic-output/ai-reading-adapter';
import { generateInsights, cancelPendingInsights } from '../services/ai-gateway/client';
import Svg, { Circle } from 'react-native-svg';
import { 
  Activity, Zap, Target, Heart, Moon, FlaskConical, X, 
  ShieldAlert, Info, CheckCircle2, Eye, ChevronRight
} from 'lucide-react-native';

const ENABLE_OPENAI_READING = (
  typeof process !== 'undefined' &&
  (process.env as any)?.EXPO_PUBLIC_ENABLE_OPENAI_READING === 'true'
);

type ReadingSource = 'local' | 'openai' | 'fallback';

const DimensionGridCard = ({ id, label, score, icon: Icon, color, isSelected, onPress }: any) => {
  const radius = 22;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <TouchableOpacity 
      style={[
        styles.gridCard, 
        isSelected && styles.gridCardSelected,
        isSelected && { borderColor: color }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.gridCardContent}>
        <View style={styles.ringContainer}>
          <Svg width={54} height={54} style={{ transform: [{ rotate: '90deg' }] }}>
            <Circle cx={27} cy={27} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="transparent" />
            <Circle cx={27} cy={27} r={radius} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" />
          </Svg>
          <View style={styles.ringInnerContent}>
            <Icon size={14} color={color} />
            <Typography style={styles.gridScore}>{score}</Typography>
          </View>
        </View>
        <Typography style={styles.gridLabel} numberOfLines={2}>{label}</Typography>
      </View>
    </TouchableOpacity>
  );
};

export const AIReadingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const store = useStore();
  
  const { isDemoMode, analyses } = store;
  const lastAnalysis = analyses[0];
  
  const localReading: AIReading = useMemo(() => {
    return computeAIReadingFromData(
      lastAnalysis?.measurements || [],
      lastAnalysis?.ecosystemFacts || [],
      isDemoMode
    );
  }, [lastAnalysis, isDemoMode]);

  const [aiReading, setAiReading] = useState<AIReading | null>(null);
  const [readingSource, setReadingSource] = useState<ReadingSource>('local');
  const [isRefining, setIsRefining] = useState(false);

  const [selectedDimId, setSelectedDimId] = useState<string | null>(null);
  const [showFundamentacao, setShowFundamentacao] = useState(false);
  const [showRecomendacoes, setShowRecomendacoes] = useState(false);
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);

  const analysisKey = lastAnalysis?.id ?? 'none';

  useEffect(() => {
    setAiReading(null);
    setReadingSource('local');
    setIsRefining(false);
    if (!ENABLE_OPENAI_READING || !lastAnalysis) return;

    cancelPendingInsights();
    let cancelled = false;
    setIsRefining(true);

    generateInsights(lastAnalysis).then((response) => {
      if (cancelled) return;
      if (response?.ok) {
        try {
          const normalized = normalizeAIReadingResponse(response.insight);
          normalized.summary.mode = isDemoMode ? 'simulation' : 'real';
          setAiReading(normalized);
          setReadingSource('openai');
        } catch (normErr) { setReadingSource('fallback'); }
      } else { setReadingSource('fallback'); }
      setIsRefining(false);
    }).catch(() => {
      if (cancelled) return;
      setReadingSource('fallback');
      setIsRefining(false);
    });

    return () => { cancelled = true; cancelPendingInsights(); };
  }, [analysisKey, isDemoMode]);

  const reading: AIReading = aiReading ?? localReading;

  const normalizedDimensions = useMemo(() => {
    const baseIds = ['energy', 'recovery', 'hydration', 'digestion', 'vitals', 'nutrition', 'stress', 'watch'];
    const baseLabels: Record<string, string> = {
      energy: 'Energia & Disp.',
      recovery: 'Recuperação',
      hydration: 'Hidratação',
      digestion: 'Intestinal',
      vitals: 'Sinais Vitais',
      nutrition: 'Nutrição',
      stress: 'Stress & Foco',
      watch: 'A Acompanhar'
    };

    const fallbacks: Record<string, { explanation: string, action: string, signals: string[] }> = {
      energy: {
        explanation: "Esta dimensão cruza sinais fisiológicos recentes, sono registado e recuperação percebida para estimar a disponibilidade geral do organismo. Nesta leitura, a energia parece depender sobretudo da qualidade do repouso e da carga acumulada, mais do que de um único marcador isolado.",
        action: "Evitar carga excessiva",
        signals: ["sono", "recuperação", "frequência cardíaca", "HRV/PPG se existir", "stress/contexto"]
      },
      recovery: {
        explanation: "Esta dimensão observa se o corpo parece estar a recuperar bem face à carga recente. Sono, frequência cardíaca, variabilidade/PPG e contexto de stress ajudam a perceber se é melhor manter intensidade controlada ou se há margem para maior exigência.",
        action: "Priorizar descanso",
        signals: ["sono", "PPG/HRV", "carga fisiológica", "stress/contexto"]
      },
      hydration: {
        explanation: "Esta dimensão usa sobretudo sinais urinários, como densidade/gravidade específica, pH, eletrólitos e concentração da amostra, para contextualizar hidratação e equilíbrio urinário. Uma leitura isolada deve ser confirmada por repetição e pelo contexto de ingestão de líquidos.",
        action: "Distribuir ingestão de água",
        signals: ["densidade urinária", "pH urinário", "sódio", "potássio", "rácio Na/K", "creatinina urinária"]
      },
      digestion: {
        explanation: "Esta dimensão resume a caracterização óptica das fezes, incluindo Bristol, consistência, forma e confiança da avaliação por imagem. O objetivo é observar padrões aparentes ao longo do tempo, não diagnosticar alterações intestinais.",
        action: "Observar padrão nas próximas leituras",
        signals: ["Bristol", "Caracterização Óptica", "consistência", "forma", "confiança da imagem"]
      },
      vitals: {
        explanation: "Esta dimensão integra sinais fisiológicos como frequência cardíaca, saturação de oxigénio, temperatura, ECG/PPG quando disponíveis e variações recentes. Serve para perceber se os sinais vitais parecem estáveis no contexto da leitura, sem fazer interpretação clínica isolada.",
        action: "Acompanhar estabilidade",
        signals: ["frequência cardíaca", "saturação de oxigénio", "temperatura", "ECG", "PPG"]
      },
      nutrition: {
        explanation: "Esta dimensão procura transformar sinais disponíveis em pistas nutricionais prudentes, cruzando urinálise, hidratação, eletrólitos, glicose, caracterização fecal e contexto registado. Quando os dados ainda são limitados, deve funcionar como orientação leve para observar padrões, não como plano alimentar.",
        action: "Relacionar sinais com hábitos alimentares",
        signals: ["glicose urinária", "eletrólitos", "densidade urinária", "caracterização fecal", "contexto alimentar"]
      },
      stress: {
        explanation: "Esta dimensão combina sinais de recuperação, sono, carga fisiológica e marcadores indiretos de tensão para estimar se o organismo parece mais preparado para foco ou se beneficia de autorregulação. A leitura deve ser vista como apoio comportamental, não como avaliação psicológica.",
        action: "Criar uma pausa de recuperação",
        signals: ["sono", "recuperação", "PPG/HRV", "stress registado", "carga recente"]
      },
      watch: {
        explanation: "Esta dimensão identifica sinais que ainda não permitem conclusão robusta, mas que merecem repetição, comparação temporal ou contexto adicional. O objetivo é separar o que já parece consistente daquilo que ainda precisa de histórico.",
        action: "Repetir e comparar tendência",
        signals: ["sinais sem histórico suficiente", "marcadores experimentais", "alterações isoladas", "dados contextuais em falta"]
      }
    };

    return baseIds.map(id => {
      const existing = reading.dimensions.find(d => d.id === id);
      const fb = fallbacks[id];

      const isWeak = !existing || 
                     !existing.explanation || 
                     existing.explanation.length < 80 || 
                     existing.explanation.includes('Dados base insuficientes') ||
                     existing.explanation.includes('Estabilidade cardiovascular.') ||
                     existing.explanation.includes('Capacidade de resposta a estímulos.') ||
                     existing.explanation.includes('Estado de hidratação celular.');
      
      const explanation = isWeak ? fb.explanation : existing.explanation;
      const score = existing ? existing.score : 50;

      return {
        ...existing,
        id,
        label: baseLabels[id] || (existing?.label ?? id),
        score,
        explanation,
        fallbackAction: fb.action,
        fallbackSignals: fb.signals
      };
    });
  }, [reading]);

  const getDimensionIcon = (id: string) => {
    switch(id) {
      case 'energy': return Zap;
      case 'recovery': return Moon;
      case 'hydration': return Activity;
      case 'digestion': return Target;
      case 'vitals': return Heart;
      case 'nutrition': return FlaskConical;
      case 'stress': return ShieldAlert;
      case 'watch': return Eye;
      default: return Info;
    }
  };

  const getDimensionColor = (id: string) => {
    switch(id) {
      case 'energy': return '#FFD700';
      case 'recovery': return '#A020F0';
      case 'hydration': return '#37ECFD';
      case 'digestion': return '#FF9500';
      case 'vitals': return '#00FF9D';
      case 'nutrition': return '#FF3366';
      case 'stress': return '#FF6060';
      case 'watch': return '#B0C4DE';
      default: return '#fff';
    }
  };

  const selectedDim = selectedDimId ? normalizedDimensions.find(d => d.id === selectedDimId) : null;
  const selectedTheme = selectedDim ? (reading.highlightedThemes.find(t => t.id === selectedDim.id || t.title.toLowerCase().includes(selectedDim.label.toLowerCase())) || { status: selectedDim.score >= 70 ? 'optimal' : selectedDim.score >= 40 ? 'stable' : 'caution', action: selectedDim.fallbackAction }) : null;

  return (
    <Container safe style={styles.container}>
      <View style={styles.atmosphere}>
        <View style={[styles.aura, { backgroundColor: normalizedDimensions[0]?.score > 70 ? '#00FF9D20' : '#FFD70015' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Typography variant="h1" style={styles.title}>Leitura AI</Typography>
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
                <Info size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ÁREA DE TEXTO / MENSAGEM */}
        {(() => {
          if (!selectedDim) {
             return (
               <BlurView intensity={20} tint="dark" style={styles.messageAreaCard}>
                 <Typography style={styles.sectionTitle}>SÍNTESE DO MOMENTO</Typography>
                 <Typography variant="h2" style={styles.messageTitle}>{reading.summary.title}</Typography>
                 <Typography style={styles.messageText}>{reading.summary.text}</Typography>
               </BlurView>
             );
          }
          
          const color = getDimensionColor(selectedDim.id);
          const statusLabel = selectedTheme?.status === 'optimal' ? 'ÓPTIMO' : selectedTheme?.status === 'stable' ? 'ESTÁVEL' : 'CAUTELA';
          
          return (
             <BlurView intensity={20} tint="dark" style={[styles.messageAreaCard, { borderColor: `${color}40` }]}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Typography style={[styles.sectionTitle, { color, marginBottom: 0 }]}>{selectedDim.label.toUpperCase()}</Typography>
                    <View style={[styles.statusMiniBadge, { backgroundColor: `${color}15` }]}>
                      <Typography style={[styles.statusMiniText, { color }]}>{statusLabel}</Typography>
                    </View>
                 </View>
                 <Typography style={styles.messageText}>{selectedDim.explanation}</Typography>
                 {selectedTheme?.action && (
                    <Typography style={[styles.messageText, { color: '#FFF', fontWeight: 'bold', marginTop: 12 }]}>
                      💡 {selectedTheme.action}
                    </Typography>
                 )}
                 <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowFundamentacao(true)}>
                      <Typography style={styles.actionBtnText}>Fundamentação</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowRecomendacoes(true)}>
                      <Typography style={styles.actionBtnText}>Recomendações</Typography>
                    </TouchableOpacity>
                 </View>
             </BlurView>
          );
        })()}

        {/* GRELHA 2x4 DE DIMENSÕES */}
        <View style={styles.gridContainer}>
          {normalizedDimensions.map(d => (
            <DimensionGridCard 
              key={d.id}
              id={d.id}
              label={d.label}
              score={d.score}
              icon={getDimensionIcon(d.id)}
              color={getDimensionColor(d.id)}
              isSelected={selectedDimId === d.id}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedDimId(prev => prev === d.id ? null : d.id);
              }}
            />
          ))}
        </View>

      </ScrollView>

      {/* POPUP: FUNDAMENTAÇÃO */}
      <Modal visible={showFundamentacao} transparent animationType="fade">
         <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowFundamentacao(false)} activeOpacity={1}/>
            <View style={styles.modalCentered}>
              <View style={styles.modalContent}>
                <Typography variant="h3" style={{ color: selectedDim ? getDimensionColor(selectedDim.id) : '#FFF', marginBottom: 8 }}>Fundamentação</Typography>
                <Typography style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>{selectedDim?.label}</Typography>
                
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                   <View style={styles.refItemBox}>
                      <Typography variant="caption" style={styles.refLabel}>CONFIANÇA & FRESCURA</Typography>
                      <Typography style={styles.refValue}>Confiança: {reading.references.confidence === 'high' ? 'Alta' : 'Moderada/Baixa'}</Typography>
                      <Typography style={styles.refValue}>Frescura: {reading.references.freshness === 'recent' ? 'Recente' : 'Requer atualização'}</Typography>
                   </View>

                   <View style={styles.refItemBox}>
                      <Typography variant="caption" style={styles.refLabel}>SINAIS CONSIDERADOS</Typography>
                      <View style={styles.signalsRow}>
                        {(reading.references.themeDataLinks?.[selectedDim?.id || ''] || selectedDim?.fallbackSignals || reading.references.usedSignals).map((s: string, i: number) => (
                          <View key={i} style={styles.signalChip}><Typography style={styles.signalChipText}>{s}</Typography></View>
                        ))}
                      </View>
                   </View>

                   <View style={styles.refItemBox}>
                      <Typography variant="caption" style={styles.refLabel}>COMO ESTES DADOS SUSTENTAM A CONCLUSÃO</Typography>
                      <Typography style={styles.refValue}>{selectedDim?.explanation}</Typography>
                   </View>

                   {reading.references.limitations && reading.references.limitations.length > 0 && (
                     <View style={[styles.refItemBox, { marginBottom: 0 }]}>
                        <Typography variant="caption" style={styles.refLabel}>LIMITAÇÕES (NOTA PRUDENTE)</Typography>
                        {reading.references.limitations.slice(0, 2).map((l, i) => (
                          <Typography key={i} style={{ color: '#F59E0B', fontSize: 13, marginBottom: 4 }}>• {l}</Typography>
                        ))}
                     </View>
                   )}
                </ScrollView>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFundamentacao(false)}>
                   <Typography style={styles.closeBtnText}>FECHAR</Typography>
                </TouchableOpacity>
              </View>
            </View>
         </BlurView>
      </Modal>

      {/* POPUP: RECOMENDAÇÕES */}
      <Modal visible={showRecomendacoes} transparent animationType="fade">
         <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowRecomendacoes(false)} activeOpacity={1}/>
            <View style={styles.modalCentered}>
              <View style={styles.modalContent}>
                <Typography variant="h3" style={{ color: selectedDim ? getDimensionColor(selectedDim.id) : '#FFF', marginBottom: 8 }}>Recomendações</Typography>
                <Typography style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>{selectedDim?.label}</Typography>
                
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                   {(() => {
                      const relevantActions = reading.priorityActions.filter(a => a.domain === selectedDim?.id);
                      if (relevantActions.length === 0) {
                         return (
                            <View style={styles.actionCard}>
                               <Typography style={styles.actionTitle}>Sugestão geral</Typography>
                               <Typography style={styles.actionReason}>{selectedTheme?.action || selectedDim?.fallbackAction || 'Sem ações específicas isoladas nesta dimensão. Siga a rotina sugerida globalmente.'}</Typography>
                            </View>
                         );
                      }
                      return relevantActions.map((action, i) => (
                         <View key={i} style={styles.actionCard}>
                            <View style={styles.actionHeader}>
                               <View style={[styles.priorityTag, { backgroundColor: action.priority === 'high' ? 'rgba(255, 51, 102, 0.1)' : 'rgba(255,255,255,0.05)' }]}>
                                 <Typography style={[styles.priorityTagText, { color: action.priority === 'high' ? '#FF3366' : 'rgba(255,255,255,0.4)' }]}>
                                   {action.priority.toUpperCase()}
                                 </Typography>
                               </View>
                               <Typography style={styles.actionTitle}>{action.title}</Typography>
                            </View>
                            <Typography style={styles.actionReason}>{action.reason}</Typography>
                         </View>
                      ));
                   })()}
                </ScrollView>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowRecomendacoes(false)}>
                   <Typography style={styles.closeBtnText}>FECHAR</Typography>
                </TouchableOpacity>
              </View>
            </View>
         </BlurView>
      </Modal>

      {/* POPUP: GLOBAL INFO */}
      <Modal visible={showGlobalInfo} transparent animationType="fade">
         <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowGlobalInfo(false)} activeOpacity={1}/>
            <View style={styles.modalCentered}>
              <View style={styles.modalContent}>
                <Typography variant="h3" style={{ color: '#00F2FF', marginBottom: 8 }}>Sobre a Leitura AI</Typography>
                <Typography style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Fundamentos e transparência</Typography>
                
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                   <View style={styles.refGrid}>
                      <View style={styles.refItem}>
                        <Typography variant="caption" style={styles.refLabel}>ORIGEM</Typography>
                        <Typography style={styles.refValue}>{reading.references.origins.join(' / ')}</Typography>
                      </View>
                      <View style={styles.refItem}>
                        <Typography variant="caption" style={styles.refLabel}>MOTOR</Typography>
                        <Typography style={styles.refValue}>{readingSource === 'openai' ? 'Assistido por IA' : readingSource === 'fallback' ? 'Fallback local' : 'Motor local'}</Typography>
                      </View>
                   </View>

                   <View style={styles.refItemBox}>
                      <Typography variant="caption" style={styles.refLabel}>FAMÍLIAS USADAS</Typography>
                      <Typography style={styles.refValue}>{reading.references.usedDataFamilies.join(', ') || '—'}</Typography>
                   </View>

                   <View style={styles.refItemBox}>
                      <Typography variant="caption" style={styles.refLabel}>LIMITAÇÕES DA LEITURA</Typography>
                      {reading.readingLimits.map((l, i) => (
                        <Typography key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>• {l}</Typography>
                      ))}
                   </View>
                </ScrollView>
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  header: { marginBottom: 20 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  demoBadge: { borderColor: '#00F2FF', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, justifyContent: 'center' },
  demoLabel: { color: '#00F2FF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  messageAreaCard: { padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)', minHeight: 180 },
  sectionTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  messageTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  messageText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  statusMiniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusMiniText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, alignItems: 'center' },
  gridCardSelected: { backgroundColor: 'rgba(255,255,255,0.04)' },
  gridCardContent: { alignItems: 'center' },
  ringContainer: { position: 'relative', width: 54, height: 54, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  ringInnerContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, right: 0, bottom: 0 },
  gridScore: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 2 },
  gridLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },

  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  modalCentered: { flex: 1, justifyContent: 'center' },
  modalContent: { backgroundColor: '#0A0D12', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  refItemBox: { marginBottom: 20 },
  refLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  refValue: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  signalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  signalChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  signalChipText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  closeBtn: { marginTop: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  
  actionCard: { padding: 16, borderRadius: 16, backgroundColor: 'rgba(0, 242, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.1)', marginBottom: 12 },
  actionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  priorityTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityTagText: { fontSize: 8, fontWeight: '900' },
  actionTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700', flex: 1 },
  actionReason: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18 },
  refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  refItem: { width: '45%' },
});
