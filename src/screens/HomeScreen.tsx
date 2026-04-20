import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, ScrollView, Platform, SafeAreaView, Modal, TextInput, Image, ActivityIndicator, FlatList, Pressable, Vibration, Alert } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeCard } from '../components/ThemeCard';
import { HistoricoModal } from '../components/HistoricoModal';
import { SynthesisActionCard, StateSurface } from '../components/ShellStateSurfaces';
import { Utensils, Zap, SlidersHorizontal, Activity, Database, Smartphone, X, User, Users, ChevronRight, ChevronDown, Menu, Battery, Heart, Scale, Droplets, Target, Settings, RefreshCw, Moon, Droplet, Brain, ChevronsDown, Sparkles, ArrowLeft, Calendar, History, Star, ChevronUp, Share, Dumbbell, Footprints } from 'lucide-react-native';
import Svg, { Path, Text as SvgText, TextPath, Defs, G } from 'react-native-svg';
import { BiomechanicRelic } from '../components/BiomechanicRelic';
import { SiderealBackground } from '../components/SiderealBackground';
import { GatingOverlay } from '../components/GatingOverlay';
// expo-linear-gradient and expo-blur: use require() guards to avoid web crash
// v2.1 - web inline mini-app launch fix

// Web-safe LinearGradient fallback
const LinearGradient = Platform.OS === 'web'
  ? ({ style, colors, ...props }: any) => (
    <View style={[style, { backgroundColor: colors?.[0] ?? 'rgba(0,0,0,0.8)' }]} {...props} />
  )
  : (() => { const { LinearGradient: LG } = require('expo-linear-gradient'); return LG; })();

// Web-safe BlurView fallback
const BlurView = Platform.OS === 'web'
  ? ({ style, ...props }: any) => (
    <View style={[style, { backgroundColor: 'rgba(0,0,0,0.6)' }]} {...props} />
  )
  : (() => { const { BlurView: BV } = require('expo-blur'); return BV; })();

import { MINI_APP_CATALOG } from '../miniapps/catalog';
import { MiniAppContainer } from '../miniapps/MiniAppContainer';
import { MiniAppManifest } from '../miniapps/types';
import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';
import { getSemanticInsights, getSemanticStatus, getAiStatus } from '../services/insights';
import { computeSemanticFromMeasurements } from '../services/semantic-output/analysis-engine';
import { AiInsight } from '../services/semantic-output/types';
import { useShallow } from 'zustand/react/shallow';
import { ENV } from '../config/env';
import { Analysis } from '../store/store';
import { aiInsightsService } from '../services/insights/ai-insights.service';
import { aiGatewayService } from '../services/ai-gateway/client';
import { semanticOutputService } from '../services/semantic-output';
import { MetricCard } from '../components/MetricCard';
import { getAllMetricsDefinitions, MetricObservation, MetricObservationStatus, MetricCategory } from '../data/metrics-catalog';

import { supabase } from '../services/supabase';


// --- SLOT MACHINE ODOMETER COMPONENT ---
const SlotMachineOdometer = ({ targetNumber }: { targetNumber: number }) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const H = 34; // Height of each single digit frame
  const NUM_POOL = 35; // Amount of numbers to scroll through

  useEffect(() => {
    // Reset to "0" instantly if it re-mounts or target changes
    scrollAnim.setValue(0);
    // Animate to the actual target over 2.5 seconds with a realistic ease-out
    Animated.timing(scrollAnim, {
      toValue: -H * targetNumber,
      duration: 2500,
      useNativeDriver: true,
    }).start();
  }, [targetNumber]);

  // Array of 0, 1, 2, ... NUM_POOL
  const numbers = Array.from({ length: NUM_POOL }, (_, i) => i);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>

      {/* Caleira interna completamente invisível & minimalista onde os números correm */}
      <View style={{ height: H, overflow: 'hidden', justifyContent: 'flex-start', alignItems: 'center', minWidth: 26 }}>
        <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
          {numbers.map((n) => (
            <View key={n} style={{ height: H, justifyContent: 'center', alignItems: 'center' }}>
              <Typography style={{ color: '#00F2FF', fontSize: 28, fontWeight: '800', letterSpacing: 0, textShadowColor: 'rgba(0, 242, 255, 0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 }}>
                {n}
              </Typography>
            </View>
          ))}
        </Animated.View>
      </View>

      <Typography style={{ color: 'rgba(255,255,255,0.95)', fontSize: 20, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginLeft: 8, marginBottom: 2 }}>
        dias
      </Typography>
    </View>
  );
};

