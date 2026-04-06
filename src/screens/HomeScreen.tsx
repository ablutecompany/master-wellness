import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, ScrollView, Platform, SafeAreaView, Modal, TextInput, Image, ActivityIndicator, FlatList, Pressable, Vibration, Alert } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeCard } from '../components/ThemeCard';
import { HistoricoModal } from '../components/HistoricoModal';
import { Utensils, Zap, SlidersHorizontal, Activity, Database, Smartphone, X, User, ChevronRight, ChevronDown, Menu, Battery, Heart, Scale, Droplets, Target, Settings, RefreshCw, Moon, Droplet, Brain, ChevronsDown, Sparkles, ArrowLeft, Calendar, History } from 'lucide-react-native';
import Svg, { Path, Text as SvgText, TextPath, Defs, G } from 'react-native-svg';
import { BiomechanicRelic } from '../components/BiomechanicRelic';
import { SiderealBackground } from '../components/SiderealBackground';
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
import { getSemanticInsights, getSemanticStatus } from '../services/insights';
import { semanticOutputService } from '../services/semantic-output';


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
  const credits = useStore(Selectors.selectCredits);
  const measurements = useStore(Selectors.selectMeasurements);
  const installedAppIds = useStore(Selectors.selectInstalledAppIds);
  const isMeasuring = useStore(Selectors.selectIsMeasuring);
  const isNfcLoading = useStore(Selectors.selectIsNfcLoading);

  // Garantir inicialização do serviço sem dependência circular
  useEffect(() => {
    semanticOutputService.init('user_current_session_1');
  }, []);

  // Safe memoized facts query to avoid Zustand infinite render loop
  const rawEvents = useStore(state => state.appContributionEvents);

  // --- UI & NAVIGATION STATE (MOVIDO PARA O TOPO PARA EVITAR TDZ EM MEMOS) ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeDemoKey, setActiveDemoKey] = useState<string | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);
  const [bioTab, setBioTab] = useState(0);
  const [themesOpen, setThemesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  // --- LÓGICA DE DATAS DISPONÍVEIS ---
  const availableDates = React.useMemo(() => {
    const dates = new Set<string>();

    // 1. Integrar datas do Modo Demo (Sintético)
    const activeDemo = activeDemoKey;
    if (activeDemo) {
      dates.add('2026-04-02');
    }

    // 2. Datas Reais
    const toShortDate = (d: any) => {
      try {
        const iso = new Date(d).toISOString().split('T')[0];
        return iso;
      } catch (e) { return null; }
    };

    measurements.forEach(m => {
      const d = toShortDate(m.timestamp);
      if (d) dates.add(d);
    });
    rawEvents.forEach(e => {
      const d = toShortDate(e.recordedAt);
      if (d) dates.add(d);
    });

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [measurements, rawEvents, activeDemoKey]); // Recalcula se o modal demo fechar

  // Inicializa e sincroniza a data ativa
  useEffect(() => {
    if (availableDates.length > 0) {
      if (!selectedDate || !availableDates.includes(selectedDate)) {
        setSelectedDate(availableDates[0]);
      }
    } else if (!selectedDate) {
      // Fallback absoluto para evitar "Carregando..." eterno
      setSelectedDate('2026-04-02');
    }
  }, [availableDates, selectedDate]);

  // --- FILTRAGEM POR DATA (C/ SUPORTE A DEMO) ---
  const filteredMeasurements = React.useMemo(() => {
    const activeDemo = activeDemoKey;

    // Se estiver em Demo e a data for a de hoje, injetamos mocks para as tabs
    if (activeDemo && selectedDate === '2026-04-02') {
      return [
        { type: 'urinalysis', timestamp: '2026-04-02T08:00:00Z', value: { marker: 'Gravidade Específica', value: '1.025', unit: 'sg' } },
        { type: 'urinalysis', timestamp: '2026-04-02T08:00:00Z', value: { marker: 'pH Urinário', value: '6.5', unit: 'pH' } },
        { type: 'ecg', timestamp: '2026-04-02T08:00:00Z', value: { value: '72', unit: 'bpm' } },
        { type: 'weight', timestamp: '2026-04-02T08:00:00Z', value: { value: '74.2', unit: 'kg' } },
      ];
    }

    if (!selectedDate) return [];
    return measurements.filter(m => {
      try {
        return new Date(m.timestamp).toISOString().split('T')[0] === selectedDate;
      } catch (e) { return false; }
    });
  }, [measurements, selectedDate, activeDemoKey]);

  const filteredEvents = React.useMemo(() => {
    const activeDemo = activeDemoKey;
    if (activeDemo && selectedDate === '2026-04-02') {
      return [
        { appId: 'urinalysis', recordedAt: '2026-04-02T08:00:00Z', type: 'marker_check', value: 'Sincronizado' }
      ];
    }
    if (!selectedDate) return [];
    return rawEvents.filter(e => {
      try {
        return new Date(e.recordedAt).toISOString().split('T')[0] === selectedDate;
      } catch (err) { return false; }
    });
  }, [rawEvents, selectedDate, activeDemoKey]);

  const activeFacts = React.useMemo(() =>
    Selectors.selectActiveDerivedContextFacts({ appContributionEvents: filteredEvents } as any),
    [filteredEvents]);

  // Ações via subscrição estática (sem re-render por estado)
  const launchApp = useStore(state => state.launchApp);
  const uninstallApp = useStore(state => state.uninstallApp);

  // Subscrição ao Bundle Semântico v1.2.0 (Fonte de Verdade)
  const [semanticThemes, setSemanticThemes] = useState(getSemanticInsights());
  const [semanticStatus, setSemanticStatus] = useState(getSemanticStatus());
  const [crossDomainSummary, setCrossDomainSummary] = useState(semanticOutputService.getCrossDomainSummary());

  // --- SOURCE OF TRUTH (CONTEXTO ATIVO) ---
  const activeAnalysisContext = React.useMemo(() => ({
    selectedDate,
    filteredMeasurements,
    filteredEvents,
    isDemo: !!activeDemoKey,
    demoScenarioKey: activeDemoKey
  }), [selectedDate, filteredMeasurements, filteredEvents, activeDemoKey]);

  useEffect(() => {
    semanticOutputService.updateTemporalContext(activeAnalysisContext);
  }, [activeAnalysisContext]);

  useEffect(() => {
    // Escuta alterações no bundle global e actualiza a UI da Shell
    const unsubscribe = semanticOutputService.subscribe(() => {
      setSemanticThemes(getSemanticInsights());
      setSemanticStatus(getSemanticStatus());
      setCrossDomainSummary(semanticOutputService.getCrossDomainSummary());

      // Telemetria: Rastro de visualização de domínios na Home
      const bundle = semanticOutputService.getBundle();
      if (!bundle || bundle.status !== 'ready') return;

      const insights = getSemanticInsights();
      insights.forEach(insight => {
        const output = bundle.domains[insight.domain];
        if (!output) return;

        const { semanticTelemetry } = require('../services/semantic-output/telemetry/engine');
        semanticTelemetry.record({
          eventType: output.status === 'sufficient_data' ? 'insight_displayed' :
            (output.status === 'insufficient_data' ? 'insufficient_data_state_displayed' : 'unavailable_state_displayed'),
          domain: insight.domain,
          bundleVersion: bundle.version,
          semanticVersion: '1.2.0',
          screen: 'home',
          status: output.status,
          insightIds: output.mainInsight ? [output.mainInsight.id] : [],
          recommendationIds: output.recommendations.map((r: any) => r.id),
          evidenceRefIds: [],
          source: 'shell'
        });
      });
    });
    return unsubscribe;
  }, []);

  const themesFlatListRef = useRef<FlatList>(null);
  const themesPanelHeight = height;
  const [showProfile, setShowProfile] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  // -- DEMO MODE STATE --
  const handleSelectDemo = (key: any) => {
    // 1. Oculta Modal para libertar DOM touch (gera RE-RENDER violento do Ecrã)
    setShowDemoModal(false);

    // 2. PROTEÇÃO REACT NATIVE WEB: 
    // Só podemos iniciar a transição CSS quando a árvore DOM estiver estabilizada.
    // 2 ticks de rAF dão garantia total de que a eliminação do <Modal> já pintou.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {

        // 3. Arranca o fecho da gaveta Direita
        Animated.spring(dataAnim, { toValue: width, useNativeDriver: true }).start(({ finished }) => {

          // Se o utilizador clicou como um louco ou a animação foi forçada a parar, saímos!
          if (!finished) return;

          // 4. Fecho completo. Limpa background fantasma.
          setDataOpen(false);

          // 5. Injeta carga maciça de dados falsos e acorda a UI (RE-RENDER violento #2)
          setActiveDemoKey(key);
          setThemesOpen(true);

          // 6. Protege a renderização maciça da Esquerda e inicia abertura suave
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              Animated.spring(themesAnim, { toValue: 0, useNativeDriver: true }).start();
            });
          });
        });
      });
    });
  };

  const [stableExpanded, setStableExpanded] = useState(false);
  // Profile Form State (Connected to real state)
  const [profileName, setProfileName] = useState(user?.name || 'Utilizadora');
  const [profileAge, setProfileAge] = useState(user?.age ? user.age.toString() : '');
  const [profileWeight, setProfileWeight] = useState(user?.weight ? user.weight.toString() : '');
  const [profileHeight, setProfileHeight] = useState(user?.height ? user.height.toString() : '');
  const [profileGoal, setProfileGoal] = useState(user?.goals?.[0] || 'Performance');

  // Odometer calculation (Factual)
  const diasSemExame = useStore(Selectors.selectDaysSinceLastMeasurement);

  // Settings Form State (Modo de Análise)
  const [analysisMode, setAnalysisMode] = useState<'manual' | 'automatico'>('automatico');
  const [autoTimes, setAutoTimes] = useState(1);
  const [autoDays, setAutoDays] = useState(1);
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [showAutoWarning, setShowAutoWarning] = useState(false);

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

  // Settings Form State (Notificações)
  type NotificationMode = 'Ativas' | 'Apenas Alertas' | 'Silenciadas';
  const [notificationMode, setNotificationMode] = useState<NotificationMode>('Ativas');

  const cycleNotificationMode = () => {
    if (notificationMode === 'Ativas') setNotificationMode('Apenas Alertas');
    else if (notificationMode === 'Apenas Alertas') setNotificationMode('Silenciadas');
    else setNotificationMode('Ativas');
  };

  // ── Inline mini-app for web (same pattern as AppsScreen) ─────────────────
  const [inlineApp, setInlineApp] = useState<MiniAppManifest | null>(null);

  // ── Animation States ──────────────────────────────────────────────────────
  const themesAnim = useRef(new Animated.Value(-width)).current;
  const dataAnim = useRef(new Animated.Value(width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(1)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

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
    setThemesOpen(true);
    Animated.spring(themesAnim, { toValue: 0, useNativeDriver: true }).start();
  };
  const closeThemes = () => {
    Animated.spring(themesAnim, { toValue: -width, useNativeDriver: true }).start(() => setThemesOpen(false));
  };
  const openData = () => {
    if (themesOpen) return; // prevent overlap: don't open if Temas is open
    setDataOpen(true);
    Animated.spring(dataAnim, { toValue: 0, useNativeDriver: true }).start();
  };
  const closeData = () => {
    Animated.spring(dataAnim, { toValue: width, useNativeDriver: true }).start(() => setDataOpen(false));
  };

  // Keep edge gesture callbacks up to date every render
  openThemesRef.current = openThemes;
  openDataRef.current = openData;

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

  // Bottom edge gesture zone (App Place drawer) - swipe up from bottom to open
  const bottomEdgeGesture = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => Platform.OS === 'web',
    onMoveShouldSetPanResponder: () => Platform.OS === 'web',
    onPanResponderRelease: (_, { dy, vy }) => {
      if (dy < -40 || vy < -0.3) {
        Animated.spring(drawerAnim, { toValue: 0, bounciness: 0, useNativeDriver: false })
          .start(() => { lastDrawerY.current = 0; });
      }
    },
  })).current;

  const DRAWER_DOWN = 583;
  const DRAWER_UP = 0;
  const lastDrawerY = useRef(DRAWER_DOWN);
  const drawerAnim = useRef(new Animated.Value(DRAWER_DOWN)).current;

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
        if (vy < -0.5 || finalY < (DRAWER_DOWN + DRAWER_UP) / 2) toValue = DRAWER_UP;
        else toValue = DRAWER_DOWN;

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
          if (dy < -60 || vy < -0.5) {
            Animated.spring(drawerAnim, { toValue: DRAWER_UP, useNativeDriver: false }).start(() => lastDrawerY.current = DRAWER_UP);
          } else if (dy > 60 || vy > 0.5) {
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
      {themesOpen && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: themesBackdropOpacity, zIndex: 10 }]}
          pointerEvents="box-none"
        >
          {/* Only RIGHT half is pressable — left is the panel, right is the shifted home */}
          <TouchableOpacity
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}
            activeOpacity={1}
            onPress={closeThemes}
          />
        </Animated.View>
      )}
      {dataOpen && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: dataBackdropOpacity, zIndex: 10 }]}
          pointerEvents="box-none"
        >
          {/* Only LEFT half is pressable — right is the panel, left is the shifted home */}
          <TouchableOpacity
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' }}
            activeOpacity={1}
            onPress={closeData}
          />
        </Animated.View>
      )}


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
          <View style={{ position: 'relative' }}>
            <BrandLogo size="medium" />
            {/* Máscara invisível para absorver os toques e impedir seleção de texto do logotipo */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS !== 'web') Vibration.vibrate(10);
                console.log('Logo pressed');
              }}
              style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
            />
          </View>
          <View style={styles.headerRight}>
            <View style={styles.topIconRow}>
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
                                ÚLTIMA AVALIAÇÃO HÁ
                              </TextPath>
                            </SvgText>
                          </Svg>

                          {/* Odometer agora centralizado no eixo absoluto do ecrã sem margins */}
                          <SlotMachineOdometer targetNumber={diasSemExame} />
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
      <Animated.View style={[styles.sidePanel, styles.leftPanel, { transform: [{ translateX: themesAnim }] }]}>
        <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill}>
          {/* SCRIM DE ESCURECIMENTO ADICIONAL PARA CORTAR BLEED-THROUGH */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: -1 }]} />

          {/* ── Compact Header ── */}
          <View style={styles.themePanelHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Typography style={styles.themePanelTitle}>INTERPRETAÇÃO DAS ANÁLISES POR IA</Typography>
                {activeDemoKey && (
                  <View style={{ backgroundColor: '#00F2FF20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8, borderWidth: 1, borderColor: '#00F2FF40' }}>
                    <Typography style={{ color: '#00F2FF', fontSize: 9, fontWeight: 'bold' }}>MODO DEMO</Typography>
                  </View>
                )}
              </View>
              <Typography style={styles.themePanelTagline}>O que o teu corpo está a dizer hoje.</Typography>
            </View>
            <TouchableOpacity
              onPress={closeThemes}
              style={[styles.themePanelClose, { padding: 24 }]}
              hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
            >
              <X size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
          
          {/* ── Temporal Context Header (Consistência com Dados) ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
              <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
                {(() => {
                  if (!selectedDate) return 'Carregando...';
                  const d = new Date(selectedDate);
                  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
                })()}
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
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
                          <View style={{ width: '100%' }}>
                            {/* BLOCO A: Principal (CrossDomain ou Highest Priority) */}
                            {hasCrossDomain ? (
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
                                {crossDomainSummary.deduplicatedRecommendations && crossDomainSummary.deduplicatedRecommendations.length > 0 && (
                                  <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12 }}>
                                    <Typography style={{ color: '#00F2FF', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, fontWeight: '700' }}>
                                      Ação Sugerida
                                    </Typography>
                                    <Typography style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 }}>
                                      {crossDomainSummary.deduplicatedRecommendations[0].actionable}
                                    </Typography>
                                  </View>
                                )}
                              </View>
                            ) : highestPriority ? (
                              <TouchableOpacity
                                style={{ marginBottom: 24, padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                                activeOpacity={0.7}
                                onPress={() => themesFlatListRef.current?.scrollToIndex({ index: highestPriority.originalIndex, animated: true })}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                  <Target size={18} color="rgba(255,255,255,0.8)" style={{ marginRight: 8 }} />
                                  <Typography style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Foco do Dia</Typography>
                                </View>
                                <Typography style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{highestPriority.title}</Typography>
                                <Typography style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginBottom: 16 }}>{highestPriority.paragraph1}</Typography>

                                <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                                  <Typography style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Ver Direção →</Typography>
                                </View>
                              </TouchableOpacity>
                            ) : null}

                            {/* BLOCO B: Necessitam Atenção / Ação */}
                            {urgentOrActionable.length > 0 && (
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
                            {stable.length > 0 && (
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
                        onCtaPress={() => {
                          const routeMap: Record<string, string> = {
                            sleep: 'sleep-deep',
                            nutrition: 'nutri-menu'
                          };
                          const appId = t.domain ? routeMap[t.domain] : null;
                          if (appId) {
                            const { MINI_APP_CATALOG } = require('../miniapps/catalog');
                            const app = MINI_APP_CATALOG.find((a: any) => a.id === appId);
                            if (app) {
                              launchApp(app);
                              if (Platform.OS === 'web') {
                                setInlineApp(app);
                              } else {
                                navigation?.navigate('MiniApp', { app });
                              }
                            }
                          } else {
                            setDataOpen(true);
                          }
                        }}
                      />
                    </ScrollView>
                  </View>
                </View>
              );
            }}
          />
        </BlurView>
      </Animated.View>

      {/* ── SIDE PANEL: DATA (RIGHT) ──────────────────────────────────────── */}
      {(() => {
        // --- FACTUAL DATA MAPPING (FILTERED BY DATE) ---
        const urinalysisMarkers = filteredMeasurements
          .filter(m => m.type === 'urinalysis')
          .map(m => ({
            name: m.value?.marker || 'Análise Urinária',
            value: m.value?.displayValue || m.value?.value || '---',
            unit: m.value?.unit || ''
          }));

        const physiologyMarkers = filteredMeasurements
          .filter(m => ['ecg', 'ppg', 'temp', 'weight'].includes(m.type))
          .map(m => {
            const labels: Record<string, string> = { ecg: 'Ritmo Cardíaco', ppg: 'PPG', temp: 'Temperatura', weight: 'Peso' };
            const units: Record<string, string> = { ecg: 'bpm', temp: '°C', weight: 'kg' };
            return {
              name: labels[m.type] || m.type,
              value: m.value?.displayValue || m.value?.value || '---',
              unit: m.value?.unit || units[m.type] || ''
            };
          });

        const factualBioCategories = [
          { label: 'Análises de Urina', color: '#00F2FF', markers: urinalysisMarkers, id: 'U', shortLabel: 'Urina' },
          { label: 'Monitorização Fisiológica', color: '#00D4AA', markers: physiologyMarkers, id: 'S', shortLabel: 'Fisiológica' },
          { label: 'Avaliação Fecal', color: '#FFA500', markers: [], id: 'F', shortLabel: 'Fecal' },
          {
            label: 'Sinais do Ecossistema',
            color: '#FFD700',
            id: 'E',
            shortLabel: 'Ecossistema',
            markers: activeFacts.map(f => ({
              name: f?.type ? String(f.type).replace(/_/g, ' ').toUpperCase() : 'SINAL',
              value: typeof f?.value === 'string' ? f.value : (f?.value?.displayValue || 'Ativo'),
              unit: f?.sourceAppId || ''
            }))
          },
        ].filter(c => c.id === 'E' || selectedGroups.includes(c.id));

        // Previne crashes de índices se o utilizador desmarcar uma aba com o index maior selecionado.
        const safeBioTab = bioTab >= factualBioCategories.length ? 0 : bioTab;

        return (
          <Animated.View style={[styles.sidePanel, styles.rightPanel, { transform: [{ translateX: dataAnim }], backgroundColor: '#020306' }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020306' }]} />
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.panelHeader}>
                <TouchableOpacity
                  onPress={closeData}
                  style={{ padding: 24 }}
                  hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
                >
                  <X size={24} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
                <Typography variant="h2" style={styles.panelTitle}>Bioanálise</Typography>

                {/* Script de limpeza para remover artefatos de debug (Getting DOM...) no browser */}
                {Platform.OS === 'web' && (
                  <View style={{ display: 'none' }}>
                    <ActivityIndicator
                      onLayout={() => {
                        if (typeof window !== 'undefined') {
                          // Limpeza agressiva e recorrente de artefatos visuais de debug
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

                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(0, 242, 255, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => setShowDemoModal(true)}
                >
                  <Sparkles size={16} color="#00F2FF" />
                  <Typography style={{ color: '#00F2FF', fontSize: 13, fontWeight: 'bold', marginLeft: 8 }}>MODO DEMO</Typography>
                </TouchableOpacity>
              </View>

              {/* ── Temporal Context Header ── */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Calendar size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
                  <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
                    {(() => {
                      if (!selectedDate) return 'Carregando...';
                      const d = new Date(selectedDate);
                      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
                    })()}
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

              {/* ── Tab Bar ── */}
              <View style={styles.bioTabBar}>
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
                {factualBioCategories.length > 0 ? (
                  factualBioCategories[safeBioTab].markers.length > 0 ? (
                    factualBioCategories[safeBioTab].markers.map((item: any, i: number) => (
                      <View key={i} style={styles.bioRow}>
                        <Typography style={styles.bioName}>{item.name}</Typography>
                        <View style={styles.bioValueArea}>
                          <Typography style={styles.bioVal}>{item.value}</Typography>
                          {item.unit ? <Typography variant="caption" style={styles.bioUnit}>{item.unit}</Typography> : null}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center', height: 200, paddingHorizontal: 20 }}>
                      <Typography style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 13 }}>
                        Ainda não existem dados para esta categoria.
                      </Typography>
                    </View>
                  )
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center', height: 200, paddingHorizontal: 20 }}>
                    <Database size={32} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
                    <Typography style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
                      Nenhum grupo de monitorização biológica ativado no Perfil.
                    </Typography>
                  </View>
                )}
              </ScrollView>

              {/* ── MODO DEMO PICKER MODAL ── */}
              <Modal visible={showDemoModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
                  <View style={{ backgroundColor: '#1C1C22', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <Typography variant="h2" style={{ fontSize: 20, color: 'white' }}>Forçar Cenário Demo</Typography>
                      <TouchableOpacity onPress={() => setShowDemoModal(false)} style={{ padding: 8 }}>
                        <X size={20} color="rgba(255,255,255,0.5)" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
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

                      {/* Botão de limpeza - Reverter para Factual */}
                      <TouchableOpacity
                        onPress={() => handleSelectDemo(null)}
                        style={{
                          marginTop: 12,
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
                    </ScrollView>
                  </View>
                </View>
              </Modal>

            </BlurView>
          </Animated.View>
        );
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
              <Typography variant="h3" style={styles.sectionTitle}>Disponíveis para Download</Typography>
              <View style={styles.downloadList}>
                {/* Todas as apps — install/uninstall dinâmico */}
                {[
                  { id: 'femmhealth', title: '_Fem sanctuary', desc: 'Saúde Feminina', icon: <View style={{ flexDirection: 'row', alignItems: 'center' }}><Typography style={{ color: '#FF6FBA', fontSize: 22, fontWeight: '800' }}>♀</Typography><Typography style={{ color: '#FF6FBA', fontSize: 16, fontWeight: '900', marginLeft: 2 }}>H</Typography></View> },
                  { id: 'nutri-menu', title: '_Meal planner', desc: 'Nutrição Personalizada', icon: <Utensils size={22} color="#00D4AA" /> },
                  { id: 'longevity-secrets', title: '_Healthspan', desc: 'Longevidade & Bem-estar', icon: <Sparkles size={22} color="#FFD700" /> },
                  { id: 'sleep-deep', title: 'deep sleep', desc: 'Integração Profunda de Sono', icon: <Moon size={22} color="#00F2FF" /> },
                  { id: '_hydra', title: 'HydraTrack', desc: 'Gestão de Água', icon: <Droplet size={22} color="#00F2FF" opacity={0.6} /> },
                  { id: '_mind', title: 'Mind', desc: 'Foco e Meditação', icon: <Brain size={22} color="#00F2FF" opacity={0.6} /> },
                  { id: '_fasting', title: 'Fasting', desc: 'Jejum Intermitente', icon: <Activity size={22} color="#00F2FF" opacity={0.6} /> },
                  { id: '_cardio', title: 'CardioSync', desc: 'Saúde Cardiovascular', icon: <Heart size={22} color="#00F2FF" opacity={0.6} /> },
                  { id: '_macro', title: 'MacroTrack', desc: 'Nutrição Detalhada', icon: <Target size={22} color="#00F2FF" opacity={0.6} /> },
                ].map(({ id, title, desc, icon }) => {
                  const isInstalled = installedAppIds.includes(id);
                  const isReal = !id.startsWith('_'); // real apps have install/uninstall wired up
                  return (
                    <View key={id} style={styles.downloadRow}>
                      <TouchableOpacity
                        style={styles.rowIcon}
                        activeOpacity={isInstalled && isReal ? 0.7 : 1}
                        onPress={() => {
                          if (isInstalled && isReal) {
                            const manifest = MINI_APP_CATALOG.find((m: any) => m.id === id);
                            if (manifest) {
                              launchApp(manifest);
                              if (Platform.OS === 'web') {
                                setInlineApp(manifest);
                              } else {
                                navigation?.navigate('MiniApp', { app: manifest });
                              }
                            }
                          }
                        }}
                      >
                        {icon}
                      </TouchableOpacity>
                      <View style={styles.rowInfo}>
                        <Typography style={styles.rowTitle}>{title}</Typography>
                        <Typography variant="caption" style={styles.rowDesc}>{desc}</Typography>
                      </View>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.actionBtn}>
                          <Typography style={styles.actionText}>INFO</Typography>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, isInstalled ? styles.uninstallBtn : styles.installBtn, !isReal && { opacity: 0.4 }]}
                          onPress={() => {
                            if (!isReal) return;
                            if (isInstalled) {
                              uninstallApp(id);
                            } else {
                              useStore.getState().installApp(id);

                              // Auto-launch on install to give clear feedback
                              const manifest = MINI_APP_CATALOG.find((m: any) => m.id === id);
                              if (manifest) {
                                if (Platform.OS === 'web') {
                                  setInlineApp(manifest);
                                } else {
                                  navigation?.navigate('MiniApp', { app: manifest });
                                }
                              }
                            }
                          }}
                        >
                          <Typography style={[styles.actionText, isInstalled ? styles.uninstallText : styles.installText]}>
                            {isInstalled ? 'DESINSTALAR' : 'INSTALAR'}
                          </Typography>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* ── PROFILE MODAL ─────────────────────────────────────────────────── */}
      <Modal visible={showProfile} transparent animationType="fade" onRequestClose={() => setShowProfile(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowProfile(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={70} tint="dark" style={[styles.modalContent, { maxHeight: height * 0.8 }]}>
              <View style={styles.modalHeader}>
                <Typography variant="h2" style={styles.modalTitle}>Editar Perfil</Typography>
                <TouchableOpacity onPress={() => setShowProfile(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                <View style={styles.profileInfo}>
                  <View style={styles.avatarMain}>
                    <User size={40} color="#00F2FF" />
                  </View>
                  <Typography variant="caption" style={styles.profilePlan}>{user?.goals?.[0] || 'Performance'}</Typography>
                </View>

                <View style={styles.inputGroup}>
                  <Typography style={styles.inputLabel}>NOME DO UTILIZADOR</Typography>
                  <TextInput
                    style={styles.inputField}
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Typography style={styles.inputLabel}>IDADE (ANOS)</Typography>
                    <TextInput
                      style={styles.inputField}
                      value={profileAge}
                      onChangeText={setProfileAge}
                      keyboardType="numeric"
                      placeholder="Por definir"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Typography style={styles.inputLabel}>PESO (KG)</Typography>
                    <TextInput
                      style={styles.inputField}
                      value={profileWeight}
                      onChangeText={setProfileWeight}
                      keyboardType="numeric"
                      placeholder="Por definir"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Typography style={styles.inputLabel}>ALTURA (CM)</Typography>
                    <TextInput
                      style={styles.inputField}
                      value={profileHeight}
                      onChangeText={setProfileHeight}
                      keyboardType="numeric"
                      placeholder="Por definir"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Typography style={styles.inputLabel}>FOCO ACTUAL</Typography>
                    <TextInput
                      style={styles.inputField}
                      value={profileGoal}
                      onChangeText={setProfileGoal}
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => {
                    useStore.getState().setUser({
                      ...user,
                      name: profileName,
                      age: profileAge ? parseInt(profileAge, 10) : undefined,
                      weight: profileWeight ? parseFloat(profileWeight) : undefined,
                      height: profileHeight ? parseFloat(profileHeight) : undefined,
                      goals: [profileGoal]
                    });
                    setShowProfile(false);
                  }}
                >
                  <Typography style={styles.saveBtnText}>GRAVAR ALTERAÇÕES</Typography>
                </TouchableOpacity>
              </ScrollView>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── CONTROL MODAL ─────────────────────────────────────────────────── */}
      <Modal visible={showControl} transparent animationType="fade" onRequestClose={() => setShowControl(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowControl(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={70} tint="dark" style={styles.modalContent}>
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
        availableDates={availableDates}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setShowHistorico(false);
          // Otimização: Força re-render das tabs se necessário
          setBioTab(0);
        }}
      />

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
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
