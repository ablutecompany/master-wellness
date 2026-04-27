import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Container, Typography, BlurView } from '../components/Base';
import { useStore } from '../store/useStore';
import { selectDailySynthesis, selectContextualResults, selectDataFreshness } from '../store/selectors';
import { computeAIReadingFromData, AIReading } from '../services/semantic-output/ai-reading-engine';
import { 
  Activity, 
  Zap, 
  Target, 
  Heart, 
  Moon, 
  ChevronDown, 
  ChevronUp, 
  FlaskConical, 
  X, 
  ShieldAlert, 
  Clock, 
  Info, 
  CheckCircle2, 
  Search,
  Eye
} from 'lucide-react-native';

/**
 * @file AIReadingScreen.tsx
 * @description Superfície interpretativa da Shell (Leitura AI R1).
 * Implementa a nova estrutura UX: Síntese, Dimensões, Ações, Temas, Sinais e Referências.
 */

const DimensionCard = ({ label, score, icon: Icon, color, explanation }: { label: string, score: number, icon: any, color: string, explanation: string }) => (
  <View style={styles.dimensionCard}>
    <View style={styles.dimensionMain}>
      <View style={[styles.dimensionIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Typography style={styles.dimensionLabel}>{label}</Typography>
          <Typography style={[styles.dimensionScore, { color }]}>{score}</Typography>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
    <Typography variant="caption" style={styles.dimensionExplanation}>{explanation}</Typography>
  </View>
);

const ActionCard = ({ action }: { action: any }) => {
  const priorityMap: Record<string, string> = {
    high: 'ALTA',
    medium: 'MÉDIA',
    low: 'BAIXA'
  };

  const getDomainIcon = (domain: string) => {
    switch(domain) {
      case 'energy': return Zap;
      case 'recovery': return Moon;
      case 'hydration': return Activity;
      case 'gut': return Target;
      case 'vitals': return Heart;
      case 'nutrition': return FlaskConical;
      case 'stress': return ShieldAlert;
      default: return Info;
    }
  };

  const Icon = getDomainIcon(action.domain);
  
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={[styles.priorityTag, { backgroundColor: action.priority === 'high' ? 'rgba(255, 51, 102, 0.1)' : 'rgba(255,255,255,0.05)' }]}>
          <Typography style={[styles.priorityTagText, { color: action.priority === 'high' ? '#FF3366' : 'rgba(255,255,255,0.4)' }]}>
            {priorityMap[action.priority] || action.priority.toUpperCase()}
          </Typography>
        </View>
        <Icon size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />
        <Typography style={styles.actionTitle}>{action.title}</Typography>
      </View>
      <Typography style={styles.actionReason}>{action.reason}</Typography>
    </View>
  );
};

export const AIReadingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const store = useStore();
  const [expandedRefs, setExpandedRefs] = useState(false);
  
  const { isDemoMode, analyses } = store;
  const lastAnalysis = analyses[0];
  
  // R1: Computação local estruturada seguindo o novo contrato
  const reading: AIReading = useMemo(() => {
    return computeAIReadingFromData(
      lastAnalysis?.measurements || [],
      lastAnalysis?.ecosystemFacts || [],
      isDemoMode
    );
  }, [lastAnalysis, isDemoMode]);

  const toggleRefs = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRefs(!expandedRefs);
  };

  const getDimensionIcon = (id: string) => {
    switch(id) {
      case 'energy': return Zap;
      case 'recovery': return Moon;
      case 'hydration': return Activity;
      case 'digestion': return Target;
      case 'vitals': return Heart;
      default: return Info;
    }
  };

  const getDimensionColor = (id: string) => {
    switch(id) {
      case 'energy': return '#FFD700';
      case 'recovery': return '#A020F0';
      case 'hydration': return '#00F2FF';
      case 'digestion': return '#FF9500';
      case 'vitals': return '#00FF9D';
      default: return '#fff';
    }
  };

  return (
    <Container safe style={styles.container}>
      <View style={styles.atmosphere}>
        <View style={[styles.aura, { backgroundColor: reading.dimensions[0]?.score > 70 ? '#00FF9D20' : '#FFD70015' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Typography variant="h1" style={styles.title}>Leitura AI</Typography>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {isDemoMode && (
                  <View style={styles.demoBadge}>
                    <FlaskConical size={10} color="#00F2FF" style={{ marginRight: 4 }} />
                    <Typography style={styles.demoLabel}>SIMULAÇÃO</Typography>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.closeBtnCircle}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* BLOCK 1: Síntese do momento */}
        <View style={styles.sectionHeader}>
          <Typography style={styles.sectionTitle}>SÍNTESE DO MOMENTO</Typography>
        </View>
        <BlurView intensity={20} tint="dark" style={styles.synthesisCard}>
          <Typography variant="h2" style={styles.synthesisTitle}>{reading.summary.title}</Typography>
          <Typography style={styles.synthesisText}>{reading.summary.text}</Typography>
        </BlurView>

        {/* BLOCK 2: Dimensões interpretativas */}
        <View style={styles.sectionHeader}>
          <Typography style={styles.sectionTitle}>DIMENSÕES DA LEITURA</Typography>
        </View>
        <View style={styles.dimensionsGrid}>
          {reading.dimensions.map(d => (
            <DimensionCard 
              key={d.id}
              label={d.label}
              score={d.score}
              explanation={d.explanation}
              icon={getDimensionIcon(d.id)}
              color={getDimensionColor(d.id)}
            />
          ))}
        </View>

        {/* BLOCK 3: Ações recomendadas */}
        <View style={styles.sectionHeader}>
          <Typography style={styles.sectionTitle}>AÇÕES RECOMENDADAS</Typography>
        </View>
        <View style={styles.actionsList}>
          {reading.priorityActions.length > 0 ? (
            reading.priorityActions.map((action, i) => (
              <ActionCard key={i} action={action} />
            ))
          ) : (
            <Typography style={styles.emptyText}>Sem ações críticas sugeridas no momento.</Typography>
          )}
        </View>

        {/* BLOCK 4: Temas em destaque */}
        {reading.highlightedThemes.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Typography style={styles.sectionTitle}>TEMAS EM DESTAQUE</Typography>
            </View>
            {reading.highlightedThemes.map(theme => (
              <BlurView key={theme.id} intensity={10} tint="dark" style={styles.themeCard}>
                <View style={styles.themeHeaderRow}>
                  <Typography style={styles.themeTitle}>{theme.title}</Typography>
                  <View style={[styles.statusMiniBadge, { backgroundColor: theme.status === 'optimal' ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 149, 0, 0.1)' }]}>
                    <Typography style={[styles.statusMiniText, { color: theme.status === 'optimal' ? '#00FF9D' : '#FF9500' }]}>
                      {theme.status === 'optimal' ? 'ÓPTIMO' : 'CAUTELA'}
                    </Typography>
                  </View>
                </View>
                <Typography style={styles.themeText}>{theme.explanation}</Typography>
                
                {theme.limitation && (
                  <Typography variant="caption" style={styles.themeLimitation}>• {theme.limitation}</Typography>
                )}

                {theme.action && (
                  <View style={styles.themeActionRow}>
                    <CheckCircle2 size={12} color="#00FF9D" />
                    <Typography style={styles.themeActionText}>{theme.action}</Typography>
                  </View>
                )}
              </BlurView>
            ))}
          </>
        )}

        {/* BLOCK 5: Sinais a acompanhar */}
        {reading.watchSignals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Typography style={styles.sectionTitle}>SINAIS A ACOMPANHAR</Typography>
            </View>
            {reading.watchSignals.map((signal, i) => (
              <View key={i} style={styles.watchCard}>
                <View style={styles.watchHeader}>
                  <Eye size={14} color="#A020F0" style={{ marginRight: 8 }} />
                  <Typography style={styles.watchTitle}>{signal.title}</Typography>
                </View>
                <Typography style={styles.watchText}>{signal.explanation}</Typography>
                <Typography variant="caption" style={styles.watchReason}>{signal.reasonToRepeat}</Typography>
              </View>
            ))}
          </>
        )}

        {/* BLOCK 6: Referências & fundamentação */}
        <TouchableOpacity 
          style={styles.refsHeader} 
          onPress={toggleRefs}
          activeOpacity={0.7}
        >
          <View>
            <Typography style={styles.refsTitle}>REFERÊNCIAS & FUNDAMENTAÇÃO</Typography>
            <Typography variant="caption" style={styles.refsSubtitle}>Dados usados, frescura, confiança e limites.</Typography>
          </View>
          {expandedRefs ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
        </TouchableOpacity>

        {expandedRefs && (
          <View style={styles.refsContent}>
            <View style={styles.refGrid}>
              <View style={styles.refItem}>
                <Typography variant="caption" style={styles.refLabel}>FAMÍLIAS USADAS</Typography>
                <Typography style={styles.refValue}>{reading.references.usedDataFamilies.join(', ') || '—'}</Typography>
              </View>
              <View style={styles.refItem}>
                <Typography variant="caption" style={styles.refLabel}>FRESCURA</Typography>
                <Typography style={styles.refValue}>
                  {reading.references.freshness === 'recent' ? 'Recente' : 
                   reading.references.freshness === 'caution' ? 'Atenção' :
                   reading.references.freshness === 'stale' ? 'Desatualizada' : 'Indisponível'}
                </Typography>
              </View>
              <View style={styles.refItem}>
                <Typography variant="caption" style={styles.refLabel}>CONFIANÇA</Typography>
                <Typography style={styles.refValue}>
                  {reading.references.confidence === 'high' ? 'Alta' :
                   reading.references.confidence === 'medium' ? 'Média' : 'Baixa'}
                </Typography>
              </View>
              <View style={styles.refItem}>
                <Typography variant="caption" style={styles.refLabel}>ORIGEM</Typography>
                <Typography style={styles.refValue}>{reading.references.origins.join(' / ')}</Typography>
              </View>
            </View>

            <View style={styles.refFactorBox}>
              <Typography style={styles.refFactorTitle}>PRINCIPAIS SINAIS CONSIDERADOS</Typography>
              <View style={styles.signalsRow}>
                {reading.references.usedSignals.map((s, i) => (
                  <View key={i} style={styles.signalChip}>
                    <Typography style={styles.signalChipText}>{s}</Typography>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.refFactorBox}>
              <Typography style={styles.refFactorTitle}>LIMITAÇÕES</Typography>
              {reading.references.limitations.map((l, i) => (
                <Typography key={i} style={styles.refFactorItem}>• {l}</Typography>
              ))}
            </View>

            {reading.references.themeDataLinks && (
              <View style={styles.refFactorBox}>
                <Typography style={styles.refFactorTitle}>VINCULAÇÃO DADOS → TEMAS</Typography>
                {Object.entries(reading.references.themeDataLinks).map(([themeId, signals]) => {
                  const theme = reading.highlightedThemes.find(t => t.id === themeId);
                  if (!theme) return null;
                  return (
                    <View key={themeId} style={{ marginBottom: 8 }}>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>
                        {theme.title.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Suportado por: {signals.join(', ')}
                      </Typography>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* BLOCK 7: Limites da leitura */}
        <View style={styles.sectionHeader}>
          <Typography style={styles.sectionTitle}>LIMITES DA LEITURA</Typography>
        </View>
        <View style={styles.limitsBox}>
          {reading.readingLimits.map((limit, i) => (
            <Typography key={i} style={styles.limitText}>{limit}</Typography>
          ))}
        </View>

        <View style={{ marginTop: 40, alignItems: 'center', opacity: 0.3 }}>
          <Typography variant="caption" style={styles.markerText}>
            AI READING R2 • CONTRACT v1.1 • {isDemoMode ? 'SIMULAÇÃO' : 'REAL'}
          </Typography>
        </View>

      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05070A',
    flex: 1,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    top: -200,
    right: -200,
    opacity: 0.3,
    ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } : {}),
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#00F2FF',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  demoLabel: {
    color: '#00F2FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  synthesisCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  synthesisTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  synthesisText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dimensionsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  dimensionCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dimensionMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimensionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimensionLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  dimensionScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  dimensionExplanation: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 16,
  },
  actionsList: {
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 242, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.1)',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityTagText: {
    fontSize: 8,
    fontWeight: '900',
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  actionReason: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
  },
  themeCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  themeTitle: {
    color: '#00F2FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  themeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  themeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  themeActionText: {
    color: '#00FF9D',
    fontSize: 12,
    fontWeight: '600',
  },
  watchCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(160, 32, 240, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(160, 32, 240, 0.1)',
    marginBottom: 12,
  },
  watchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  watchTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  watchText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  watchReason: {
    color: '#A020F0',
    fontWeight: '600',
  },
  refsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 20,
  },
  refsTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  refsSubtitle: {
    color: 'rgba(255,255,255,0.2)',
    marginTop: 2,
  },
  refsContent: {
    paddingBottom: 24,
  },
  refGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  refItem: {
    width: '45%',
  },
  refLabel: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  refValue: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  refFactorBox: {
    marginBottom: 20,
  },
  refFactorTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  signalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  signalChipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  refFactorItem: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  limitsBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  limitText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 13,
  },
  markerText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  statusMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusMiniText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  themeLimitation: {
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});