// --- MECHANICAL WHEEL PICKER COMPONENT ---
const WheelPicker = ({ value, onChange, min = 1, max = 30, width = 80 }: { value: number, onChange: (v: number) => void, min?: number, max?: number, width?: number }) => {
  const ITEM_HEIGHT = 34;
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = numbers.indexOf(value);
    if (index >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  }, [value, numbers]);

  return (
    <View style={{ height: ITEM_HEIGHT * 3, overflow: 'hidden', alignItems: 'center', marginVertical: 0, width, alignSelf: 'center' }}>
      {/* Indicador Central Cyberpunk */}
      <View style={{ position: 'absolute', top: ITEM_HEIGHT, height: ITEM_HEIGHT, width: '100%', backgroundColor: 'rgba(0, 242, 255, 0.05)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0, 242, 255, 0.3)', zIndex: 0 }} pointerEvents="none" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          if (numbers[index] !== undefined && numbers[index] !== value) {
            onChange(numbers[index]);
          }
        }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {numbers.map((n) => (
          <TouchableOpacity
            key={n}
            activeOpacity={0.7}
            onPress={() => onChange(n)}
            style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', width: '100%' }}
          >
            <Typography style={{
              fontSize: value === n ? 24 : 16,
              color: value === n ? '#00F2FF' : 'rgba(255,255,255,0.2)',
              fontWeight: value === n ? '800' : '500',
              textShadowColor: value === n ? 'rgba(0, 242, 255, 0.5)' : 'transparent',
              textShadowRadius: value === n ? 8 : 0
            }}>
              {n}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { width, height } = useWindowDimensions();
  // Subscrição seletiva por domínio
  const user = useStore(Selectors.selectUser);
  const activeMemberId = useStore(Selectors.selectActiveMemberId);
  const credits = useStore(Selectors.selectCredits);
  const measurements = useStore(useShallow(Selectors.selectMeasurements));
  // [SAFE BUILD 1] Selectors dependentes de alocação de objetos instáveis desligados para diagnóstico de loop
  // const exportedContexts = useStore(useShallow(Selectors.selectExportedContexts));
  const exportedContexts: any[] = [];
  const installedAppIds = useStore(Selectors.selectInstalledAppIds);
  const isGuestMode = useStore(state => state.isGuestMode);
  const guestProfile = useStore(state => state.guestProfile);
  const isMeasuring = useStore(Selectors.selectIsMeasuring);
  const isNfcLoading = useStore(Selectors.selectIsNfcLoading);
  const hasResultsAccess = useStore(Selectors.selectHasResultsAccess);
  // const aiConfidence = useStore(useShallow(state => Selectors.selectAiConfidence(state)));
  const aiConfidence = { 
    level: 'limitada' as any, 
    score: 0, 
    factors: { positive: [], negative: [], info: [] },
    label: 'SAFE MODE',
    color: '#888',
    recommendedAction: { label: 'Aguardar', intent: 'wait' }
  };
  // const dailySynthesis = useStore(useShallow(state => Selectors.selectDailySynthesis(state)));
  const dailySynthesis = { status: 'needs_attention' as any, title: 'SAFE MODE', negativeHighlight: null, positiveHighlight: null, action: { label: 'Em Mitigação', intent: 'wait' as any } };

  const setUser = useStore(state => state.setUser);
  const setSessionToken = useStore(state => state.setSessionToken);
  const setAnalyses = useStore(state => state.setAnalyses);
  const setActiveAnalysisId = useStore(state => state.setActiveAnalysisId);
  useEffect(() => {
    async function loadData() {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (user && token && !isGuestMode) {
        try {
          // 2. CARREGAMENTO REAL DE ANÁLISES — M5 Fatia 2
          const analysesRes = await fetch(`${ENV.BACKEND_URL}/analyses`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (analysesRes.ok) {
            const realAnalyses = await analysesRes.json();
            setAnalyses(realAnalyses);

            // 3. RESOLUÇÃO DE ANÁLISE ACTIVA COM FALLBACK — M5 Fatia 2
            const persistedId = user?.activeAnalysisId;
            const existsInReal = realAnalyses.some((a: any) => a.id === persistedId);

            if (persistedId && existsInReal) {
              setActiveAnalysisId(persistedId);
            } else if (realAnalyses.length > 0) {
              // Fallback para a mais recente (já vem ordenada do backend)
              setActiveAnalysisId(realAnalyses[0].id);
            } else {
              setActiveAnalysisId(null);
            }
          }
        } catch (err) {
          console.error('[HomeScreen] Failed to load analyses:', err);
        }
      }
    }

    loadData();
  }, [user, isGuestMode, setAnalyses, setActiveAnalysisId]);

  // Garantir inicialização do serviço sem dependência circular
  useEffect(() => {
    // Usar o ID real se disponível, fallback para legacy session para não quebrar M4
    const uid = user?.id || 'user_current_session_1';
    semanticOutputService.init(uid);
  }, [user]);

  // Safe memoized facts query to avoid Zustand infinite render loop
  const rawEvents = useStore(state => state.appContributionEvents);
  const analyses = useStore(state => state.analyses);
  const activeAnalysisId = useStore(state => state.activeAnalysisId);

  // --- UI & NAVIGATION STATE ---
  const [showDemoModal, setShowDemoModal] = useState(false);
  // Demo uses the app-wide global demoAnalysis.
  const demoAnalysis = useStore(state => state.demoAnalysis);
  const setDemoAnalysis = useStore(state => state.setDemoAnalysis);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [bioTab, setBioTab] = useState(0);
  const [themesOpen, setThemesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [themesInteractive, setThemesInteractive] = useState(false);
  const [dataInteractive, setDataInteractive] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // ── FONTE ÚNICA DE VERDADE ──────────────────────────────────────────────────────
  // activeAnalysis: se Demo activo usa a análise temporária (source:'demo').
  // Caso contrário usa a análise apontada por activeAnalysisId no store.
  // Resultados + Leitura AI leem EXCLUSIVAMENTE daqui.
  const activeAnalysis = React.useMemo<Analysis | null>(() => {
    if (demoAnalysis) return demoAnalysis;
    
    let baseAnalysis = null;
    if (activeAnalysisId) {
      baseAnalysis = analyses.find(a => a.id === activeAnalysisId) ?? null;
    }
    if (!baseAnalysis) {
      baseAnalysis = analyses[0] ?? null;
    }

    if (!baseAnalysis) return null;

    // ── INJECT EXPORTED CONTEXTS AS ECOSYSTEM FACTS ──
    const mappedContexts = exportedContexts.map(ctx => {
      let valStr = String(ctx.value);
      if (typeof ctx.value === 'object' && ctx.value !== null) {
        valStr = ctx.value.label || ctx.value.status || JSON.stringify(ctx.value);
      }
      return {
        id: ctx.id,
        type: `${ctx.category} | ${ctx.key.toUpperCase()}`,
        sourceAppId: ctx.appId,
        value: valStr,
        timestamp: new Date(ctx.updatedAt).getTime(),
        memberId: ctx.memberId
      } as any;
    });

    return {
      ...baseAnalysis,
      ecosystemFacts: [
        ...(baseAnalysis.ecosystemFacts || []),
        ...mappedContexts
      ]
    };
  }, [demoAnalysis, activeAnalysisId, analyses, exportedContexts]);

  // ── PREV ANALYSIS PARA TENDÊNCIAS ───────────────────────────────────────────────
  const prevAnalysis = React.useMemo(() => {
    const isDemo = activeAnalysis?.source === 'demo';
    if (isDemo || !activeMemberId || !activeAnalysis) return null;
    return analyses.find(a => 
      a.memberId === activeMemberId && 
      a.source !== 'demo' && 
      a.id !== activeAnalysis.id && 
      new Date(a.createdAt).getTime() < new Date(activeAnalysis.createdAt).getTime()
    ) || null;
  }, [activeAnalysis, activeMemberId, analyses]);

  const prevSemanticState = React.useMemo(() => {
    if (!prevAnalysis || prevAnalysis.measurements.length === 0) return null;
    return computeSemanticFromMeasurements(prevAnalysis.measurements, prevAnalysis.ecosystemFacts || []);
  }, [prevAnalysis]);

  const getAugmentedSemanticInsights = React.useCallback(() => {
    let base = getSemanticInsights();
    if (!prevSemanticState) {
       return base.map(t => ({ ...t, trend: 'no_base' as const }));
    }
    return base.map(theme => {
       const oldDomain = prevSemanticState.domains[theme.domain];
       let trendVal: 'improving' | 'worsening' | 'stable' | 'no_base' = 'no_base';
       let priorityVal: 'noise' | 'discrete' | 'relevant' | 'critical' = 'noise';

       if (oldDomain && typeof theme.score === 'number' && typeof oldDomain.score === 'number') {
          const diff = theme.score - oldDomain.score;
          const absDiff = Math.abs(diff);

          if (absDiff < 2) {
             trendVal = 'stable';
             priorityVal = 'noise';
          } else {
             trendVal = diff > 0 ? 'improving' : 'worsening';
             if (absDiff < 5) priorityVal = 'discrete';
             else if (absDiff < 15) priorityVal = 'relevant';
             else priorityVal = 'critical';
          }
       }
       return { ...theme, trend: trendVal, priority: priorityVal };
    });
  }, [prevSemanticState]);

  // Leitura dos biomarcadores da análise activa (formaáto normalizado)
  const filteredMeasurements = React.useMemo(() => {
    if (!activeAnalysis) return [];
    // Converte AnalysisMeasurement para o formato legado esperado pela UI
    return activeAnalysis.measurements.map(m => ({
      type: m.type,
      timestamp: m.recordedAt,
      value: { marker: m.marker, value: m.value, unit: m.unit },
    }));
  }, [activeAnalysis]);

  // Sinais de ecossistema da análise activa
  const activeFacts = React.useMemo(() => {
    return activeAnalysis?.ecosystemFacts ?? [];
  }, [activeAnalysis]);

  // selectedDate — derivado da análise activa (para compat. com componentes que o esperam)
  const selectedDate = activeAnalysis?.analysisDate ?? null;

  // Settings Form State (Grupos de Análise)
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['U', 'S', 'F', 'O']);
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  const [showOutrosWarning, setShowOutrosWarning] = useState(false);

  const handleToggleGroup = (id: string) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter(g => g !== id));
    } else {
      setSelectedGroups([...selectedGroups, id]);
      if (id === 'O') {
        setShowOutrosWarning(true);
      }
    }
  };

  const factualBioCategories = React.useMemo(() => {
    const src = activeAnalysis?.measurements ?? [];
    const ecoSrc = activeAnalysis?.ecosystemFacts ?? [];

    const urinalysisMarkers = src
      .filter(m => m.type === 'urinalysis')
      .map(m => ({ name: m.marker || 'Análise Urinária', value: m.value, unit: m.unit }));

    const physiologyMarkers = src
      .filter(m => ['ecg', 'ppg', 'temp', 'weight'].includes(m.type))
      .map(m => ({ name: m.marker || m.type, value: m.value, unit: m.unit }));

    const fecalMarkers = src
      .filter(m => m.type === 'fecal')
      .map(m => ({ name: m.marker || 'Marcador Fecal', value: m.value, unit: m.unit }));

    return [
      { label: 'Análises de Urina',          color: '#00F2FF', markers: urinalysisMarkers, id: 'U', shortLabel: 'Urina' },
      { label: 'Monitorização Fisiológica', color: '#00D4AA', markers: physiologyMarkers, id: 'S', shortLabel: 'Fisiológica' },
      { label: 'Avaliação Fecal',           color: '#FFA500', markers: fecalMarkers,       id: 'F', shortLabel: 'Fecal' },
      {
        label: 'Sinais do Ecossistema', color: '#FFD700', id: 'E', shortLabel: 'Ecossistema',
        markers: ecoSrc.map(f => ({
          name: String(f.type).replace(/_/g, ' ').toUpperCase(),
          value: f.value,
          unit: f.sourceAppId,
        }))
      },
    ].filter(c => c.id === 'E' || selectedGroups.includes(c.id));
  }, [activeAnalysis, selectedGroups]);

  // Ações via subscrição estática (sem re-render por estado)
  const launchApp = useStore(state => state.launchApp);
  const uninstallApp = useStore(state => state.uninstallApp);

  // Subscrição ao Bundle Semântico v1.2.0 (Fonte de Verdade)
  const [semanticThemes, setSemanticThemes] = useState(getSemanticInsights());
  const [semanticStatus, setSemanticStatus] = useState(getSemanticStatus());
  const [crossDomainSummary, setCrossDomainSummary] = useState(semanticOutputService.getCrossDomainSummary());
  
  // ── ESTADO DA IA (v1.3.0) ──
  const [aiState, setAiState] = useState(getAiStatus());

  // ── FONTE ÚNICA DE VERDADE ──────────────────────────────────────────────────────
  // activeAnalysis muda → loadAnalysis injeta bundle calculado → SemanticOutputStore
  // notifica subscritores → setSemanticThemes/setSemanticStatus actualiza a UI.
  // Resultados e Leitura AI leem do mesmo objecto — zero fontes paralelas.
  // [SAFE BUILD 2] Desativada a cadeia reativa de Semantic Engine que provocava re-renders circulares
  /*
  useEffect(() => {
    semanticOutputService.loadAnalysis(activeAnalysis);
  }, [activeAnalysis]);

  useEffect(() => {
    const unsubscribe = semanticOutputService.subscribe(() => {
      setSemanticThemes(getSemanticInsights());
      setSemanticStatus(getSemanticStatus());
      setAiState(getAiStatus());
      setCrossDomainSummary(semanticOutputService.getCrossDomainSummary());
    });
    return unsubscribe;
  }, []);
  */

  const themesFlatListRef = useRef<FlatList>(null);
  const themesPanelHeight = height;
  const [showProfile, setShowProfile] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  // ── Animation States ────────────────────────────────────────────────────
  const themesAnim = useRef(new Animated.Value(-width)).current;
  const dataAnim = useRef(new Animated.Value(width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(1)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  // ── DEMO MODE ────────────────────────────────────────────────────────────────
  // Demo cria análise temporária em memória (source:'demo').
  // NÃO é adicionada a analyses[] — não contamina o histórico real.
  // Sair do demo: setDemoAnalysis(null) — volta ao activeAnalysisId.
  const handleSelectDemo = (key: any) => {
    setShowDemoModal(false);

    // ── Desativar Demo (key === null) ──────────────────────────────────────
    if (!key) {
      setDemoAnalysis(null);
      // Fecha ambos os painéis limpo
      setDataOpen(false);
      setThemesOpen(false);
      Animated.spring(dataAnim, { toValue: width, bounciness: 0, useNativeDriver: false }).start(() => setDataInteractive(false));
      Animated.spring(themesAnim, { toValue: -width, bounciness: 0, useNativeDriver: false }).start(() => setThemesInteractive(false));
      return;
    }

    // ── Activar cenário Demo ───────────────────────────────────────────────
    // 1. Fecha Resultados (estado imediato — não depende de animação terminar)
    setDataOpen(false);
    Animated.spring(dataAnim, { toValue: width, bounciness: 0, useNativeDriver: false }).start(() => setDataInteractive(false));

    // 2. Cria baseline factual DEMO e injeta no objecto análise temporária completa
    let demoMeasurements = [
      { id: 'd_u1', type: 'urinalysis', marker: 'Hidratação', value: 1.015, unit: 'SG', recordedAt: Date.now() },
      { id: 'd_u2', type: 'urinalysis', marker: 'pH', value: 6.5, unit: '', recordedAt: Date.now() },
      { id: 'd_u3', type: 'urinalysis', marker: 'Oxidação (MDA)', value: 1.2, unit: 'µmol', recordedAt: Date.now() },
      { id: 'd_u4', type: 'urinalysis', marker: 'Leucócitos', value: 0, unit: 'cel/uL', recordedAt: Date.now() },
      { id: 'd_f1', type: 'fecal', marker: 'Bristol', value: 4, unit: 'Tipo', recordedAt: Date.now() },
      { id: 'd_f2', type: 'fecal', metricKey: 'bowel_regularity', marker: 'Regularidade intestinal', value: 'Regular', unit: '', recordedAt: Date.now() },
      { id: 'd_f3', type: 'fecal', metricKey: 'fecal_characterization', marker: 'Caracterização', value: 'Sem anomalias visuais', unit: '', recordedAt: Date.now() },
      { id: 'd_ecg', type: 'ecg', marker: 'Ritmo Sinusal', value: 65, unit: 'bpm', recordedAt: Date.now() },
      { id: 'd_p1', type: 'ppg', marker: 'VFC (HRV)', value: 55, unit: 'ms', recordedAt: Date.now() },
      { id: 'd_t', type: 'temp', marker: 'Variação T. Basal', value: 0.1, unit: 'C', recordedAt: Date.now() },
      { id: 'd_w', type: 'weight', marker: 'Estabilidade', value: 72.0, unit: 'kg', recordedAt: Date.now() }
    ];

    let demoEcoFacts = [
      { id: 'f_sleep', type: 'sono_profundo', value: '1h45', sourceAppId: 'sleep_ring', recordedAt: Date.now() },
      { id: 'f_steps', type: 'passos_diarios', value: '8500', sourceAppId: 'health_os', recordedAt: Date.now() }
    ];

    // Overrides específicos por cenário DEMO
    if (key === 'low_energy') {
      demoMeasurements = demoMeasurements.map(m =>
        m.marker === 'VFC (HRV)' ? { ...m, value: 32 } :
        m.marker === 'Ritmo Sinusal' ? { ...m, value: 78 } :
        m.marker === 'Hidratação' ? { ...m, value: 1.025 } :
        m.marker === 'Oxidação (MDA)' ? { ...m, value: 3.8 } : m
      );
      demoEcoFacts = demoEcoFacts.map(f => f.type === 'sono_profundo' ? { ...f, value: '0h50' } : f);
    } else if (key === 'poor_recovery') {
      demoMeasurements = demoMeasurements.map(m =>
        m.marker === 'VFC (HRV)' ? { ...m, value: 25 } :
        m.marker === 'Variação T. Basal' ? { ...m, value: 0.6 } :
        m.marker === 'Ritmo Sinusal' ? { ...m, value: 84 } : m
      );
      demoEcoFacts = demoEcoFacts.map(f => f.type === 'sono_profundo' ? { ...f, value: '0h35' } : f);
    } else if (key === 'irregular_digestion') {
      demoMeasurements = demoMeasurements.map(m =>
        m.marker === 'Bristol' ? { ...m, value: 6 } :
        m.marker === 'Regularidade intestinal' ? { ...m, value: 'Irregular' } :
        m.marker === 'Caracterização' ? { ...m, value: 'Fezes desfeitas, margens irregulares' } :
        m.marker === 'pH' ? { ...m, value: 8.0 } : m
      );
    } else if (key === 'mixed' || key === 'mixed_profile') {
      demoMeasurements = demoMeasurements.map(m =>
        m.marker === 'Bristol' ? { ...m, value: 2 } :
        m.marker === 'VFC (HRV)' ? { ...m, value: 40 } :
        m.marker === 'Hidratação' ? { ...m, value: 1.020 } : m
      );
    } // "balanced" não tem overrides porque a baseline já é equilibrada

    const demo = {
      id: `demo_${Date.now()}`,
      source: 'demo',
      demoScenarioKey: key,
      analysisDate: new Date().toISOString().split('T')[0],
      deviceSources: ['demo_system'],
      ecosystemFacts: demoEcoFacts.map((f: any) => ({ ...f, value: String(f.value ?? '') })),
      measurements: demoMeasurements.map((m: any) => ({ ...m, value: String(m.value ?? '') }))
    } as any;
    setDemoAnalysis(demo);


    // 3. Forçar fecho do painel Leitura AI (Themes) para todos os utilizadores.
    // Evita o bug de "ecrã lavado/branco" provocado pelo overlap de animações vs Modals na Web.
    setThemesOpen(false);
    Animated.spring(themesAnim, { toValue: -width, bounciness: 0, useNativeDriver: false }).start(() => setThemesInteractive(false));
  };

  const handleExitDemo = () => {
    setDemoAnalysis(null);
  };

  const [stableExpanded, setStableExpanded] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || 'Utilizadora');
  const [profileAge, setProfileAge] = useState(user?.age ? user.age.toString() : '');
  const [profileWeight, setProfileWeight] = useState(user?.weight ? user.weight.toString() : '');
  const [profileHeight, setProfileHeight] = useState(user?.height ? user.height.toString() : '');

  // A. Corrigir sincronização local do Profile ao abrir o modal
  useEffect(() => {
    if (showProfile) {
      if (isGuestMode) {
        setProfileName(guestProfile?.name || 'Convidada');
        setProfileAge(guestProfile?.age ? guestProfile.age.toString() : '');
        setProfileWeight(guestProfile?.weight ? guestProfile.weight.toString() : '');
        setProfileHeight(guestProfile?.height ? guestProfile.height.toString() : '');
      } else {
        const newVal = user?.name || 'Utilizador';
        if ((window as any) && (window as any)._lastSavedName && newVal !== (window as any)._lastSavedName) {
           console.warn(`[DEV NAME 6] rehydration overwrite detected: saved "${(window as any)._lastSavedName}" but store injected "${newVal}"`);
        }
        setProfileName(newVal);
        setProfileAge(user?.age ? user.age.toString() : '');
        setProfileWeight(user?.weight ? user.weight.toString() : '');
        setProfileHeight(user?.height ? user.height.toString() : '');
      }
    }
  }, [showProfile, isGuestMode, user, guestProfile]);

  // Odometer calculation (Factual)
  // Remove selectDaysSinceLastMeasurement locally, rely on freshness slice later
  const dataFreshness = useStore(useShallow(state => Selectors.selectDataFreshness(state)));
  const diasSemExame = dataFreshness.daysSince ?? 0;

  // Settings Form State (Modo de Análise)
  const [syncFlowState, setSyncFlowState] = useState<'idle'|'searching'|'connected'|'syncing'|'success'|'failed'>('idle');

  const executeSyncReal = () => {
     setSyncFlowState('searching');
     // Anúncio global de sync para bloquear outras gavetas se necessário
     useStore.getState().setIsMeasuring(true);
     
     // 1. Procurar
     setTimeout(() => {
        setSyncFlowState('connected');
        // 2. Conectado
        setTimeout(() => {
           setSyncFlowState('syncing');
           // 3. Recolha Mútua
           setTimeout(() => {
               // SUCCESS - injetar mock measurement na camada canonica
               useStore.getState().setIsMeasuring(false);
               setSyncFlowState('success');
               
               const storeRef = useStore.getState();
               // Resgate tatico: se foi barrado por restricao antes mas acionamos o sync forçado pela view pessoal?
               // Wait, activeMemberId always tells who we're focusing on.
               const targetId = storeRef.activeMemberId || storeRef.user?.id;
               
               const payloadArray = [
                 { id: 'scan_' + Date.now(), type: 'vitals', source: 'nfc_scanner', timestamp: new Date().toISOString(), memberId: targetId, value: { marker: 'Energia Base', value: 94 } },
                 { id: 'scan_c_' + Date.now(), type: 'vitals', source: 'nfc_scanner', timestamp: new Date().toISOString(), memberId: targetId, value: { marker: 'Cardio Físico', value: 68 } }
               ];

               useStore.setState({ measurements: [...payloadArray, ...(storeRef.measurements || [])] });

               setTimeout(() => {
                   setSyncFlowState('idle');
               }, 3000);
           }, 2500);
        }, 1600);
     }, 1800);
  };

  // Escuta ativa de pedidos de Sincronização vindos do Agregado ou outras tabs
  useEffect(() => {
     if (isMeasuring && syncFlowState === 'idle') {
        executeSyncReal();
     }
  }, [isMeasuring, syncFlowState]);

  const [analysisMode, setAnalysisMode] = useState<'manual' | 'automatico'>('automatico');
  const [autoTimes, setAutoTimes] = useState(1);
  const [autoDays, setAutoDays] = useState(1);
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [showAutoWarning, setShowAutoWarning] = useState(false);


  type NotificationMode = 'Ativas' | 'Apenas Alertas' | 'Silenciadas';
  const [notificationMode, setNotificationMode] = useState<NotificationMode>('Ativas');

  const cycleNotificationMode = () => {
    if (notificationMode === 'Ativas') setNotificationMode('Apenas Alertas');
    else if (notificationMode === 'Apenas Alertas') setNotificationMode('Silenciadas');
    else setNotificationMode('Ativas');
  };

  // ── Inline mini-app for web (same pattern as AppsScreen) ─────────────────
  const [inlineApp, setInlineApp] = useState<MiniAppManifest | null>(null);

  const arrowTranslate = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 10]
  });

  const arrowOpacity = arrowAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 1, 0]
  });

  // HOTFIX CRUCIAL: Iniciar e Forçar o loop de animação das setas (estava cego sem isto!)
  React.useEffect(() => {
    let isActive = true;
    const runAnimation = () => {
      if (!isActive) return;

      arrowAnim.setValue(0); // Reinicia obrigatoriamente para 0

      Animated.timing(arrowAnim, {
        toValue: 1,
        duration: 1500, // Ciclo urgente de 1.5 seg
        useNativeDriver: false, // Forçando JS Thread obriga bypass à placa gráfica
        isInteraction: false, // Para não ser pausado por toques do utilizador
      }).start(() => {
        if (isActive) {
          // Quebra a Call Stack síncrona para que o RN Web não ignore o reinício
          setTimeout(runAnimation, 20);
        }
      });
    };

    runAnimation();

    return () => {
      isActive = false;
      arrowAnim.stopAnimation();
    };
  }, [arrowAnim]);

  // Backdrop darkening: fades to black when Temas or Dados panels slide open
  const themesBackdropOpacity = themesAnim.interpolate({
    inputRange: [-width, 0],
    outputRange: [0, 0.88],
    extrapolate: 'clamp',
  });
  const dataBackdropOpacity = dataAnim.interpolate({
    inputRange: [0, width],
    outputRange: [0.88, 0],
    extrapolate: 'clamp',
  });

  // ── Home screen "transport" effect: shifts sideways as panels open ─────────
  // When Temas (left panel) opens, home moves right. When Dados opens, home moves left.
  const homeShiftFromThemes = themesAnim.interpolate({
    inputRange: [-width, 0],
    outputRange: [0, width],
    extrapolate: 'clamp',
  });
  const homeShiftFromData = dataAnim.interpolate({
    inputRange: [0, width],
    outputRange: [-width, 0],
    extrapolate: 'clamp',
  });
  const homeShiftX = Animated.add(homeShiftFromThemes, homeShiftFromData);

  // Slight scale-down effect to add depth feel (1 → 0.88 as panel opens)
  const homeShrinkFromThemes = themesAnim.interpolate({
    inputRange: [-width, 0],
    outputRange: [1, 0.88],
    extrapolate: 'clamp',
  });
  const homeShrinkFromData = dataAnim.interpolate({
    inputRange: [0, width],
    outputRange: [0.88, 1],
    extrapolate: 'clamp',
  });
  const homeShrink = Animated.multiply(homeShrinkFromThemes, homeShrinkFromData);

  // Mutable refs for edge gesture callbacks (avoid stale closures in PanResponder)
  const openThemesRef = useRef<() => void>(() => { });
  const openDataRef = useRef<() => void>(() => { });

  // ── Panel open/close helpers (sync animation + state for web backdrop) ────
  const openThemes = () => {
    if (dataOpen) return; // prevent overlap: don't open if Dados is open
    setThemesInteractive(true);
    setThemesOpen(true);
    Animated.spring(themesAnim, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
  };
  const closeThemes = () => {
    setThemesOpen(false);
    Animated.spring(themesAnim, { toValue: -width, bounciness: 0, useNativeDriver: false }).start(() => {
      setThemesInteractive(false);
    });
  };
  const openData = () => {
    if (themesOpen) return; // prevent overlap: don't open if Temas is open
    setDataInteractive(true);
    setDataOpen(true);
    Animated.spring(dataAnim, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
  };
  const closeData = () => {
    setDataInteractive(false);
    if (themesOpen) closeThemes();
    Animated.spring(dataAnim, {
      toValue: width,
      bounciness: 0,
      speed: 14,
      useNativeDriver: false,
    }).start(() => {
      setDataOpen(false);
    });
  };

  // Keep edge gesture callbacks up to date every render
  openThemesRef.current = openThemes;
  openDataRef.current = openData;

  const handleSynthesisAction = (intent: string) => {
    if (intent === 'sync_now' || intent === 're_sync') {
      closeData(); closeThemes();
      setTimeout(() => executeSyncReal(), 400);
    } else if (intent === 'manage_permissions' || intent === 'complete_profile') {
      closeData(); closeThemes(); setShowProfile(true);
    } else if (intent === 'explore_analysis') {
      closeData(); openThemes();
    } else if (intent === 'open_timeline') {
      closeData(); closeThemes(); setShowHistorico(true);
    } else if (intent === 'open_context') {
      alert('Aceda ao App Place na shell principal para autorizar integrações.');
    }
  };

  // ── Switch Setup ──────────────────────────────────────────────────────────
  const switchAnim = useRef(new Animated.Value(0)).current; // 0 = UP, 160 = DOWN
  const isOff = useRef(false);

  const switchPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        switchAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Divide dy by 0.6 because the visual component is scaled to 60%
        let newY = (isOff.current ? 160 : 0) + (gestureState.dy / 0.6);
        if (newY < 0) newY = 0;
        if (newY > 160) newY = 160;
        switchAnim.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        let newY = (isOff.current ? 160 : 0) + (gestureState.dy / 0.6);
        let toValue = 0;
        // Se passar da métrica ou tiver pull rápido para baixo
        if (newY > 60 || (gestureState.vy / 0.6) > 0.4) {
          toValue = 160;
          isOff.current = true;
        } else {
          toValue = 0;
          isOff.current = false;
        }
        Animated.spring(switchAnim, {
          toValue,
          useNativeDriver: Platform.OS !== 'web',
          bounciness: 4,
          speed: 14,
        }).start(({ finished }) => {
          if (finished && toValue === 160) {
            setShowNfcModal(true);
          }
        });
      }
    })
  ).current;

  // Left edge gesture zone (Temas) - captures swipe right from left 60px
  const leftEdgeGesture = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => Platform.OS === 'web',
    onMoveShouldSetPanResponder: () => Platform.OS === 'web',
    onPanResponderRelease: (_, { dx, dy }) => {
      if (dx > 50 && Math.abs(dy) < 120) openThemesRef.current();
    },
  })).current;

  // Right edge gesture zone (Dados) - captures swipe left from right 60px
  const rightEdgeGesture = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => Platform.OS === 'web',
    onMoveShouldSetPanResponder: () => Platform.OS === 'web',
    onPanResponderRelease: (_, { dx, dy }) => {
      if (dx < -50 && Math.abs(dy) < 120) openDataRef.current();
    },
  })).current;

  const DRAWER_DOWN = 583;
  const DRAWER_UP = 0;
  const lastDrawerY = useRef(DRAWER_DOWN);
  const drawerAnim = useRef(new Animated.Value(DRAWER_DOWN)).current;

  // Bottom edge gesture zone (App Place drawer) - swipe up from bottom to open
  const bottomEdgeGesture = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => Platform.OS === 'web',
    onMoveShouldSetPanResponder: () => Platform.OS === 'web',
    onPanResponderRelease: (_, { dy, vy }) => {
      if (dy < -30 || vy < -0.3) {
        Animated.spring(drawerAnim, { toValue: 0, bounciness: 0, useNativeDriver: false })
          .start(() => { lastDrawerY.current = 0; });
      }
    },
  })).current;

  // Force sync drawer position on hot reload so user sees exact bottom state
  React.useEffect(() => {
    drawerAnim.setValue(DRAWER_DOWN);
    lastDrawerY.current = DRAWER_DOWN;
  }, [DRAWER_DOWN]);

  const drawerBgOpacity = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [1, 0.10],
    extrapolate: 'clamp',
  });

  const drawerInnerOpacity = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [1, 0.50], // Elevado 15% a pedido para mais legibilidade
    extrapolate: 'clamp',
  });

  const centerContentY = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [-230, -80],
    extrapolate: 'clamp',
  });

  const homeBlurBackdropOpacity = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [1, 0], // Fully visible when UP (drawer open), invisible when DOWN
    extrapolate: 'clamp',
  });

  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        let newY = lastDrawerY.current + dy;
        if (newY < DRAWER_UP) newY = DRAWER_UP;
        if (newY > DRAWER_DOWN) newY = DRAWER_DOWN;
        drawerAnim.setValue(newY);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        let finalY = lastDrawerY.current + dy;
        let toValue = DRAWER_DOWN;
        
        if (vy < -0.2 || dy < -25 || (lastDrawerY.current === DRAWER_DOWN && dy < -15)) {
          toValue = DRAWER_UP; // Fast swipe up or short deliberate swipe up
        } else if (vy > 0.2 || dy > 25 || (lastDrawerY.current === DRAWER_UP && dy > 15)) {
          toValue = DRAWER_DOWN; // Fast swipe down or short deliberate swipe down
        } else if (finalY < (DRAWER_DOWN + DRAWER_UP) / 2) {
          toValue = DRAWER_UP;
        } else {
          toValue = DRAWER_DOWN;
        }

        Animated.spring(drawerAnim, {
          toValue,
          bounciness: 0,
          useNativeDriver: false,
        }).start(() => {
          lastDrawerY.current = toValue;
        });
      }
    })
  ).current;

  // ── Central Visual Animation ──────────────────────────────────────────────
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(arrowAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 15000, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 15000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 0, duration: 20000, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 1, duration: 20000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Gesture Handlers ──────────────────────────────────────────────────────
  const mainPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy, y0 }) => {
        // Se a gaveta estiver aberta, protegemos o scroll horizontal das apps
        if (lastDrawerY.current < 200 && y0 > 250 && Math.abs(dx) > Math.abs(dy)) {
          return false;
        }

        // Capture se for um arrastão longo (lateral para Menus ou para cima na zona inferior)
        if (Math.abs(dx) > 30) return true;
        if (Math.abs(dy) > 20 && y0 > 300) return true;
        return false;
      },
      onPanResponderMove: (_, { dx, dy, y0 }) => {
        // Se o gesto começar na metade inferior e for maioritariamente vertical, liga ao arrasto da App Place
        if (y0 > 300 && Math.abs(dy) > Math.abs(dx)) {
          let newY = lastDrawerY.current + dy;
          if (newY < DRAWER_UP) newY = DRAWER_UP;
          if (newY > DRAWER_DOWN) newY = DRAWER_DOWN;
          drawerAnim.setValue(newY);
        }
      },
      onPanResponderRelease: (_, { x0, dx, dy, vy, y0 }) => {
        const isDrawerOpen = lastDrawerY.current < 200;

        // Left Edge Swipe -> Themes (blocked if drawer is open)
        if (!isDrawerOpen && x0 < 120 && dx > 50) {
          openThemesRef.current();
          return;
        }
        // Right Edge Swipe -> Data (blocked if drawer is open)
        if (!isDrawerOpen && x0 > width - 120 && dx < -50) {
          openDataRef.current();
          return;
        }

        // Vertical Swipe (Bottom Half) -> App Drawer
        if (y0 > 300 && Math.abs(dy) > Math.abs(dx)) {
          if (dy < -25 || vy < -0.2) {
            Animated.spring(drawerAnim, { toValue: DRAWER_UP, useNativeDriver: false }).start(() => lastDrawerY.current = DRAWER_UP);
          } else if (dy > 25 || vy > 0.2) {
            Animated.spring(drawerAnim, { toValue: DRAWER_DOWN, useNativeDriver: false }).start(() => lastDrawerY.current = DRAWER_DOWN);
          } else {
            // Revert
            Animated.spring(drawerAnim, { toValue: lastDrawerY.current, useNativeDriver: false }).start();
          }
        }
      },
    })
  ).current;

  // ── Web touch gesture detector (mobile browser) ─────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      // Se a gaveta estiver aberta, ignoramos gestos laterais (protege o carrocel das apps)
      if (lastDrawerY.current < 200) return;

      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const screenW = window.innerWidth;
      // Left edge swipe right → open Temas (via ref for mutual exclusion)
      if (touchStartX < 120 && dx > 50 && Math.abs(dy) < 80) {
        openThemesRef.current();
      }
      // Right edge swipe left → open Dados (via ref for mutual exclusion)
      if (touchStartX > screenW - 120 && dx < -50 && Math.abs(dy) < 80) {
        openDataRef.current();
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // ── Drawer handle DOM touch events (for reliable mobile web drag) ─────────
  const drawerHandleRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = drawerHandleRef.current;
    if (!el) return;
    let startY = 0;
    let startDrawerY = 0;
    const onTStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startDrawerY = lastDrawerY.current;
    };
    const onTMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;
      // Only track as drag if movement is significant (>20px prevents jitter)
      if (Math.abs(dy) > 20) {
        const newY = Math.max(0, Math.min(DRAWER_DOWN, startDrawerY + dy));
        drawerAnim.setValue(newY);
      }
    };
    const onTEnd = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - startY;
      // Only snap if it was a real drag (>20px) — otherwise let onPress fire normally
      if (Math.abs(dy) > 20) {
        const finalY = startDrawerY + dy;
        const toValue = finalY < DRAWER_DOWN / 2 ? DRAWER_UP : DRAWER_DOWN;
        Animated.spring(drawerAnim, { toValue, bounciness: 0, useNativeDriver: false })
          .start(() => { lastDrawerY.current = toValue; });
      }
    };
    el.addEventListener('touchstart', onTStart, { passive: true });
    el.addEventListener('touchmove', onTMove, { passive: true });
    el.addEventListener('touchend', onTEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTStart);
      el.removeEventListener('touchmove', onTMove);
      el.removeEventListener('touchend', onTEnd);
    };
  }, []);

  // (isDraggingDrawer removed — movement threshold in onTEnd handles drag vs tap)

  const handleOpenMiniApp = (appId: string) => {
    console.log('[HomeScreen] Intentando abrir MiniApp:', appId);
    // Vibration.vibrate([0, 10, 5, 10]); // Padrão de vibração se quiseres manter

    const app = MINI_APP_CATALOG.find((a: any) => a.id === appId);
    if (app) {
      try {
        // Tentativa de navegação forçada para o topo
        navigation.navigate('MiniApp', {
          app
        });
      } catch (err: any) {
        console.error('[HomeScreen] Erro na navegação:', err);
      }
    } else {
      console.warn('[HomeScreen] MiniApp não encontrada:', appId);
    }
  };

  // ── Web: render mini-app inline (iframe via MiniAppContainer.web.tsx) ─────
  if (Platform.OS === 'web' && inlineApp) {
    return (
      <MiniAppContainer
        app={inlineApp}
        navigation={{ goBack: () => setInlineApp(null) }}
      />
    );
  }

  return (
    <Container safe style={styles.container}>
      <View style={{ backgroundColor: 'red', padding: 8, zIndex: 9999, alignItems: 'center' }}>
        <Typography style={{ color: 'white', fontWeight: 'bold' }}>SAFE MODE RUNTIME STEP 4</Typography>
      </View>
      {/* ── FULL SCREEN BACKGROUND ESTÁTICO NEGRO ───────────────────────────────── */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#020306' }]} pointerEvents="none">

        {/* Floating nuances */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: floatAnim1 }]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: floatAnim2 }]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)', 'rgba(0,0,0,0.2)']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      {/* ── BACKDROP: darkens home and allows tap-to-close on home side only ── */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: themesBackdropOpacity, zIndex: 10 }]}
        pointerEvents={themesInteractive ? "box-none" : "none"}
      >
          {/* Only RIGHT half is pressable — left is the panel, right is the shifted home */}
          <TouchableOpacity
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}
            activeOpacity={1}
            onPress={closeThemes}
          />
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: dataBackdropOpacity, zIndex: 10 }]}
        pointerEvents={dataInteractive ? "box-none" : "none"}
      >
          {/* Only LEFT half is pressable — right is the panel, left is the shifted home */}
          <TouchableOpacity
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' }}
            activeOpacity={1}
            onPress={closeData}
          />
      </Animated.View>


      {/* ── WEB EDGE GESTURE ZONES (only when both panels closed) ──────────── */}
      {Platform.OS === 'web' && !themesOpen && !dataOpen && (
        <View
          {...leftEdgeGesture.panHandlers}
          style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 60, zIndex: 600 }}
        />
      )}
      {Platform.OS === 'web' && !dataOpen && !themesOpen && (
        <View
          {...rightEdgeGesture.panHandlers}
          style={{ position: 'absolute', right: 0, top: '25%', bottom: '25%', width: 60, zIndex: 600 }}
        />
      )}


      <Animated.View
        {...mainPanResponder.panHandlers}
        style={[
          styles.mainView,
          {
            transform: [
              { translateX: homeShiftX },
              { scale: homeShrink },
            ],
          },
        ]}
      >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ position: 'relative', flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View>
              <BrandLogo size="medium" />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS !== 'web') Vibration.vibrate(10);
                }}
                style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
              />
            </View>
            {/* NEW DEMO BUTTON REPOSITIONED */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setShowDemoModal(true)}
              style={{
                marginLeft: 16,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: demoAnalysis ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
                borderColor: demoAnalysis ? 'rgba(0, 242, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography style={{ color: demoAnalysis ? '#00F2FF' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                {demoAnalysis ? 'DEMO ON' : 'DEMO'}
              </Typography>
            </TouchableOpacity>
          </View>
          
          {/* Espaçador central limpo para evitar a confusão visual de duplo selo DEMO */}
          <View style={{ flex: 1 }} />

          <View style={[styles.headerRight, { flex: 1 }]}>
            <View style={styles.topIconRow}>
              {/* NEW TOKENS BUTTON (Old DEMO slot) */}
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.iconCircle, { paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }]} 
                onPress={() => setShowTokens(true)}
              >
                <Image source={require('../../assets/token abl.png')} style={{ width: 26, height: 26, resizeMode: 'contain', tintColor: '#e5e5e5' }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconCircle} onPress={() => setShowControl(true)}>
                <SlidersHorizontal size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={() => setShowProfile(true)}>
                <User size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── CENTRAL VISUAL (The HoloPulse) ────────────────────────────────── */}
        {(() => {
          // Lógica de degradação temporal e cor (diasSemExame is now a state)
          const isCritical = diasSemExame > 8; // SÓ A PARTIR de 8 dias passa a vermelho e perde vitalidade pulsante
          const glowColorRGB = isCritical ? '138, 21, 21' : '255, 215, 0'; // Vermelho sangue profundo/escuro
          const glowColorHex = isCritical ? '#8A1515' : '#FFD700';

          // Fator de saúde (1.0 = Max radiance [0 dias: "Pos 7"], 0.0 = Min radiance [8 dias: "Pos 1 original"])
          const healthFactor = Math.max(0, 1 - (Math.min(diasSemExame, 8) / 8));

          // Memória Exata da Posição 1: Base era 20, Expansiva era 100.
          // Interpolação linear da Pos 1 (0.0) para Pos 7 (1.0)
          const radiusBase = 20 + (healthFactor * 40);      // Pos 1: 20  | Pos 7: 60
          const radiusMedia = 100 + (healthFactor * 100);   // Pos 1: 100 | Pos 7: 200
          const radiusExtrema = healthFactor * 400;         // Pos 1: 0   | Pos 7: 400
          const radiusGalatica = healthFactor * 700;        // Pos 1: 0   | Pos 7: 700

          // Animação da intensidade
          // Na Posição 1 ou superior: Aquece sempre até 1.0 (Pleno) e decai consoante saúde
          // EM ESTADO CRÍTICO (> 8 dias): O pulmão falha. Pulsa muito fraco no fundo escuro (0.15 a 0.35)
          const minOpacity = isCritical ? 0.15 : 0.3 + (healthFactor * 0.45);
          const maxOpacity = isCritical ? 0.35 : 1.0;

          const glowOpacityAnim = pulseAnim.interpolate({
            inputRange: [1, 1.2],
            outputRange: [minOpacity, maxOpacity]
          });

          return (
            <Animated.View style={[styles.centerContainer, { transform: [{ translateY: centerContentY }, { scale: 0.52 }] }]}>
              <View style={{ width: 240, height: 410, justifyContent: 'center', alignItems: 'center' }}>

                {/* 1) Luz Base Fixa (Afasta e aperta rigorosamente segundo as Posições 1-7) */}
                <View style={{
                  position: 'absolute',
                  width: 240, height: 410,
                  borderRadius: 120,
                  backgroundColor: 'transparent',
                  shadowColor: glowColorHex,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: radiusBase,
                  elevation: 15
                }} pointerEvents="none" />

                {/* 2) Luz Expansiva Média */}
                <Animated.View style={{
                  position: 'absolute',
                  width: 240, height: 410,
                  borderRadius: 120,
                  backgroundColor: 'transparent',
                  shadowColor: glowColorHex,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: radiusMedia,
                  elevation: 40,
                  opacity: glowOpacityAnim
                }} pointerEvents="none" />

                {/* 3) Luz Expansiva Extrema (Anula-se a zero se Pos 1) */}
                <Animated.View style={{
                  position: 'absolute',
                  width: 240, height: 410,
                  borderRadius: 120,
                  backgroundColor: 'transparent',
                  shadowColor: glowColorHex,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: healthFactor > 0 ? 1 : 0,
                  shadowRadius: radiusExtrema,
                  elevation: 60,
                  opacity: glowOpacityAnim
                }} pointerEvents="none" />

                {/* 4) Luz Galática (Anula-se a zero se Pos 1) */}
                <Animated.View style={{
                  position: 'absolute',
                  width: 240, height: 410,
                  borderRadius: 120,
                  backgroundColor: 'transparent',
                  shadowColor: glowColorHex,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: healthFactor > 0 ? 0.9 : 0,
                  shadowRadius: radiusGalatica,
                  elevation: 80,
                  opacity: glowOpacityAnim
                }} pointerEvents="none" />

                {/* The Track Base - Pill interior FIXO - Agora atua como Tubo Sideral */}
                <View style={{ width: 240, height: 410, borderRadius: 120, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255, 230, 184, 0.08)', zIndex: 10 }}>
                  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                    <SiderealBackground />
                    {/* Subtil manto para apaziguar a simulação e encaixar no breu */}
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(2, 4, 8, 0.65)' }]} />
                  </View>

                  {/* INDICADOR KINETICO DE DESLIZE (Swipe Down Affordance iOS Style) */}
                  <View style={{ position: 'absolute', top: 250, bottom: 0, left: 0, right: 0, alignItems: 'center', zIndex: 99999, pointerEvents: 'none' }}>
                    <Animated.View style={{
                      opacity: arrowAnim.interpolate({ inputRange: [0, 0.05, 0.9, 1], outputRange: [0, 1, 1, 0] }),
                      transform: [{ translateY: arrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) }]
                    }}>
                      <ChevronDown size={36} strokeWidth={1.5} color="rgba(255, 255, 255, 0.95)" />
                    </Animated.View>
                  </View>

                  <Animated.View style={{ width: 240, height: 240, transform: [{ translateY: switchAnim }], zIndex: 9999 }} {...switchPanResponder.panHandlers}>
                    <View style={[styles.pulseContainer, { marginBottom: 0 }]} pointerEvents="box-none">
                      {/* CHASSIS DO MOTOR GEOMÉTRICO (Zoom Out aplicado - 340) c/ Borda Metálica */}
                      <View style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, overflow: 'hidden', backgroundColor: '#020306', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)', justifyContent: 'center', alignItems: 'center' }}>
                        <BiomechanicRelic size={340} />
                        {/* Vidro fosco geral (frost filter) a 30% intensidade */}
                        <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 120 }]} pointerEvents="none" />
                      </View>

                      {/* Cúpula Mestra Interior (Mantida para limites) */}
                      <View style={{ position: 'absolute', width: 223, height: 223, borderRadius: 111.5, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>

                        {/* MÁSCARAS DE DIFUSÃO (BlurViews localizados para os textos superiores e odómetro) */}
                        <View style={{ position: 'absolute', top: 12, left: '50%', marginLeft: -80, width: 160, height: 35, borderRadius: 18, overflow: 'hidden' }}>
                          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
                        </View>

                        <View style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -35, marginLeft: -70, width: 140, height: 70, borderRadius: 35, overflow: 'hidden' }}>
                          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                        </View>

                        {/* Informação Centralizada no Círculo: Svg Curvo + Odometer Giratório */}
                        <View style={{ position: 'absolute', zIndex: 10, width: 223, height: 223, alignItems: 'center', justifyContent: 'center' }}>
                          <Svg height="223" width="223" viewBox="0 0 223 223" style={{ position: 'absolute', top: 0, left: 0, transform: [{ rotate: '4.5deg' }] }}>
                            <Defs>
                              {/* Arco concêntrico guiando o topo do círculo. */}
                              <Path id="circleRoda" d="M 22.5, 111.5 A 89, 89 0 0, 1 200.5, 111.5" />
                            </Defs>
                            <SvgText fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="800" letterSpacing="3">
                              <TextPath href="#circleRoda" startOffset="50%" textAnchor="middle">
                                {dataFreshness.status === 'no_access' ? 'Privacidade Ativa' : dataFreshness.status === 'no_data' ? '' : dataFreshness.status === 'syncing' ? '' : 'ÚLTIMA AVALIAÇÃO HÁ'}
                              </TextPath>
                            </SvgText>
                          </Svg>

                          {dataFreshness.status === 'no_access' ? (
                            <Typography style={{ color: '#FF6060', fontSize: 13, fontWeight: '800', letterSpacing: 2 }}>{dataFreshness.label.toUpperCase()}</Typography>
                          ) : dataFreshness.status === 'no_data' || dataFreshness.status === 'syncing' ? (
                            <Typography style={{ color: dataFreshness.color, fontSize: 13, fontWeight: '800', letterSpacing: 2 }}>{dataFreshness.label.toUpperCase()}</Typography>
                          ) : (
                            <SlotMachineOdometer targetNumber={dataFreshness.daysSince ?? 0} />
                          )}

                          <View style={{ position: 'absolute', bottom: 36, alignItems: 'center' }}>
                            <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
                               {dataFreshness.temporalLabel}
                            </Typography>
                          </View>
                        </View>

                        {/* Old Green Overlay Was Removed */}

                        {/* Inner Bezel (Aro Fino Metálico 3D) */}
                        <View style={[StyleSheet.absoluteFill, {
                          borderRadius: 111.5,
                          borderWidth: 1.5,
                          borderTopColor: 'rgba(255,255,255,0.4)',
                          borderBottomColor: 'rgba(0,0,0,0.9)',
                          borderLeftColor: 'rgba(255,255,255,0.1)',
                          borderRightColor: 'rgba(0,0,0,0.6)',
                          opacity: 0.9
                        }]} pointerEvents="none" />
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 111.5, borderWidth: 3, borderColor: 'rgba(5,10,18,0.2)' }]} pointerEvents="none" />
                      </View>
                    </View>
                  </Animated.View>
                </View>
              </View>
            </Animated.View>
          );
        })()}

        {/* ── CONTEXTO EXPORTADO (Zona Discreta Premium) ── */}
        {exportedContexts.length > 0 && (
          <View style={{ position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', pointerEvents: 'box-none' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
              <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginRight: 8, textTransform: 'uppercase' }}>CONTEXTO</Typography>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {exportedContexts.slice(0, 3).map((ctx) => {
                  let displayStr = String(ctx.value);
                  if (typeof ctx.value === 'object' && ctx.value !== null) {
                    displayStr = ctx.value.label || ctx.value.status || ctx.key;
                  }
                  return (
                    <View key={ctx.id} style={{ backgroundColor: 'rgba(0,242,255,0.1)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(0,242,255,0.2)' }}>
                      <Typography style={{ color: '#00F2FF', fontSize: 10, fontWeight: '700' }}>
                        {displayStr}
                      </Typography>
                    </View>
                  );
                })}
                {exportedContexts.length > 3 && (
                   <View style={{ justifyContent: 'center', paddingHorizontal: 4 }}>
                      <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' }}>+{exportedContexts.length - 3}</Typography>
                   </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── DAILY SYNTHESIS (Briefing Operacional) ── */}
        <SynthesisActionCard 
           synthesis={dailySynthesis} 
           onAction={handleSynthesisAction} 
           style={{ position: 'absolute', bottom: 40, left: 24, right: 24 }} 
        />

        {/* ── LEFT EDGE HANDLE: THEMES ──────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.leftEdgeHandle}
          onPress={openThemes}
        >
          <View style={{ width: 136, height: 32, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-90deg' }] }}>
            <Typography variant="caption" style={{ fontSize: 11, color: 'rgba(255,255,255,0.95)', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
              LEITURA AI
            </Typography>
          </View>
        </TouchableOpacity>

        {/* ── RIGHT EDGE HANDLE: BIODATA ────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.rightEdgeHandle}
          onPress={openData}
        >
          <View style={{ width: 136, height: 32, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-90deg' }] }}>
            <Typography variant="caption" style={{ fontSize: 11, color: 'rgba(255,255,255,0.95)', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
              RESULTADOS
            </Typography>
          </View>
        </TouchableOpacity>

        {/* Trigger inside drawer now handles interactions */}
      </Animated.View>

      {/* ── BACKDROP: DRAWER BLUR (desfoca e suga 50% da luz do Home enquanto a gaveta App Place sobe) ── */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)', opacity: homeBlurBackdropOpacity, zIndex: 60 }]}
        pointerEvents="none"
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
      </Animated.View>


      {/* ── SIDE PANEL: THEMES (LEFT) ─────────────────────────────────────── */}
      <Animated.View style={[styles.sidePanel, styles.leftPanel, { transform: [{ translateX: themesAnim }] }]} pointerEvents={themesInteractive ? 'auto' : 'none'}>
        <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill}>
          {/* SCRIM DE ESCURECIMENTO ADICIONAL PARA CORTAR BLEED-THROUGH */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: -1 }]} />

          {/* ── Compact Header ── */}
          <View style={[styles.themePanelHeader, { minHeight: 56, paddingVertical: 8, paddingBottom: 4, alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Typography style={[styles.themePanelTitle, { fontSize: 13, marginBottom: 0 }]}>INTERPRETAÇÃO AI</Typography>
                  {user?.name && (
                    <View style={{ backgroundColor: 'rgba(0,242,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 }}>
                      <Typography style={{ color: '#00F2FF', fontWeight: '800', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                        {user.name.split(' ')[0]}
                      </Typography>
                    </View>
                  )}
                </View>
                {demoAnalysis && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                    <View style={{ backgroundColor: '#00F2FF20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#00F2FF40' }}>
                      <Typography style={{ color: '#00F2FF', fontSize: 9, fontWeight: 'bold' }}>MODO DEMO</Typography>
                    </View>
                    <TouchableOpacity onPress={handleExitDemo} style={{ marginLeft: 6, backgroundColor: 'rgba(255, 60, 60, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255, 60, 60, 0.3)' }}>
                      <Typography style={{ color: '#FF3C3C', fontSize: 9, fontWeight: 'bold' }}>X SAIR</Typography>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Typography style={[styles.themePanelTagline, { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }]}>Sinais em contexto.</Typography>
            </View>
            <TouchableOpacity
              onPress={closeThemes}
              style={[styles.themePanelClose, { padding: 16 }]}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <X size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
          
          {/* ── Temporal Context Header (Consistência com Dados) ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
              <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
                {dataFreshness.temporalLabel}
              </Typography>
            </View>

            <TouchableOpacity 
              onPress={() => setShowHistorico(true)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <History size={14} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
              <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>HISTÓRICO</Typography>
            </TouchableOpacity>
          </View>


          {/* ── Paginated FlatList ── */}
          {aiConfidence.level === 'insuficiente' ? (
             <StateSurface 
                type={dataFreshness.status === 'no_access' ? 'restricted' : 'insufficient'}
                title={aiConfidence.label}
                description={aiConfidence.rationale}
                actionLabel={dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.label : undefined}
                actionIntent={dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.intent : undefined}
                onAction={handleSynthesisAction}
                color={aiConfidence.color}
                style={{ flex: 1, marginHorizontal: 24, marginVertical: 30 }}
             />
          ) : (
            <View style={{ flex: 1 }}>
              {/* ── AI Confidence Readiness Banner ── */}
              <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: `${aiConfidence.color}08`, borderBottomWidth: 1, borderColor: `${aiConfidence.color}20` }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                     <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: aiConfidence.color, marginRight: 8, opacity: 0.8 }} />
                     <Typography style={{ color: aiConfidence.color, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', opacity: 0.9 }}>
                        {aiConfidence.label}
                     </Typography>
                 </View>
                 <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
                     {aiConfidence.rationale}
                 </Typography>

                 {/* Rendering Factors */}
                 <View style={{ gap: 4, marginBottom: 16 }}>
                    {aiConfidence.factors.positive.map((fp: string, i: number) => (
                       <View key={`pos-${i}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Typography style={{ color: '#00D4AA', fontSize: 11, fontWeight: '800', marginRight: 6 }}>✓</Typography>
                         <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{fp}</Typography>
                       </View>
                    ))}
                    {aiConfidence.factors.negative.map((fn: string, i: number) => (
                       <View key={`neg-${i}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Typography style={{ color: '#FFA500', fontSize: 10, fontWeight: '800', marginRight: 6 }}>✕</Typography>
                         <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{fn}</Typography>
                       </View>
                    ))}
                 </View>

                 {/* Action CTA */}
                 <TouchableOpacity 
                   onPress={() => {
                     const intent = aiConfidence.recommendedAction.intent;
                     if (intent === 'sync_now') {
                       useStore.getState().setIsMeasuring(true); closeThemes();
                     } else if (intent === 'open_context') {
                       alert('Aceda ao App Place na shell principal para autorizar contexto contínuo.');
                     } else if (intent === 'complete_profile') {
                       closeThemes(); setShowProfile(true);
                     } else if (intent === 'explore_analysis') {
                       themesFlatListRef.current?.scrollToIndex({ index: 1, animated: true });
                     }
                   }} 
                   style={{ alignSelf: 'flex-start', backgroundColor: `${aiConfidence.color}15`, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: `${aiConfidence.color}30` }}
                 >
                    <Typography style={{ color: aiConfidence.color, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{aiConfidence.recommendedAction.label}</Typography>
                 </TouchableOpacity>
              </View>

              <FlatList
                ref={themesFlatListRef}
            data={[
              { type: 'index' as const },
              ...semanticThemes.map((t: any, i: number) => ({ type: 'card' as const, theme: t, idx: i })),
              { type: 'index_clone' as const },
            ]}
            keyExtractor={(_, i) => String(i)}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const pageIndex = Math.round(e.nativeEvent.contentOffset.y / themesPanelHeight);
              // If user scrolled to the clone at the end, silently jump to page 0
              if (pageIndex === semanticThemes.length + 1) {
                themesFlatListRef.current?.scrollToIndex({ index: 0, animated: false });
              }
            }}
            getItemLayout={(_, index) => ({
              length: themesPanelHeight,
              offset: themesPanelHeight * index,
              index,
            })}
            renderItem={({ item }) => {
              const panelH = themesPanelHeight;

              // ── INDEX PAGE (page 0 and clone) ──
              if (item.type === 'index' || item.type === 'index_clone') {
                return (
                  <View style={[styles.themePage, { height: panelH }]}>
                    <ScrollView
                      contentContainerStyle={styles.themeIndexContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Top section: Status da Leitura (Indicação de Frescura) */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                        <Typography style={{ marginHorizontal: 16, color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
                          Últimas Análises
                        </Typography>
                        <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                      </View>


                      {(() => {
                        const hasCrossDomain = crossDomainSummary && crossDomainSummary.coherenceFlags && crossDomainSummary.coherenceFlags.length > 0;

                        let highestPriority: any = null;
                        const urgentOrActionable: any[] = [];
                        const stable: any[] = [];

                        semanticThemes.forEach((t: any, idx: number) => {
                          const isUrgent = t.band === 'poor' || t.band === 'fair' || t.status === 'stale' || t.status === 'unavailable' || t.status === 'insufficient_data';
                          const item = { ...t, originalIndex: idx + 1 };

                          if (isUrgent) {
                            if (!highestPriority && !hasCrossDomain) {
                              highestPriority = item;
                            } else if (!hasCrossDomain) {
                              const getWeight = (x: any) => {
                                if (x.band === 'poor') return 5;
                                if (x.status === 'stale' || x.status === 'unavailable') return 4;
                                if (x.status === 'insufficient_data') return 3;
                                if (x.band === 'fair') return 2;
                                return 1;
                              };
                              if (getWeight(item) > getWeight(highestPriority)) {
                                urgentOrActionable.push(highestPriority);
                                highestPriority = item;
                              } else {
                                urgentOrActionable.push(item);
                              }
                            } else {
                              urgentOrActionable.push(item);
                            }
                          } else {
                            stable.push(item);
                          }
                        });

                        // Se não houver CrossDomain nem Urgências, promover um estável a destaque.
                        if (!highestPriority && !hasCrossDomain && stable.length > 0) {
                          highestPriority = stable.shift();
                        }

                        const renderDomainBtn = (t: any) => {
                          const scoreColor =
                            t.score === undefined ? '#73BCFF'
                              : t.score >= 75 ? '#00F2FF'
                                : t.score >= 50 ? '#FFA500'
                                  : '#FF6060';
                          const IconCmp = ({ Activity, Zap, Target, Heart, Moon, Brain, User } as any)[t.iconName || 'Activity'] || Activity;
                          return (
                            <TouchableOpacity
                              key={t.domain}
                              style={styles.themeIndexBtn}
                              activeOpacity={0.7}
                              onPress={() => themesFlatListRef.current?.scrollToIndex({ index: t.originalIndex, animated: true })}
                            >
                              <View style={[styles.themeIndexBtnIcon, { borderColor: scoreColor + '40' }]}>
                                <IconCmp size={16} color={scoreColor} />
                              </View>
                              <Typography style={styles.themeIndexBtnTitle}>{t.title}</Typography>

                              {(t.status === 'stale' || t.status === 'unavailable' || t.status === 'insufficient_data') ? (
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                                  <Typography style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                                    {t.status === 'stale' ? 'Desatualizado' : (t.status === 'unavailable' ? 'Sem dados' : 'A Processar')}
                                  </Typography>
                                </View>
                              ) : (
                                <View style={[styles.themeIndexScore, { backgroundColor: scoreColor + '20', borderColor: scoreColor + '50' }]}>
                                  <Typography style={[styles.themeIndexScoreText, { color: scoreColor }]}>
                                    {t.score !== undefined ? t.score : t.textValue}
                                  </Typography>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        };

                        return (
                          <GatingOverlay
                            isBlocked={isGuestMode}
                            message="Inicie sessão para aceder à interpretação AI"
                            actionLabel="Entrar ou Criar Conta"
                            onAction={() => navigation.navigate('Welcome')}
                            style={{ width: '100%' }}
                          >
                          <View style={{ width: '100%' }}>
                            {/* ESTADO DE CARREGAMENTO / ERRO DA IA (M3) */}
                            {aiState.status === 'loading' && (
                              <View style={{ marginBottom: 24, padding: 32, backgroundColor: 'rgba(0, 242, 255, 0.03)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.15)', alignItems: 'center' }}>
                                <ActivityIndicator color="#00F2FF" size="small" style={{ marginBottom: 16 }} />
                                <Typography style={{ color: '#00F2FF', fontSize: 13, fontWeight: '700', letterSpacing: 1, textAlign: 'center' }}>
                                  INTERPRETANDO SINAIS...
                                </Typography>
                                <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                                  A cruzar padrões biográficos com a rede neuronal.
                                </Typography>
                              </View>
                            )}

                            {aiState.status === 'error' && (
                              <View style={{ marginBottom: 24, padding: 24, backgroundColor: 'rgba(255, 96, 96, 0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 96, 96, 0.2)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                  <X size={18} color="#FF6060" style={{ marginRight: 8 }} />
                                  <Typography style={{ color: '#FF6060', fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>FALHA NA ANÁLISE</Typography>
                                </View>
                                <Typography style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 16 }}>
                                  {aiState.error?.message || 'Não foi possível contactar o motor de IA.'}
                                </Typography>
                                <TouchableOpacity 
                                  onPress={() => semanticOutputService.loadAnalysis(activeAnalysis)}
                                  style={{ backgroundColor: 'rgba(255, 96, 96, 0.1)', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 96, 96, 0.2)' }}
                                >
                                  <Typography style={{ color: '#FF6060', fontWeight: '700', fontSize: 11 }}>TENTAR NOVAMENTE</Typography>
                                </TouchableOpacity>
                              </View>
                            )}

                            {/* BLOCO DE RESTRIÇÃO PRIVACIDADE */}
                            {!hasResultsAccess && (
                              <View style={{ marginBottom: 24, padding: 24, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center' }}>
                                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                  <Typography style={{ fontSize: 20 }}>🔒</Typography>
                                </View>
                                <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '800', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Privacidade Ativa</Typography>
                                <Typography style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12, lineHeight: 18 }}>Este membro configurou os seus dados fisiológicos e leitura contextual como visíveis apenas para Perfis autorizados.</Typography>
                              </View>
                            )}

                            {/* BLOCO A: Principal (FOCO PRINCIPAL M3) */}
                            {hasResultsAccess && aiState.status === 'ready' && aiState.status !== 'loading' && (
                              <View style={{ marginBottom: 24, padding: 24, backgroundColor: 'rgba(0, 242, 255, 0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.3)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Sparkles size={18} color="#00F2FF" style={{ marginRight: 8 }} />
                                    <Typography style={{ color: '#00F2FF', fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                      Foco Principal
                                    </Typography>
                                  </View>
                                  {aiState.meta && aiState.meta.model && (
                                    <Typography style={{ color: 'rgba(0, 242, 255, 0.4)', fontSize: 9, fontWeight: '700' }}>
                                      {aiState.meta.model.split('/')[1]?.toUpperCase() || aiState.meta.model.toUpperCase()}
                                    </Typography>
                                  )}
                                </View>
                                
                                <Typography style={{ color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 12 }}>
                                  {aiState.insight?.headline || "Síntese em Processamento"}
                                </Typography>
                                
                                <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 16 }}>
                                  {aiState.insight?.summary || "Estamos a fechar a leitura biográfica para esta análise."}
                                </Typography>

                                {aiState.insight?.suggestions && aiState.insight.suggestions.length > 0 && (
                                  <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.1)' }}>
                                    <Typography style={{ color: '#00F2FF', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: '700' }}>
                                      Prioridade Sugerida
                                    </Typography>
                                    <Typography style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 19 }}>
                                      {aiState.insight.suggestions[0]}
                                    </Typography>
                                  </View>
                                )}
                              </View>
                            )}

                            {/* Caso a IA ainda esteja em IDLE e não haja CrossDomain (Fallback) */}
                            {hasResultsAccess && aiState.status === 'idle' && hasCrossDomain && (
                              <View style={{ marginBottom: 24, padding: 20, backgroundColor: 'rgba(0, 242, 255, 0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.3)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                  <Zap size={18} color="#00F2FF" style={{ marginRight: 8 }} />
                                  <Typography style={{ color: '#00F2FF', fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                    Foco Principal
                                  </Typography>
                                </View>
                                <Typography style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 16 }}>
                                  {crossDomainSummary.prioritySignals[0] || crossDomainSummary.summary}
                                </Typography>
                              </View>
                            )}
                            {hasResultsAccess && highestPriority ? (
                              <TouchableOpacity
                                style={{ marginBottom: 24, padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center' }}
                                activeOpacity={0.7}
                                onPress={() => themesFlatListRef.current?.scrollToIndex({ index: highestPriority.originalIndex, animated: true })}
                              >
                                <View style={{ flex: 1, paddingRight: 16 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Target size={18} color="rgba(255,255,255,0.8)" style={{ marginRight: 8 }} />
                                    <Typography style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Foco do Dia</Typography>
                                  </View>
                                  <Typography style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>{highestPriority.title}</Typography>
                                  <Typography style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }} numberOfLines={3}>{highestPriority.paragraph1}</Typography>
                                </View>

                                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                                  <Typography style={{ color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center' }}>Direção</Typography>
                                  <Typography style={{ color: '#fff', fontSize: 16, marginTop: -2 }}>→</Typography>
                                </View>
                              </TouchableOpacity>
                            ) : null}

                            {/* BLOCO B: Necessitam Atenção / Ação */}
                            {hasResultsAccess && urgentOrActionable.length > 0 && (
                              <View style={{ marginBottom: 24 }}>
                                <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>
                                  Requerem Atenção
                                </Typography>
                                <View style={styles.themeIndexList}>
                                  {urgentOrActionable.map(t => renderDomainBtn(t))}
                                </View>
                              </View>
                            )}

                            {/* BLOCO C: Estáveis (Recolhidos) */}
                            {hasResultsAccess && stable.length > 0 && (
                              <View style={{ marginTop: 8, marginBottom: 24 }}>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => setStableExpanded(!stableExpanded)}
                                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                                >
                                  <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' }}>Sinais Estáveis ({stable.length})</Typography>
                                  <ChevronDown size={18} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: stableExpanded ? '180deg' : '0deg' }] }} />
                                </TouchableOpacity>

                                {stableExpanded && (
                                  <View style={styles.themeIndexList}>
                                    {stable.map(t => renderDomainBtn(t))}
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </GatingOverlay>
                        );
                      })()}

                      {/* Bottom section: hint */}

                      <Typography style={styles.themeIndexHint}>↓  deslize para explorar</Typography>
                    </ScrollView>
                  </View>
                );
              }

              // ── THEME CARD PAGE ──
              const { theme: t, idx } = item;
              
              let tAction = { intent: 'none', label: '', reason: '', isAvailable: false };
              if (dataFreshness.status === 'no_access') {
                 tAction = { intent: 'none', label: 'Gerir Permissões', reason: 'Acesso restrito à pool de biomarcadores', isAvailable: false };
              } else if (t.status === 'insufficient_data' || dataFreshness.status === 'no_data') {
                 tAction = { intent: 'sync_now', label: 'Sincronizar Recolha', reason: 'A IA carece de mais eventos para tradução limpa', isAvailable: true };
              } else if (t.status === 'stale') {
                 tAction = { intent: 'sync_now', label: 'Atualizar Biomarcadores', reason: 'Contexto em modo estático/degradado', isAvailable: true };
              } else if (t.trend && (t.trend === 'improving' || t.trend === 'worsening')) {
                 tAction = { intent: 'view_trend', label: 'Analisar Desvio Factual', reason: 'O sistema sinaliza uma variação orgânica latente', isAvailable: true };
              } else if (t.domain && exportedContexts.some((c: any) => c.key && t.domain && String(c.key).toLowerCase().includes(String(t.domain).toLowerCase()))) {
                 tAction = { intent: 'open_context', label: 'Recorrer a Contexto de Integração', reason: 'Esta área possui uma fonte externa subscrita com metadados', isAvailable: true };
              } else {
                 tAction = { intent: 'explore_detail', label: 'Rever Fisiologia Crua', reason: 'Monitorização estagnada no baseline orgânico esperado', isAvailable: true };
              }

              return (
                <View style={[styles.themePage, { height: panelH }]}>
                  <View style={styles.themeCardPageInner}>
                    {/* STICKY TOP BAR */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'transparent' }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => themesFlatListRef.current?.scrollToIndex({ index: 0, animated: true })}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                      >
                        <ArrowLeft size={16} color="#00F2FF" style={{ marginRight: 6 }} />
                        <Typography style={{ color: '#00F2FF', fontSize: 13, fontWeight: '700' }}>Índice</Typography>
                      </TouchableOpacity>

                      <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '800' }}>{t.title}</Typography>

                      <View style={{ width: 80, alignItems: 'flex-end' }}>
                        <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }}>{idx + 1} / {semanticThemes.length}</Typography>
                      </View>
                    </View>

                    {/* The actual card — scrollable inside its page */}
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      <ThemeCard
                        {...t}
                        iconName={t.iconName as any}
                        suggestedAction={tAction as any}
                        onCtaPress={(intent: string) => {
                          if (intent === 'sync_now') {
                             closeThemes();
                             setTimeout(() => handleSynthesisAction('sync_now'), 300);
                          } else if (intent === 'explore_detail' || intent === 'view_trend') {
                             setDataOpen(true);
                          } else if (intent === 'open_context') {
                            const routeMap: Record<string, string> = { sleep: 'sleep-deep', nutrition: 'nutri-menu' };
                            const appId = t.domain ? routeMap[t.domain] : null;
                            if (appId) {
                               const { MINI_APP_CATALOG } = require('../miniapps/catalog');
                               const app = MINI_APP_CATALOG.find((a: any) => a.id === appId);
                               if (app) {
                                 launchApp(app);
                                 if (Platform.OS === 'web') setInlineApp(app);
                                 else navigation?.navigate('MiniApp', { app });
                               }
                            } else {
                               setDataOpen(true);
                            }
                          }
                        }}
                      />
                    </ScrollView>
                  </View>
                </View>
              );
            }}
          />
            </View>
          )}
        </BlurView>
      </Animated.View>

      {/* ── SIDE PANEL: DATA (RIGHT) ──────────────────────────────────────── */}
      {(() => {
        // ── Painel Resultados — lê directamente de activeAnalysis ─────────────
        const src = activeAnalysis?.measurements ?? [];
        const isDemo = activeAnalysis?.source === 'demo';

        // Carrega catálogo estático completo
        const allDefs = getAllMetricsDefinitions();

        // ── Camada Fechada de Mapping Legacy -> Canonical ──
        // Interceta labels antigas isoladamente sem poluir o pipeline visual.
        const LEGACY_MAP: Record<string, string> = {
          'Sódio': 'sodium',
          'Hidratação': 'sodium', 
          'Oxidação (MDA)': 'f2_isoprostanes',
          'Leucócitos': 'nitrites', 
          'VFC (HRV)': 'hrv',
          'Ritmo Sinusal': 'ecg',
          'Variação T. Basal': 'temp',
          'Estabilidade': 'weight'
        };

        const getCanonicalKey = (m: any): string => {
          if (m.metricKey) return m.metricKey;
          if (m.id && allDefs.some(d => d.key === m.id)) return m.id;
          if (m.marker && LEGACY_MAP[m.marker]) return LEGACY_MAP[m.marker];
          const exactMatch = allDefs.find(d => d.label === m.marker);
          return exactMatch ? exactMatch.key : '';
        };

        // Estabilização: Indexação O(1) precoce p/ a pipeline de render
        const normalizedMeasurements = src.reduce((acc: Record<string, any>, m: any) => {
          const k = getCanonicalKey(m);
          if (k) acc[k] = m;
          return acc;
        }, {});

        const prevMeasurements = (prevAnalysis?.measurements || []).reduce((acc: Record<string, any>, m: any) => {
          const k = getCanonicalKey(m);
          if (k) acc[k] = m;
          return acc;
        }, {});

        const buildSection = (catFilter: MetricCategory[], label: string, color: string, id: string, shortLabel: string) => {
          // Filtra pelo que deve ser visível por omissão na categoria especificada
          const sectionDefs = allDefs.filter(d => catFilter.includes(d.category) && d.visibleByDefault);
          
          const markers = sectionDefs.map(def => {
            // Consulta limpa sem array scans em loops render - lookup garantida
            const found = normalizedMeasurements[def.key];

            const status: MetricObservationStatus = found 
              ? (isDemo ? 'demo_value' : 'available')
              : 'empty';

            let trend = undefined;
            const prev = prevMeasurements[def.key];
            
            if (found && prev && typeof found.value !== 'undefined' && typeof prev.value !== 'undefined' && def.valueType === 'number') {
               const curV = Number(found.value);
               const prevV = Number(prev.value);
               if (!isNaN(curV) && !isNaN(prevV)) {
                  const diff = curV - prevV;
                  const absDiff = Math.abs(diff);
                  let priority: 'noise' | 'discrete' | 'relevant' | 'critical' = 'noise';
                  
                  if (absDiff < 0.001) {
                     priority = 'noise';
                  } else {
                     const pct = prevV !== 0 ? (absDiff / Math.abs(prevV)) * 100 : 100;
                     if (pct < 2) priority = 'discrete';
                     else if (pct < 10) priority = 'relevant';
                     else priority = 'critical';
                  }

                  if (absDiff < 0.001) {
                     trend = { direction: 'stable', diffLabel: 'Estável', priority };
                  } else if (diff > 0) {
                     trend = { direction: 'up', diffLabel: 'Subiu face à última leitura', priority };
                  } else {
                     trend = { direction: 'down', diffLabel: 'Desceu face à última leitura', priority };
                  }
               }
            }

            return {
              isCanonical: true,
              definition: def,
              observation: {
                metricKey: def.key,
                status,
                value: found?.value,
                mode: isDemo ? 'demo' : 'real',
                measuredAt: found?.recordedAt ? new Date(found.recordedAt).getTime() : undefined,
                source: found?.source || activeAnalysis?.source || 'device',
                trend
              } as MetricObservation
            };
          });

          return { label, color, markers, id, shortLabel };
        };

        const factualBioCategories = [
          buildSection(['urine'], 'Análises de Urina', '#00F2FF', 'U', 'Urina'),
          buildSection(['vitals', 'signals'], 'Monitorização Fisiológica', '#00D4AA', 'S', 'Fisiológica'),
          buildSection(['fecal'], 'Avaliação Fecal', '#FFA500', 'F', 'Fecal'),
          {
            label: 'Sinais do Ecossistema',
            color: '#FFD700',
            id: 'E',
            shortLabel: 'Ecossistema',
            markers: (activeAnalysis?.ecosystemFacts ?? []).map(f => ({
              isLegacy: true,
              name: String(f.type).replace(/_/g, ' ').toUpperCase(),
              value: f.value,
              unit: f.sourceAppId,
            }))
          },
        ].filter(c => c.id === 'E' || selectedGroups.includes(c.id));

        // Previne crashes de índices se o utilizador desmarcar uma aba com o index maior selecionado.
        const safeBioTab = bioTab >= factualBioCategories.length ? 0 : bioTab;

        return dataOpen ? (
          <Animated.View style={[styles.sidePanel, styles.rightPanel, { transform: [{ translateX: dataAnim }], backgroundColor: '#020306' }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020306' }]} />
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
              {/* ── LINHA 1 — CABEÇALHO ── */}
              <View style={[styles.panelHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 8, marginBottom: 0, minHeight: 40, paddingHorizontal: 24 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Typography style={[styles.panelTitle, { fontSize: 13, fontWeight: '800', marginVertical: 0, textTransform: 'uppercase', letterSpacing: 1.5 }]}>Resultados</Typography>
                  {user?.name && (
                    <View style={{ backgroundColor: 'rgba(0,242,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 }}>
                      <Typography style={{ color: '#00F2FF', fontWeight: '800', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                        {user.name.split(' ')[0]}
                      </Typography>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={closeData}
                  style={{ padding: 8, marginRight: -8 }}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <X size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>

                {/* Script de limpeza para remover artefatos de debug (Getting DOM...) no browser */}
                {Platform.OS === 'web' && (
                  <View style={{ display: 'none' }}>
                    <ActivityIndicator
                      onLayout={() => {
                        if (typeof window !== 'undefined') {
                          const clean = () => {
                            const entries = document.querySelectorAll('*');
                            entries.forEach(el => {
                              if (el.textContent && (el.textContent.includes('Getting DOM') || el.textContent.includes('browser_get_dom'))) {
                                el.remove();
                              }
                            });
                          };
                          clean();
                          setTimeout(clean, 1000);
                        }
                      }}
                    />
                  </View>
                )}
              </View>

              {/* ── LINHA 2 — BARRA DE AÇÕES ── */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowHistorico(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <History size={12} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
                    <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>HISTÓRICO</Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowExportModal(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Share size={12} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
                    <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>EXPORTAR</Typography>
                  </TouchableOpacity>
                </View>

                {/* TEMPORAL LABEL METADATA  */}
                <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'right', flexShrink: 1, marginLeft: 8 }}>
                  {dataFreshness.temporalLabel}
                </Typography>
              </View>

              {/* ── Tab Bar ── */}
              <View style={[styles.bioTabBar, { marginTop: 0, paddingVertical: 4, marginBottom: 0 }]}>
                {factualBioCategories.map((cat, i) => {
                  const isActive = safeBioTab === i;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.bioTabBtn, isActive && { backgroundColor: `${cat.color}15`, borderColor: `${cat.color}40` }]}
                      onPress={() => setBioTab(i)}
                      activeOpacity={0.7}
                    >
                      <Typography style={[
                        styles.bioTabLabel,
                        isActive ? { color: cat.color, fontWeight: '800' } : { color: 'rgba(255,255,255,0.4)' }
                      ]}>
                        {cat.shortLabel}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Active Tab Content ── */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelScroll}>
                {!hasResultsAccess ? (
                   <StateSurface 
                      type="restricted"
                      title="Acesso Restrito"
                      description="Os resultados e painel vitúrgico não foram explicitamente partilhados consigo."
                      actionLabel={dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.label : undefined}
                      actionIntent={dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.intent : undefined}
                      onAction={handleSynthesisAction}
                      color="#FF6060"
                      style={{ margin: 20 }}
                   />
                ) : factualBioCategories.length > 0 ? (
                  factualBioCategories[safeBioTab].markers.length > 0 ? (
                    factualBioCategories[safeBioTab].markers.map((item: any, i: number) => {
                      if (item.isLegacy) {
                        return (
                          <View key={i} style={styles.bioRow}>
                            <Typography style={styles.bioName}>{item.name}</Typography>
                            <View style={styles.bioValueArea}>
                              <Typography style={styles.bioVal}>{item.value}</Typography>
                              {item.unit ? <Typography variant="caption" style={styles.bioUnit}>{item.unit}</Typography> : null}
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View key={item.definition.key} style={{ paddingHorizontal: 24, marginBottom: 8 }}>
                          <MetricCard 
                            definition={item.definition}
                            observation={item.observation}
                            onExploreSemantics={() => { closeData(); openThemes(); }}
                          />
                        </View>
                      );
                    })
                  ) : (
                    <StateSurface 
                       type={dataFreshness.status === 'syncing' ? 'no_data' : 'insufficient'}
                       title={dataFreshness.label.toUpperCase()}
                       description={dataFreshness.status === 'syncing' ? 'Por favor aguarde enquanto processamos a leitura.' : 'Não existem leituras válidas para esta categoria nesta janela local.'}
                       actionLabel={dataFreshness.status !== 'syncing' && dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.label : undefined}
                       actionIntent={dataFreshness.status !== 'syncing' && dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.intent : undefined}
                       onAction={handleSynthesisAction}
                       color={dataFreshness.color}
                       style={{ margin: 20 }}
                    />
                  )
                ) : (
                  <StateSurface 
                     type="no_data"
                     title={dataFreshness.label.toUpperCase()}
                     description="Ao contrário do painel visual, aguardamos fluxo fisiológico limpo."
                     actionLabel={dataFreshness.status !== 'syncing' && dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.label : undefined}
                     actionIntent={dataFreshness.status !== 'syncing' && dailySynthesis.action.intent !== 'wait' ? dailySynthesis.action.intent : undefined}
                     onAction={handleSynthesisAction}
                     color={dataFreshness.status === 'no_data' || dataFreshness.status === 'very_stale' ? '#FF6060' : 'rgba(255,255,255,0.2)'}
                     style={{ margin: 20 }}
                  />
                )}
              </ScrollView>



            </BlurView>
          </Animated.View>
        ) : null;
      })()}
      {/* ── BOTTOM DRAWER: APPS ───────────────────────────────────────────── */}
      <Animated.View
        ref={drawerHandleRef}
        style={[styles.appDrawer, { transform: [{ translateY: drawerAnim }] }]}
      >
        {/* Background da Drawer empurrado 32px para baixo para deixar a aba exposta fisicamente sem 'cartão verde' por trás dela */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: drawerBgOpacity, top: 32 }]}>
          <View style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }]}>
            {Platform.OS !== 'web' && (() => {
              const { Video: NV, ResizeMode: RM } = require('expo-av');
              return (
                <NV
                  source={require('../../assets/video.mp4')}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode={RM.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                />
              );
            })()}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5, 15, 25, 0.65)' }]} pointerEvents="none" />
          </View>
        </Animated.View>

        <Animated.View style={{ flex: 1, width: '100%', opacity: drawerInnerOpacity }}>
          <View style={{ zIndex: 10, width: '100%', backgroundColor: 'transparent' }}>
            {/* Frizo continuo que liga as laterais limpas diretamente à aba central */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%' }}>
              <View style={{ flex: 1, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} />
              <TouchableOpacity
                {...drawerPanResponder.panHandlers}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 40,
                  paddingTop: 10, // Torna a aba inferior e mais justa superiormente (tocado pelo utilizador)
                  paddingBottom: 4,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderWidth: 1,
                  borderBottomWidth: 0,
                  borderColor: 'rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent' // Limpo e sem cartão verde
                }}
                activeOpacity={Platform.OS === 'web' ? 0.7 : 1}
                onPress={Platform.OS === 'web' ? () => {
                  const isDown = lastDrawerY.current >= DRAWER_DOWN / 2;
                  const toValue = isDown ? DRAWER_UP : DRAWER_DOWN;
                  Animated.spring(drawerAnim, { toValue, bounciness: 0, useNativeDriver: false })
                    .start(() => { lastDrawerY.current = toValue; });
                } : undefined}
              >
                <Typography variant="caption" style={[styles.drawerTitle, { color: 'rgba(255,255,255,0.9)', fontSize: 11 }]}>APP PLACE</Typography>
              </TouchableOpacity>
              <View style={{ flex: 1, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} />
            </View>

            <Animated.View style={{ paddingBottom: 20 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.appGrid, { justifyContent: 'flex-start' }]}
                decelerationRate="fast"
                snapToInterval={width / 3}
              >
                {MINI_APP_CATALOG.filter(app => installedAppIds.includes(app.id)).map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.appItem, { width: width / 3 }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      launchApp(app);
                      if (Platform.OS === 'web') {
                        setInlineApp(app);
                      } else {
                        navigation?.navigate('MiniApp', { app });
                      }
                    }}
                  >
                    <View style={{ position: 'relative' }}>
                      <View style={[styles.appIconContainer, {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 28,
                        width: 56,
                        height: 56,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }]}>
                        <Typography style={{ fontSize: 24 }}>{app.iconEmoji}</Typography>
                      </View>
                    </View>
                    <Typography variant="caption" style={[styles.appName, { textAlign: 'center', lineHeight: 12, marginTop: 8 }]}>{app.name}</Typography>
                  </TouchableOpacity>
                ))}
                {installedAppIds.length === 0 && (
                  <View style={{ width, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
                      Nenhuma app instalada.
                    </Typography>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </View>

          <Animated.View style={{ flex: 1, width: '100%' }}>
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            >
              <Typography variant="h3" style={styles.sectionTitle}>Principais</Typography>
              <View style={styles.downloadList}>
                {/* Todas as apps — install/uninstall dinâmico */}
                {/* PRIMEIRAS 4 APPS: Focus Módulos */}
                {(() => {
                  const apps = [
                    { id: 'sleep-deep', title: '_deep sleep', desc: 'Integração Profunda de Sono', icon: <Moon size={22} color="#00F2FF" /> },
                    { id: 'nutri-menu', title: '_Meal planner', desc: 'Nutrição Personalizada', icon: <Utensils size={22} color="#00D4AA" /> },
                    { id: '_cardio', title: '_motion', desc: 'Saúde Cardiovascular Ativa', icon: <Dumbbell size={22} color="#00F2FF" opacity={0.6} /> },
                    { id: '_mind', title: '_introspect', desc: 'Foco e Meditação Profunda', icon: <Brain size={22} color="#00F2FF" opacity={0.6} /> },
                  ];

                  return apps.map(({ id, title, desc, icon }) => {
                    const isInstalled = installedAppIds.includes(id);
                    const isReal = !id.startsWith('_');
                    const isExpanded = expandedAppId === id;

                    return (
                      <View key={id} style={[styles.downloadRow, isExpanded && { flexDirection: 'column', alignItems: 'stretch', backgroundColor: 'rgba(30,35,45,0.7)', paddingBottom: 16, borderLeftWidth: 2, borderLeftColor: '#00F2FF', padding: 16 }]}>
                        
                        {/* BLOCO 1 — CABEÇALHO (Em linha) */}
                        <View style={[{ flexDirection: 'row', alignItems: 'center' }, !isExpanded && { flex: 1 }]}>
                          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} activeOpacity={isInstalled && isReal ? 0.7 : 1} onPress={() => {
                            if (isInstalled && isReal) {
                              const manifest = MINI_APP_CATALOG.find((m: any) => m.id === id);
                              if (manifest) {
                                launchApp(manifest);
                                if (Platform.OS === 'web') setInlineApp(manifest);
                                else navigation?.navigate('MiniApp', { app: manifest });
                              }
                            }
                          }}>
                            <View style={[styles.rowIcon, isExpanded && { backgroundColor: 'rgba(0,0,0,0.4)', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }]}>{icon}</View>
                            <View style={[styles.rowInfo, isExpanded && { marginLeft: 16 }]}>
                              <Typography style={[styles.rowTitle, isExpanded && { fontSize: 16, fontWeight: '900', color: '#fff' }]}>{title}</Typography>
                              <Typography variant="caption" style={[styles.rowDesc, isExpanded && { fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 2 }]}>{desc}</Typography>
                              {isExpanded && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, opacity: 0.9 }}>
                                  {[1,2,3,4,5].map(i => <Star key={i} size={10} color="#FFD700" fill={i === 5 ? "transparent" : "#FFD700"} style={{ marginRight: 2 }} />)}
                                  <Typography style={{ color: '#FFD700', fontSize: 11, marginLeft: 4, fontWeight: 'bold' }}>4.8</Typography>
                                  <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 8 }}>ablute_</Typography>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>

                          <View style={styles.rowActions}>
                            <TouchableOpacity 
                              style={[styles.actionBtn, { width: 56, paddingHorizontal: 0 }]} 
                              onPress={() => isExpanded ? setExpandedAppId(null) : setExpandedAppId(id)}
                            >
                              <Typography style={styles.actionText}>{isExpanded ? 'VER −' : 'VER +'}</Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionBtn, isInstalled ? styles.uninstallBtn : styles.installBtn, !isReal && { opacity: 0.4 }, { width: 88, paddingHorizontal: 0 }]}
                              onPress={() => {
                                if (!isReal) return;
                                if (isInstalled) {
                                  uninstallApp(id);
                                } else {
                                  useStore.getState().installApp(id);
                                  const manifest = MINI_APP_CATALOG.find((m: any) => m.id === id);
                                  if (manifest && Platform.OS === 'web') setInlineApp(manifest);
                                  else if (manifest) navigation?.navigate('MiniApp', { app: manifest });
                                }
                              }}
                            >
                              <Typography style={[styles.actionText, isInstalled ? styles.uninstallText : styles.installText]}>
                                {isInstalled ? 'ABRIR' : 'INSTALAR'}
                              </Typography>
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        {/* BLOCO 2, 3 e 4 — CONSTRUÇÃO DO CARD DE INFO */}
                        {isExpanded && (
                          <View style={{ marginTop: 20, width: '100%' }}>
                            {/* BLOCO 2 - PREVIEWS MOCK / REAL */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -4 }}>
                              {id === 'nutri-menu' ? (
                                <>
                                  <Image source={require('../../assets/meal_planner/plano.png')} style={{ width: 140, height: 200, borderRadius: 8, marginHorizontal: 4, resizeMode: 'cover' }} />
                                  <Image source={require('../../assets/meal_planner/receitas.png')} style={{ width: 140, height: 200, borderRadius: 8, marginHorizontal: 4, resizeMode: 'cover' }} />
                                  <Image source={require('../../assets/meal_planner/ingredientes.png')} style={{ width: 140, height: 200, borderRadius: 8, marginHorizontal: 4, resizeMode: 'cover' }} />
                                  <Image source={require('../../assets/meal_planner/agregado.png')} style={{ width: 140, height: 200, borderRadius: 8, marginHorizontal: 4, resizeMode: 'cover' }} />
                                </>
                              ) : (
                                <>
                                  <View style={{ width: 140, height: 80, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                    <View style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 4 }} />
                                    <Typography style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800' }}>PREVIEW 1</Typography>
                                  </View>
                                  <View style={{ width: 140, height: 80, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                    <View style={{ position: 'absolute', top: 4, left: 4, width: '60%', height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
                                    <View style={{ position: 'absolute', bottom: 4, right: 4, width: '30%', height: 20, backgroundColor: 'rgba(0,212,170,0.1)', borderRadius: 4 }} />
                                    <Typography style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800' }}>STAT OVERVIEW</Typography>
                                  </View>
                                  <View style={{ width: 140, height: 80, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                    <View style={{ position: 'absolute', top: '10%', bottom: '10%', left: '40%', right: '40%', backgroundColor: 'rgba(0,242,255,0.05)', borderRadius: 20 }} />
                                    <Typography style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800' }}>DATA SYNC</Typography>
                                  </View>
                                </>
                              )}
                            </ScrollView>

                            {/* BLOCO 3 - DESCRIÇÃO */}
                            <Typography variant="caption" numberOfLines={4} style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 18, marginBottom: 12 }}>
                              Módulo interativo integrado com a IA de predição de bem-estar. Permite o cruzamento de dados biométricos em tempo real, fornecendo visualizações ricas e criação de parâmetros ajustados para alavancar a tua performance diária e qualidade de vida.
                            </Typography>
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}

                <Typography variant="h3" style={[styles.sectionTitle, { marginTop: 20, marginBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }]}>Mais apps</Typography>
                
                {/* RESTANTES APPS */}
                {(() => {
                  const otherApps = [
                    { id: 'femmhealth', title: '_Fem sanctuary', desc: 'Saúde Feminina', icon: <View style={{ flexDirection: 'row', alignItems: 'center' }}><Typography style={{ color: '#FF6FBA', fontSize: 22, fontWeight: '800' }}>♀</Typography><Typography style={{ color: '#FF6FBA', fontSize: 16, fontWeight: '900', marginLeft: 2 }}>H</Typography></View> },
                    { id: 'longevity-secrets', title: '_Healthspan', desc: 'Longevidade & Bem-estar', icon: <Sparkles size={22} color="#FFD700" /> },
                    { id: '_hydra', title: 'HydraTrack', desc: 'Gestão de Água', icon: <Droplet size={22} color="#00F2FF" opacity={0.6} /> },
                    { id: '_fasting', title: 'Fasting', desc: 'Jejum Intermitente', icon: <Activity size={22} color="#00F2FF" opacity={0.6} /> },
                    { id: '_macro', title: 'MacroTrack', desc: 'Nutrição Detalhada', icon: <Target size={22} color="#00F2FF" opacity={0.6} /> },
                  ];

                  return otherApps.map(({ id, title, desc, icon }) => {
                    const isInstalled = installedAppIds.includes(id);
                    const isReal = !id.startsWith('_');
                    const isExpanded = expandedAppId === id;

                    return (
                      <View key={id} style={[styles.downloadRow, isExpanded && { flexDirection: 'column', alignItems: 'stretch', backgroundColor: 'rgba(30,35,45,0.7)', paddingBottom: 16, borderLeftWidth: 2, borderLeftColor: '#00F2FF', padding: 16 }]}>
                        
                        {/* BLOCO 1 — CABEÇALHO (Em linha) */}
                        <View style={[{ flexDirection: 'row', alignItems: 'center' }, !isExpanded && { flex: 1 }]}>
                          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} activeOpacity={isInstalled && isReal ? 0.7 : 1} onPress={() => {
                            if (isInstalled && isReal) {
                              const manifest = MINI_APP_CATALOG.find((m: any) => m.id === id);
                              if (manifest) {
                                launchApp(manifest);
                                if (Platform.OS === 'web') setInlineApp(manifest);
                                else navigation?.navigate('MiniApp', { app: manifest });
                              }
                            }
                          }}>
                            <View style={[styles.rowIcon, isExpanded && { backgroundColor: 'rgba(0,0,0,0.4)', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }]}>{icon}</View>
                            <View style={[styles.rowInfo, isExpanded && { marginLeft: 16 }]}>
                              <Typography style={[styles.rowTitle, isExpanded && { fontSize: 16, fontWeight: '900', color: '#fff' }]}>{title}</Typography>
                              <Typography variant="caption" style={[styles.rowDesc, isExpanded && { fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 2 }]}>{desc}</Typography>
                              {isExpanded && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, opacity: 0.9 }}>
                                  {[1,2,3,4,5].map(i => <Star key={i} size={10} color="#FFD700" fill={i === 5 ? "transparent" : "#FFD700"} style={{ marginRight: 2 }} />)}
                                  <Typography style={{ color: '#FFD700', fontSize: 11, marginLeft: 4, fontWeight: 'bold' }}>4.8</Typography>
                                  <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 8 }}>ablute_</Typography>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>

                          <View style={styles.rowActions}>
                            <TouchableOpacity 
                              style={[styles.actionBtn, { width: 56, paddingHorizontal: 0 }]} 
                              onPress={() => isExpanded ? setExpandedAppId(null) : setExpandedAppId(id)}
                            >
                              <Typography style={styles.actionText}>{isExpanded ? 'VER −' : 'VER +'}</Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionBtn, isInstalled ? styles.uninstallBtn : styles.installBtn, !isReal && { opacity: 0.4 }, { width: 88, paddingHorizontal: 0 }]}
                              onPress={() => {
                                if (!isReal) return;
                                if (isInstalled) {
                                  uninstallApp(id);
                                } else {
                                  useStore.getState().installApp(id);
                                  const manifest = MINI_APP_CATALOG.find((m: any) => m.id === id);
                                  if (manifest && Platform.OS === 'web') setInlineApp(manifest);
                                  else if (manifest) navigation?.navigate('MiniApp', { app: manifest });
                                }
                              }}
                            >
                              <Typography style={[styles.actionText, isInstalled ? styles.uninstallText : styles.installText]}>
                                {isInstalled ? 'ABRIR' : 'INSTALAR'}
                              </Typography>
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        {/* BLOCO 2, 3 e 4 — CONSTRUÇÃO DO CARD DE INFO */}
                        {isExpanded && (
                          <View style={{ marginTop: 20, width: '100%' }}>
                            {/* BLOCO 2 - PREVIEWS MOCK */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -4 }}>
                              <View style={{ width: 140, height: 80, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                <View style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 4 }} />
                                <Typography style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800' }}>PREVIEW 1</Typography>
                              </View>
                              <View style={{ width: 140, height: 80, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                <View style={{ position: 'absolute', top: 4, left: 4, width: '60%', height: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
                                <View style={{ position: 'absolute', bottom: 4, right: 4, width: '30%', height: 20, backgroundColor: 'rgba(0,212,170,0.1)', borderRadius: 4 }} />
                                <Typography style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800' }}>STAT OVERVIEW</Typography>
                              </View>
                              <View style={{ width: 140, height: 80, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                <View style={{ position: 'absolute', top: '10%', bottom: '10%', left: '40%', right: '40%', backgroundColor: 'rgba(0,242,255,0.05)', borderRadius: 20 }} />
                                <Typography style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800' }}>DATA SYNC</Typography>
                              </View>
                            </ScrollView>

                            {/* BLOCO 3 - DESCRIÇÃO */}
                            <Typography variant="caption" numberOfLines={4} style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 18, marginBottom: 12 }}>
                              Módulo interativo integrado com a IA de predição de bem-estar. Permite o cruzamento de dados biométricos em tempo real, fornecendo visualizações ricas e criação de parâmetros ajustados para alavancar a tua performance diária e qualidade de vida.
                            </Typography>
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>

            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* ── TOKENS MODAL ─────────────────────────────────────────────────── */}
      <Modal visible={showTokens} transparent animationType="fade" onRequestClose={() => setShowTokens(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setShowTokens(false)}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5, 10, 18, 0.75)' }]} />
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={80} tint="dark" style={[styles.modalContent, { alignItems: 'center', borderColor: 'rgba(255,255,255,0.15)' }]}>
              <View style={[styles.modalHeader, { width: '100%', marginBottom: 16 }]}>
                <Typography variant="h2" style={styles.modalTitle}>Gestão de Tokens</Typography>
                <TouchableOpacity onPress={() => setShowTokens(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 20, alignItems: 'center', width: '100%' }}>
                <Image source={require('../../assets/token abl.png')} style={{ width: 48, height: 48, resizeMode: 'contain', tintColor: '#fff', marginBottom: 16, opacity: 0.5 }} />
                <Typography style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>A gestão autónoma de tokens estará disponível em atualizações futuras.</Typography>
              </View>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── PROFILE MODAL ─────────────────────────────────────────────────── */}
      <Modal visible={showProfile} transparent animationType="fade" onRequestClose={() => setShowProfile(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setShowProfile(false)}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5, 10, 18, 0.75)' }]} />
          
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={80} tint="dark" style={[styles.modalContent, { maxHeight: height * 0.8, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}>
              <View style={styles.modalHeader}>
                <Typography variant="h2" style={styles.modalTitle}>Editar Perfil</Typography>
                <TouchableOpacity onPress={() => setShowProfile(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                {/* A. Cabeçalho */}
                <View style={[styles.profileInfo, { marginBottom: 24, flexDirection: 'column', alignItems: 'center' }]}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 242, 255, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00F2FF', marginBottom: 12 }}>
                    <Typography style={{ color: '#00F2FF', fontSize: 24, fontWeight: 'bold' }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : (isGuestMode ? 'G' : 'U')}
                    </Typography>
                  </View>
                  <Typography variant="h3" style={{ color: '#fff' }}>{user?.name || guestProfile?.name || 'Utilizador'}</Typography>
                  <View style={{ backgroundColor: isGuestMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 242, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
                    <Typography variant="caption" style={{ color: isGuestMode ? '#aaa' : '#00F2FF', fontWeight: '600' }}>
                      {isGuestMode ? 'Modo Guest' : 'Conta pessoal'}
                    </Typography>
                  </View>
                </View>

                {/* A.0 Entrada do Agregado Familiar (Apenas Users Registados) */}
                {!isGuestMode && (
                  <TouchableOpacity
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                    onPress={() => Alert.alert('Área Familiar', 'A gestão central do agregado e sincronização de biometrias partilhadas será efetuada nesta secção no futuro.')}
                  >
                    <View style={{ backgroundColor: 'rgba(0, 242, 255, 0.1)', padding: 10, borderRadius: 10, marginRight: 16 }}>
                      <Users size={24} color="#00F2FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>Agregado</Typography>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Gerir membros e perfis ligados</Typography>
                    </View>
                    <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                )}

                {/* A.1. Nome de Utilizador Editável */}
                <View style={styles.inputGroup}>
                  <Typography style={styles.inputLabel}>NOME DO UTILIZADOR</Typography>
                  <TextInput
                    style={styles.inputField}
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>



                {/* C. Dados base */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                  <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                    <Typography style={styles.inputLabel}>IDADE (ANOS)</Typography>
                    <TextInput style={styles.inputField} value={profileAge} onChangeText={setProfileAge} keyboardType="numeric" placeholder="--" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                    <Typography style={styles.inputLabel}>PESO (KG)</Typography>
                    <TextInput style={styles.inputField} value={profileWeight} onChangeText={setProfileWeight} keyboardType="numeric" placeholder="--" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                    <Typography style={styles.inputLabel}>ALTURA (CM)</Typography>
                    <TextInput style={styles.inputField} value={profileHeight} onChangeText={setProfileHeight} keyboardType="numeric" placeholder="--" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                </View>

                {/* E. Gravar e Sessão */}
                <View style={{ flexDirection: 'column', gap: 12 }}>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={async () => {
                      console.warn(`[DEV NAME 1] local before save: "${profileName}"`);
                      if (isGuestMode) {
                        useStore.getState().updateGuestProfile({
                          name: profileName || 'Convidada',
                          age: profileAge ? parseInt(profileAge, 10) : undefined,
                          weight: profileWeight ? parseFloat(profileWeight) : undefined,
                          height: profileHeight ? parseFloat(profileHeight) : undefined
                        });
                        setShowProfile(false);
                      } else {
                        // Fazemos update do perfil persistente e optimistic update
                        const payloadToSend = {
                          name: profileName || user?.name || 'Utilizador',
                          age: profileAge ? parseInt(profileAge, 10) : undefined,
                          weight: profileWeight ? parseFloat(profileWeight) : undefined,
                          height: profileHeight ? parseFloat(profileHeight) : undefined
                        };
                        console.warn(`[DEV NAME 2] payload to slice:`, JSON.stringify(payloadToSend));
                        try {
                          // Tracker para detetar overwrite
                          if ((window as any)) (window as any)._lastSavedName = payloadToSend.name;
                          
                          const success = await useStore.getState().updateAuthenticatedProfile(payloadToSend);
                          
                          if (success) {
                            setShowProfile(false);
                          } else {
                            console.error('[DEV NAME] success=false, abortando fecho de modal.');
                            Alert.alert('Erro', 'Não foi possível gravar as alterações no servidor.');
                          }
                        } catch (err) {
                          console.error('[DEV NAME] EXCEPTION:', err);
                          Alert.alert('Erro', 'Ocorreu um erro interno na aplicação.');
                        }
                      }
                    }}
                  >
                    <Typography style={styles.saveBtnText}>GRAVAR ALTERAÇÕES</Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ alignItems: 'center', paddingVertical: 14 }}
                    onPress={() => {
                      if (isGuestMode) {
                        // Resets Guest
                        useStore.getState().setGuestMode(false);
                        useStore.getState().clearSensitiveState();
                      } else {
                        supabase.auth.signOut().catch(e => console.error("Logout erro:", e));
                        useStore.getState().setUser(null);
                        useStore.getState().setSessionToken(null);
                        useStore.getState().clearSensitiveState();
                      }
                      setShowProfile(false);
                    }}
                  >
                    <Typography style={{ color: '#FF3C3C', fontWeight: '600', fontSize: 13, letterSpacing: 0.5 }}>
                      {isGuestMode ? 'SAIR DO MODO GUEST' : 'TERMINAR SESSÃO'}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── CONTROL MODAL ─────────────────────────────────────────────────── */}
      <Modal visible={showControl} transparent animationType="fade" onRequestClose={() => setShowControl(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setShowControl(false)}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5, 10, 18, 0.75)' }]} />
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={80} tint="dark" style={[styles.modalContent, { borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}>
              <View style={styles.modalHeader}>
                <Typography variant="h2" style={styles.modalTitle}>Definições do Ecrã & IA</Typography>
                <TouchableOpacity onPress={() => setShowControl(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.dividerModal} />

              {/* --- NOVO: MODO DE ANÁLISE INTERATIVO --- */}
              <View style={{ marginBottom: 24 }}>
                <Typography style={[styles.settingsLabel, { marginBottom: 12 }]}>Modo de Análise</Typography>

                {/* Segmented Control - Manual vs Automático */}
                <View style={{ flexDirection: 'row', backgroundColor: 'rgba(5, 10, 18, 0.4)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 4 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setAnalysisMode('manual')}
                    style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: analysisMode === 'manual' ? 'rgba(0, 242, 255, 0.15)' : 'transparent', borderWidth: 1, borderColor: analysisMode === 'manual' ? 'rgba(0, 242, 255, 0.4)' : 'transparent' }}
                  >
                    <Typography style={{ color: analysisMode === 'manual' ? '#00F2FF' : 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 13, textShadowColor: analysisMode === 'manual' ? 'rgba(0, 242, 255, 0.5)' : 'transparent', textShadowRadius: 8 }}>MANUAL</Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (analysisMode !== 'automatico') {
                        setAnalysisMode('automatico');
                        setAutoTimes(1);
                        setAutoDays(1);
                        setAutoExpanded(true);
                        setShowAutoWarning(true);
                      } else {
                        setAutoExpanded(!autoExpanded);
                      }
                    }}
                    style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: analysisMode === 'automatico' ? 'rgba(0, 242, 255, 0.15)' : 'transparent', borderWidth: 1, borderColor: analysisMode === 'automatico' ? 'rgba(0, 242, 255, 0.4)' : 'transparent' }}
                  >
                    <Typography style={{ color: analysisMode === 'automatico' ? '#00F2FF' : 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 13, textShadowColor: analysisMode === 'automatico' ? 'rgba(0, 242, 255, 0.5)' : 'transparent', textShadowRadius: 8 }}>AUTOMÁTICO</Typography>
                  </TouchableOpacity>
                </View>

                {/* Painel Expansível de Periodicidade (Só aparece em Automático e Expandido) */}
                {analysisMode === 'automatico' && autoExpanded && (
                  <View style={{ marginTop: 12, backgroundColor: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }}>
                    <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Frequência de Monitorização</Typography>

                    <View style={{ marginTop: 10, paddingVertical: 10 }}>
                      {/* LINHA 1: Vezes por Extração */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Efetuar análise</Typography>
                        <View style={{ marginHorizontal: 8 }}>
                          <WheelPicker value={autoTimes} onChange={setAutoTimes} min={1} max={4} width={50} />
                        </View>
                        <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>vezes</Typography>
                      </View>

                      {/* LINHA 2: Extensão de Período em Dias */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: -4 }}>
                        <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>em cada</Typography>
                        <View style={{ marginHorizontal: 8 }}>
                          <WheelPicker value={autoDays} onChange={setAutoDays} min={1} max={31} width={60} />
                        </View>
                        <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>dias</Typography>
                      </View>
                    </View>

                    {/* Botão de Fixar / Guardar Frequência */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setAutoExpanded(false)}
                      style={{ marginTop: 24, paddingVertical: 12, backgroundColor: 'rgba(0, 242, 255, 0.15)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.4)' }}
                    >
                      <Typography style={{ color: '#00F2FF', fontWeight: '700', letterSpacing: 1, fontSize: 13 }}>FIXAR FREQUÊNCIA</Typography>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Resumo Recolhido (Apenas Automático não-expandido) */}
                {analysisMode === 'automatico' && !autoExpanded && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setAutoExpanded(true)}
                    style={{ marginTop: 12, backgroundColor: 'rgba(0, 242, 255, 0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.2)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <View>
                      <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Frequência Fixada</Typography>
                      <Typography style={{ color: '#00F2FF', fontSize: 15, fontWeight: '600' }}>{autoTimes} {autoTimes === 1 ? 'vez' : 'vezes'} a cada {autoDays} {autoDays === 1 ? 'dia' : 'dias'}</Typography>
                    </View>
                    <Typography style={{ color: 'rgba(0, 242, 255, 0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Editar</Typography>
                  </TouchableOpacity>
                )}
              </View>
              {/* --- FIM MODO ANÁLISE --- */}
              <View style={styles.dividerModal} />

              {/* --- NOVO SECIONADOR DE GRUPOS DE ANÁLISE --- */}
              <View style={{ marginBottom: groupsExpanded ? 16 : 0 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setGroupsExpanded(!groupsExpanded)}
                  style={styles.settingsRow}
                >
                  <Typography style={styles.settingsLabel}>Selecionar grupos de análises</Typography>
                  <Typography style={styles.settingsValue}>
                    {selectedGroups.length === 4 ? 'TOTAL' : (selectedGroups.length === 0 ? 'NENHUM' : selectedGroups.join(', '))}
                  </Typography>
                </TouchableOpacity>

                {groupsExpanded && (
                  <View style={{ marginTop: 8, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }}>
                    {[
                      { id: 'U', label: 'U - Urinálise' },
                      { id: 'S', label: 'S - Sinais Fisiológicos' },
                      { id: 'F', label: 'F - Avaliação Fecal' },
                      { id: 'O', label: 'O - Outros' }
                    ].map(group => {
                      const isActive = selectedGroups.includes(group.id);
                      return (
                        <TouchableOpacity
                          key={group.id}
                          activeOpacity={0.8}
                          onPress={() => handleToggleGroup(group.id)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
                            borderBottomWidth: group.id !== 'O' ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.03)'
                          }}
                        >
                          <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: isActive ? '#00F2FF' : 'rgba(255,255,255,0.2)', backgroundColor: isActive ? 'rgba(0, 242, 255, 0.2)' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            {isActive && <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#00F2FF' }} />}
                          </View>
                          <Typography style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: isActive ? '500' : '400' }}>{group.label}</Typography>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
              {/* --- FIM GRUPOS --- */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={cycleNotificationMode}
                style={styles.settingsRow}
              >
                <Typography style={styles.settingsLabel}>Notificações</Typography>
                <Typography style={styles.settingsValue}>{notificationMode}</Typography>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── AUTO WARNING POPUP ────────────────────────────────────────────── */}
      <Modal visible={showAutoWarning} transparent animationType="fade" onRequestClose={() => setShowAutoWarning(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAutoWarning(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={80} tint="dark" style={[styles.modalContent, { borderColor: 'rgba(0, 242, 255, 0.5)', borderWidth: 1 }]}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 242, 255, 0.15)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20, marginTop: 10 }}>
                <Target size={26} color="#00F2FF" />
              </View>
              <Typography variant="h2" style={{ textAlign: 'center', color: '#fff', marginBottom: 15, fontSize: 18 }}>Identificação</Typography>
              <Typography style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 22, marginBottom: 30 }}>
                Esta função usa NFC, ou dados de ECG, para identificar o utilizador, sem necessidade de emparelhamento com o telemóvel.
              </Typography>
              <TouchableOpacity style={[styles.saveBtn, { width: '100%', marginBottom: 10 }]} onPress={() => setShowAutoWarning(false)}>
                <Typography style={styles.saveBtnText}>COMPREENDIDO</Typography>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── OUTROS WARNING POPUP (GRUPOS) ─────────────────────────────────── */}
      <Modal visible={showOutrosWarning} transparent animationType="fade" onRequestClose={() => setShowOutrosWarning(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOutrosWarning(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={80} tint="dark" style={[styles.modalContent, { borderColor: 'rgba(0, 242, 255, 0.5)', borderWidth: 1 }]}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 242, 255, 0.15)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20, marginTop: 10 }}>
                <Activity size={26} color="#00F2FF" />
              </View>
              <Typography variant="h2" style={{ textAlign: 'center', color: '#fff', marginBottom: 15, fontSize: 18 }}>Fontes Adicionais</Typography>
              <Typography style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 22, marginBottom: 30 }}>
                O sistema poderá incorporar fontes de informação de diferentes origens, como por exemplo: dados fornecidos por aplicações, telemóvel associado, ou dados inseridos manualmente pelo utilizador.
              </Typography>
              <TouchableOpacity style={[styles.saveBtn, { width: '100%', marginBottom: 10 }]} onPress={() => setShowOutrosWarning(false)}>
                <Typography style={styles.saveBtnText}>COMPREENDIDO</Typography>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── NFC DEVICE PAIRING MODAL ─────────────────────────────────────── */}
      <Modal visible={showNfcModal} transparent animationType="fade" onRequestClose={() => {
        setShowNfcModal(false);
        isOff.current = false;
        Animated.spring(switchAnim, { toValue: 0, useNativeDriver: true }).start();
      }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => {
          setShowNfcModal(false);
          isOff.current = false;
          Animated.spring(switchAnim, { toValue: 0, useNativeDriver: true }).start();
        }}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={70} tint="dark" style={[styles.modalContent, { borderColor: 'rgba(0, 242, 255, 0.4)', borderWidth: 1, alignItems: 'center' }]}>

              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0, 242, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
                <Activity size={32} color="#00F2FF" />
              </View>

              <Typography variant="h2" style={{ textAlign: 'center', color: '#fff', marginBottom: 15 }}>Iniciar Novo Exame</Typography>

              <Typography style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 22, marginBottom: 30 }}>
                Vamos iniciar a ligação com o dispositivo onde fará exames. Certifique-se que está nas proximidades e aproxima o seu telemóvel da zona indicada no equipamento ablute_
              </Typography>

              <TouchableOpacity style={[styles.saveBtn, { width: '100%' }]} onPress={() => { }}>
                <Typography style={styles.saveBtnText}>ATIVAR NFC E EMPARELHAR</Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 20, padding: 10, alignItems: 'center' }}
                onPress={() => {
                  setShowNfcModal(false);
                  isOff.current = false;
                  Animated.spring(switchAnim, { toValue: 0, useNativeDriver: true }).start();
                }}>
                <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Cancelar</Typography>
              </TouchableOpacity>

            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    <HistoricoModal
        visible={showHistorico}
        onClose={() => setShowHistorico(false)}
        analyses={analyses.filter(a => a.source !== 'demo')}
        activeAnalysisId={activeAnalysisId}
        onSelectAnalysis={(id) => {
          setDemoAnalysis(null); // sai do demo se activo
          setActiveAnalysisId(id);
          setShowHistorico(false);
          setBioTab(0);
        }}
      />

      <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }} activeOpacity={1} onPress={() => setShowExportModal(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#1C1C22', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Typography style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Exportar Dados</Typography>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 }}>1. Escolher Grupos</Typography>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {['Urina', 'Fisiológica', 'Fecal', 'Ecossistema'].map(g => (
                <View key={g} style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>{g}</Typography>
                </View>
              ))}
            </View>

            <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 }}>2. Escolher Canal</Typography>
            <View style={{ flexDirection: 'column', gap: 12 }}>
              {['WhatsApp', 'Email', 'Imprimir'].map(c => (
                <TouchableOpacity key={c} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }} onPress={() => { setShowExportModal(false); alert('Funcionalidade de exportar em breve.'); }}>
                  <Typography style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Exportar via {c}</Typography>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── MODO DEMO PICKER MODAL MOVIDA PARA A RAIZ DO FICHEIRO PARA EVITAR MONTAGENS CONDICIONAIS ── */}
      <Modal visible={showDemoModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#1C1C22', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Typography variant="h2" style={{ fontSize: 20, color: 'white' }}>Forçar Cenário Demo</Typography>
              <TouchableOpacity onPress={() => setShowDemoModal(false)} style={{ padding: 8 }}>
                <X size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {[
                { key: 'balanced', label: 'Equilíbrio geral', color: '#00D4AA', colorBg: 'rgba(0, 212, 170, 0.1)' },
                { key: 'low_energy', label: 'Energia em baixo', color: '#FFD700', colorBg: 'rgba(255, 215, 0, 0.1)' },
                { key: 'poor_recovery', label: 'Recuperação insuficiente', color: '#FF4D4D', colorBg: 'rgba(255, 77, 77, 0.1)' },
                { key: 'irregular_digestion', label: 'Digestão irregular', color: '#FFA500', colorBg: 'rgba(255, 165, 0, 0.1)' },
                { key: 'unstable_rhythm', label: 'Ritmo instável', color: '#FF00FF', colorBg: 'rgba(255, 0, 255, 0.1)' },
                { key: 'mixed', label: 'Perfil misto plausível', color: '#00F2FF', colorBg: 'rgba(0, 242, 255, 0.1)' }
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleSelectDemo(item.key)}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: item.colorBg,
                    backgroundColor: 'rgba(25,25,30,0.6)',
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 12 }} />
                  <Typography style={{ color: 'white', fontWeight: '600' }}>{item.label}</Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Botão de limpeza - Reverter para Factual, fixo no fundo da view */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
              <TouchableOpacity
                onPress={() => handleSelectDemo(null)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <Typography style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                  Desativar Demo (Usar Factual Real)
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SYNC HUB UI OVERLAY ── */}
      {syncFlowState !== 'idle' && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(5,10,18,0.95)', zIndex: 9999, alignItems: 'center', justifyContent: 'center' }}>
           <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,242,255,0.05)', borderWidth: 2, borderColor: syncFlowState === 'success' ? '#00D4AA' : 'rgba(0,242,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
              {syncFlowState === 'searching' && <ActivityIndicator color="#00F2FF" size="large" />}
              {syncFlowState === 'connected' && <Typography style={{ fontSize: 40 }}>📱</Typography>}
              {syncFlowState === 'syncing' && <ActivityIndicator color="#00F2FF" size="large" />}
              {syncFlowState === 'success' && <Typography style={{ fontSize: 40 }}>✅</Typography>}
           </View>
           
           <Typography style={{ color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
              {syncFlowState === 'searching' && 'A Procurar Equipamento...'}
              {syncFlowState === 'connected' && 'Equipamento Conectado'}
              {syncFlowState === 'syncing' && 'A Sincronizar Sinais vitais...'}
              {syncFlowState === 'success' && 'Sincronização Concluída'}
           </Typography>
           
           <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
              {syncFlowState === 'searching' && 'Certifique-se que os dispositivos Bluetooth estão ligados e próximos do telemóvel.'}
              {syncFlowState === 'connected' && 'A estabelecer canal seguro bidirecional.'}
              {syncFlowState === 'syncing' && 'A transferir contexto métrico assinado para a janela atual.'}
              {syncFlowState === 'success' && 'A sua cronologia foi atualizada com sucesso.'}
           </Typography>
        </View>
      )}

    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05070A',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
  },
  glowBall: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginTop: 20,
    zIndex: 9999, // Autoridade de clique absoluta sobrepõe qualquer zona de arraste
    elevation: 99,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  topIconRow: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 9999,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Botões furam qualquer UI invisível por perto
  },
  evalBadge: {
    backgroundColor: 'rgba(115, 188, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(115, 188, 255, 0.2)',
    alignItems: 'flex-end',
  },
  evalText: {
    fontSize: 9,
    color: '#73BCFF',
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.6,
  },
  evalVal: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '800',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 120,
    backgroundColor: 'rgba(5,10,20,0.9)',
  },
  orbInner: {
    ...StyleSheet.absoluteFillObject,
  },
  centerLabel: {
    color: '#fff',
    letterSpacing: 4,
    fontWeight: '800',
    marginBottom: 8,
  },
  centerSub: {
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    fontWeight: '600',
  },
  footerLine: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Left/Right edge tap handles
  leftEdgeHandle: {
    position: 'absolute',
    left: 0,
    top: '38%',
    width: 32, // Espessura esguia para elegância
    height: 136, // Comprimento reposto para envolver perfeitamente os nomes rodados a 90deg
    backgroundColor: 'rgba(5, 8, 14, 0.45)',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(255, 230, 184, 0.15)',
    zIndex: 500,
  },
  rightEdgeHandle: {
    position: 'absolute',
    right: 0,
    top: '38%',
    width: 32, // Espessura fina simétrica
    height: 136, // Comprimento reposto para albergar Resultados
    backgroundColor: 'rgba(5, 8, 14, 0.45)',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255, 230, 184, 0.15)',
    zIndex: 500,
  },
  edgePill: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 4,
  },
  edgeLabel: {
    fontSize: 14,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.4)',
    writingDirection: 'ltr',
    transform: [{ rotate: '-90deg' }],
    marginTop: 4,
  },
  // Bottom App Drawer trigger (always visible)
  drawerTrigger: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Side Panels
  sidePanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    zIndex: 500,
  },
  leftPanel: {
    left: 0,
  },
  rightPanel: {
    right: 0,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  panelTitle: {
    color: '#fff',
  },
  panelScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  // ── Themes Panel ──
  themePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  themePanelTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  themePanelTagline: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  themePanelClose: {
    marginTop: 2,
    padding: 6,
  },
  // ── Paginated pages ──
  themePage: {
    width: '100%',
  },
  // ── Index page ──
  themeIndexContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    justifyContent: 'flex-start',
  },
  themeIndexDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#00F2FF',
    opacity: 0.6,
    marginBottom: 20,
  },
  themeIndexLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  themeIndexList: {
    gap: 10,
    marginBottom: 32,
  },
  themeIndexBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 16,
  },
  themeIndexBtnIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIndexBtnTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  themeIndexScore: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeIndexScoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  themeIndexHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1,
  },
  // ── Card page ──
  themeCardPageInner: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  themePageIndicatorRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  themePageIndicator: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  themeBackBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  themeBackBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  // ── Histórico section ──
  themeHistoricoBtn: {
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  themeHistoricoBtnText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  themeHistoricoArrow: {
    color: 'rgba(115,188,255,0.7)',
    fontSize: 20,
    fontWeight: '300',
  },
  bioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bioName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  bioValueArea: {
    alignItems: 'flex-end',
  },
  bioVal: {
    color: '#00F2FF',
    fontWeight: '800',
    fontSize: 15,
  },
  bioUnit: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  // Main View
  mainView: {
    flex: 1,
  },
  // App Drawer
  appDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 750,
    zIndex: 400,
  },
  sectionTitle: {
    color: '#fff',
    marginTop: 30,
    marginBottom: 5,
    marginLeft: 32,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.6,
  },
  appGridSub: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  drawerContent: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  drawerHandleArea: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  drawerTitle: {
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
  },
  appGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
  },
  appItem: {
    alignItems: 'center',
  },
  appIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    color: '#fff',
    fontWeight: '700',
  },
  downloadList: {
    gap: 16,
    paddingBottom: 40,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  actionBtn: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 12,
  },
  installBtn: {
    backgroundColor: '#00F2FF',
  },
  installText: {
    color: '#000000',
  },
  uninstallBtn: {
    backgroundColor: 'rgba(255,60,60,0.2)',
    borderColor: 'rgba(255,80,80,0.6)',
    borderWidth: 1,
  },
  uninstallText: {
    color: '#FF6060',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  modalContent: {
    width: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarMain: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profilePlan: {
    color: '#00F2FF',
    fontWeight: '800',
    letterSpacing: 2,
  },
  dividerModal: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  settingsValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsValueHighlight: {
    color: '#00F2FF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputField: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#00F2FF',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 15,
  },
  bioTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 6,
  },
  bioTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bioTabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
