import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Container, Typography, BlurView } from '../components/Base';
import { theme } from '../theme';
import { useStore } from '../store/useStore';
import { selectAiConfidence, selectDailySynthesis, selectContextualResults, selectDataFreshness } from '../store/selectors';
import { getSemanticService } from '../services/semantic-output';
import { resolveNutritionActions, resolveMotionActions, resolveSleepActions } from '../services/ecosystem/actionInterpreter';
import { Activity, Zap, Target, Heart, Moon, Brain, ChevronDown, ChevronUp, Info, AlertCircle, CheckCircle2, FlaskConical, X, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * @file AIReadingScreen.tsx
 * @description Superfície interpretativa da Shell (Leitura AI).
 * Reconstrói a visão semântica baseada em factos, histórico e contexto.
 */

const DimensionItem = ({ label, score, icon: Icon, color }: { label: string, score: number, icon: any, color: string }) => (
  <View style={styles.dimensionCard}>
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
);

const ActionItem = ({ action }: { action: any }) => (
  <View style={styles.actionItem}>
    <View style={styles.actionHeader}>
      <Zap size={14} color={action.priority === 'critical' ? '#FF3366' : '#00F2FF'} style={{ marginRight: 8 }} />
      <Typography style={styles.actionType}>{action.action_type.replace('_', ' ').toUpperCase()}</Typography>
      <View style={[styles.priorityBadge, { backgroundColor: action.priority === 'critical' ? 'rgba(255,51,102,0.1)' : 'rgba(255,255,255,0.05)' }]}>
        <Typography style={[styles.priorityText, { color: action.priority === 'critical' ? '#FF3366' : 'rgba(255,255,255,0.4)' }]}>
          {action.priority.toUpperCase()}
        </Typography>
      </View>
    </View>
    <Typography style={styles.actionReason}>{action.reason}</Typography>
  </View>
);

export const AIReadingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const store = useStore();
  const [expandedRefs, setExpandedRefs] = useState(false);
  
  const { authAccount, isGuestMode, user, isDemoMode } = store;
  const userName = user?.name || (isGuestMode ? 'Guest' : (authAccount?.email?.split('@')[0] || 'Utilizador'));
  const BUILD_MARKER = 'AI READING V2 LIVE MARKER: a945b35';

  const aiConfidence = selectAiConfidence(store);
  const dailySynthesis = selectDailySynthesis(store);
  const contextualResults = selectContextualResults(store);
  const dataFreshness = selectDataFreshness(store);
  const semanticBundle = getSemanticService().getBundle();
  
  // Interpreted Actions (Derived locally for UI)
  const interpretedActions = useMemo(() => {
    const nutri = resolveNutritionActions(store as any).actions;
    const motion = resolveMotionActions(store as any).actions;
    const sleep = resolveSleepActions(store as any).actions;
    return [...nutri, ...motion, ...sleep].sort((a, b) => {
        const pMap = { critical: 3, high: 2, medium: 1, low: 0 };
        return pMap[b.priority as keyof typeof pMap] - pMap[a.priority as keyof typeof pMap];
    });
  }, [store.analyses, store.longitudinalMemory]);

  const toggleRefs = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRefs(!expandedRefs);
  };

  const families = useMemo(() => {
    const lastAnalysis = store.analyses[0];
    return [
      { id: 'urina', label: 'Urina', active: lastAnalysis?.measurements.some(m => m.type === 'urinalysis') },
      { id: 'fezes', label: 'Fezes', active: lastAnalysis?.measurements.some(m => m.type === 'fecal') },
      { id: 'fisio', label: 'Fisiológicos', active: lastAnalysis?.measurements.some(m => ['ecg', 'ppg', 'temp', 'weight'].includes(m.type)) },
      { id: 'ctx', label: 'Contextuais', active: contextualResults.length > 0 },
    ];
  }, [store.analyses, contextualResults]);

  const domains = semanticBundle.domains || {};

  return (
    <Container safe style={styles.container}>
      <View style={styles.atmosphere}>
        <View style={[styles.aura, { backgroundColor: aiConfidence.color + '15' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Typography variant="h1" style={styles.title}>Leitura AI</Typography>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: aiConfidence.color }]} />
                <Typography style={styles.statusLabel}>{aiConfidence.label}</Typography>
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

        {/* BLOCK 1: Synthesis */}
        <BlurView intensity={20} tint="dark" style={styles.synthesisCard}>
          <Typography variant="h2" style={styles.synthesisTitle}>{dailySynthesis.title}</Typography>
          <Typography style={styles.synthesisText}>
            {semanticBundle.crossDomainSummary?.summary || 'A analisar base biográfica...'}
          </Typography>
          {dailySynthesis.positiveHighlight && (
             <View style={styles.highlightRow}>
                <CheckCircle2 size={14} color="#00FF9D" />
                <Typography style={styles.highlightText}>{dailySynthesis.positiveHighlight}</Typography>
             </View>
          )}
        </BlurView>

        {/* CONTEXTUAL CTA */}
        <TouchableOpacity 
          style={styles.contextualCTA} 
          onPress={() => (navigation as any).navigate('Dados')}
        >
          <BlurView intensity={20} style={styles.ctaBlur}>
            <FlaskConical size={16} color="#00F2FF" />
            <Typography style={styles.ctaText}>VER DADOS FACTUAIS (RESULTADOS)</Typography>
            <ChevronRight size={14} color="#00F2FF" />
          </BlurView>
        </TouchableOpacity>

        {/* BLOCK 2: Families Considered */}
        <View style={styles.sectionHeader}>
          <Typography style={styles.sectionTitle}>BASE FACTUAL CONSIDERADA</Typography>
        </View>
        <View style={styles.familiesRow}>
          {families.map(f => (
            <View key={f.id} style={[styles.familyChip, f.active ? styles.familyChipActive : null]}>
              <Typography style={[styles.familyText, f.active ? styles.familyTextActive : null]}>
                {f.label}
              </Typography>
              {f.active && <View style={[styles.activeDot, { backgroundColor: f.id === 'ctx' ? '#A020F0' : '#00F2FF' }]} />}
            </View>
          ))}
        </View>

        {/* BLOCK 3: Dimensions */}
        <View style={styles.sectionHeader}>
          <Typography style={styles.sectionTitle}>DIMENSÕES INTERPRETATIVAS</Typography>
        </View>
        <View style={styles.dimensionsGrid}>
          <DimensionItem 
            label="Performance" 
            score={domains.performance?.score || 0} 
            icon={Target} 
            color="#00F2FF" 
          />
          <DimensionItem 
            label="Energia" 
            score={domains.energy?.score || 0} 
            icon={Zap} 
            color="#FFD700" 
          />
          <DimensionItem 
            label="Recuperação" 
            score={domains.recovery?.score || 0} 
            icon={Moon} 
            color="#A020F0" 
          />
          <DimensionItem 
            label="Equilíbrio" 
            score={domains.nutrition?.score || 0} 
            icon={Heart} 
            color="#00FF9D" 
          />
        </View>

        {/* BLOCK 4: Actions */}
        <View style={styles.sectionHeader}>
          <Typography style={styles.sectionTitle}>AÇÕES & AJUSTES ÚTEIS</Typography>
        </View>
        {interpretedActions.length > 0 ? (
          <View style={styles.actionsList}>
            {interpretedActions.map((action, i) => (
              <ActionItem key={i} action={action} />
            ))}
          </View>
        ) : (
          <Typography style={styles.emptyText}>Sem ações críticas sugeridas no momento.</Typography>
        )}

        {/* BLOCK 5: References */}
        <TouchableOpacity 
          style={styles.refsHeader} 
          onPress={toggleRefs}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FlaskConical size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
            <Typography style={styles.refsTitle}>REFERÊNCIAS & FUNDAMENTAÇÃO</Typography>
          </View>
          {expandedRefs ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
        </TouchableOpacity>

        {expandedRefs && (
          <View style={styles.refsContent}>
            <Typography style={styles.refsSubtitle}>RATIONALE DA LEITURA</Typography>
            <Typography style={styles.refsText}>
              {aiConfidence.rationale}
            </Typography>
            
            <View style={styles.refFactorBox}>
              <Typography style={styles.refFactorTitle}>SINAIS POSITIVOS</Typography>
              {aiConfidence.factors.positive.map((f, i) => (
                <Typography key={i} style={styles.refFactorItem}>• {f}</Typography>
              ))}
              {aiConfidence.factors.positive.length === 0 && <Typography style={styles.refFactorItem}>Nenhum sinal positivo consolidado.</Typography>}
            </View>

            <View style={styles.refFactorBox}>
              <Typography style={styles.refFactorTitle}>LIMITAÇÕES / GAP</Typography>
              {aiConfidence.factors.negative.map((f, i) => (
                <Typography key={i} style={styles.refFactorItem}>• {f}</Typography>
              ))}
            </View>

            <View style={styles.disclaimer}>
              <Typography style={styles.disclaimerText}>
                Esta leitura é interpretativa e baseada em biometrias cruzadas. Não substitui aconselhamento clínico ou diagnóstico médico profissional.
              </Typography>
            </View>
          </View>
        )}

        <View style={{ marginTop: 40, alignItems: 'center', opacity: 0.4 }}>
          <Typography variant="caption" style={styles.markerText}>
            {isDemoMode ? 'MODO DEMO ATIVO • ' : ''}AI READING V2.2 • {dataFreshness.temporalLabel.toUpperCase()}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  synthesisCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
    padding: 10,
    borderRadius: 12,
  },
  highlightText: {
    color: '#00FF9D',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
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
  familiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  familyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyChipActive: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  familyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontWeight: '600',
  },
  familyTextActive: {
    color: '#ffffff',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00F2FF',
    marginLeft: 6,
  },
  dimensionsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  dimensionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  actionsList: {
    gap: 12,
    marginBottom: 32,
  },
  actionItem: {
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
  },
  actionType: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '900',
  },
  actionReason: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 13,
  },
  refsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 16,
  },
  refsTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  refsContent: {
    paddingBottom: 40,
  },
  refsSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  refsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  refFactorBox: {
    marginBottom: 16,
  },
  refFactorTitle: {
    color: '#00F2FF',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  refFactorItem: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  disclaimerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  contextualCTA: {
    marginTop: -16,
    marginBottom: 32,
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
  markerText: {
    color: 'rgba(0, 242, 255, 0.5)',
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
});
