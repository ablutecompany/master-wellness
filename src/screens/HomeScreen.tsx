import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, ScrollView, Platform, SafeAreaView, Modal, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeCard } from '../components/ThemeCard';
import { Utensils, Star, Zap, SlidersHorizontal, Activity, Database, Smartphone, X, User, ChevronRight, Menu, Battery, Heart, Scale, Droplets, Target, Settings, RefreshCw, Moon, Droplet, Brain, LogIn, LogOut, Globe, Users, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import Svg, { Path, Text as SvgText, TextPath } from 'react-native-svg';
import { useStore } from '../store/useStore';
import { getSemanticService } from '../services/semantic-output';
import { MINI_APP_CATALOG } from '../miniapps/catalog';
import { MiniAppCategory, CATEGORY_LABELS } from '../miniapps/types';
import { DEMO_ANALYSIS_SNAPSHOT } from '../data/demo-snapshot';

const RAW_BIOMARKERS = [
  { id: 'b1', name: 'NT-proBNP', value: '120', unit: 'pg/mL', source: 'ablute' },
  { id: 'b2', name: 'F2-isoprostanos', value: '2.4', unit: 'ng/mg', source: 'ablute' },
  { id: 'b3', name: 'Sódio', value: '140', unit: 'mEq/L', source: 'ablute' },
  { id: 'b4', name: 'Potássio', value: '4.2', unit: 'mEq/L', source: 'ablute' },
  { id: 'b5', name: 'Potencial Redox', value: '-12', unit: 'mV', source: 'ablute' },
  { id: 'b6', name: 'pH Urinário', value: '6.2', unit: 'pH', source: 'ablute' },
  { id: 'b7', name: 'Glicose', value: '88', unit: 'mg/dL', source: 'ablute' },
  { id: 'b8', name: 'Ritmo Cardíaco', value: '64', unit: 'bpm', source: 'health_kit' },
  { id: 'b9', name: 'ECG', value: 'Normal', unit: 'Ritmo', source: 'health_kit' },
  { id: 'b10', name: 'PPG', value: '98', unit: '% SpO2', source: 'health_kit' },
  { id: 'b11', name: 'Impedância', value: '58', unit: '% Água', source: 'ablute' },
  { id: 'b12', name: 'Análise Intestinal', value: 'Saudável', unit: 'Flora', source: 'ablute' },
];

const MOCK_THEMES = [
  {
    title: 'Performance & Equilíbrio',
    score: 88,
    iconName: 'Activity',
    paragraph1: 'Tens base para ter um bom desempenho hoje, mas o teu corpo parece responder melhor a equilíbrio do que a excesso.',
    paragraph2: 'Continua capaz e funcional, mas já com sinais de carga acumulada. Se mantiveres controlo, ritmo e boa gestão do esforço, a resposta tende a ser melhor do que se tentares puxar ao máximo.',
    refText1: 'Para esta leitura, olharam-se sobretudo os sinais que ajudam a perceber como o teu corpo está a lidar com esforço e equilíbrio geral no dia de hoje. A tua frequência cardíaca de repouso apareceu um pouco acima do teu habitual e a variabilidade cardíaca ficou abaixo do teu baseline, o que muitas vezes é associado a maior carga fisiológica e menor frescura. Também foram considerados sinais urinários como creatinina e F2-isoprostanos, que ajudam a enquadrar concentração urinária e exigência do organismo após treino intenso.',
    refText2: 'Esta leitura procura dar contexto funcional. Questões de saúde devem ser discutidas com o médico.',
    suggestions: [
      { title: 'Se fores treinar outra vez hoje, baixa 10–20% a intensidade prevista', desc: 'Hoje o teu corpo parece responder melhor a boa execução e controlo do que a tentar bater volume, carga ou ritmo.' },
      { title: 'Faz 5 a 8 minutos de mobilidade e ativação antes de qualquer esforço', desc: 'Neste estado, entrar “a frio” aumenta a probabilidade de o corpo render pior do que aquilo que realmente consegue.' },
      { title: 'Se tiveres uma tarefa fisicamente exigente, coloca-a na janela em que já comeste e hidrataste', desc: 'Hoje, o timing vai influenciar mais o desempenho do que num dia mais fresco.' },
      { title: 'Evita blocos longos sem pausa se o dia for intenso fisicamente ou mentalmente', desc: 'Pequenas quebras podem ajudar a manter qualidade de resposta sem entrares em esforço desnecessário.' }
    ]
  },
  {
    title: 'Energia & Disponibilidade',
    score: 72,
    iconName: 'Zap',
    paragraph1: 'Tens energia disponível para o dia, mas não de forma infinita.',
    paragraph2: 'O teu corpo continua a responder bem, embora possa perder estabilidade se descurares hidratação, refeições ou pausas. Hoje, pequenos ajustes ao longo do dia podem fazer diferença na forma como te manténs disponível.',
    refText1: 'Aqui pesaram mais os sinais ligados a hidratação, disponibilidade funcional e custo fisiológico do dia. O peso surgiu abaixo do teu habitual, e sódio, potássio e ureia urinários ajudaram a reforçar a ideia de um dia mais exigente, com sudorese e reposição ainda incompleta. Em conjunto, estes sinais são muitas vezes associados a energia disponível, mas menos estável se o corpo não for bem apoiado com água, alimentação e pausas.',
    refText2: 'Isto não substitui avaliação clínica. Se houver dúvidas sobre saúde, o ideal é falar com um médico.',
    suggestions: [
      { title: 'Nas próximas 2 horas, faz reposição hídrica faseada e não de uma só vez', desc: 'O mais útil hoje é recuperar estabilidade, não apenas “beber muito” de repente.' },
      { title: 'Na próxima refeição, combina proteína com hidratos de carbono simples de tolerar', desc: 'Hoje o teu corpo tende a responder melhor a reposição funcional do que a refeições aleatórias ou demasiado leves.' },
      { title: 'Se costumas aguentar muito tempo sem comer, hoje não vale a pena testar isso', desc: 'Neste dia específico, passar demasiadas horas sem ingestão tende a penalizar mais a disponibilidade.' },
      { title: 'Se estiveres a perder clareza ao fim da tarde, faz uma pausa curta antes de insistires', desc: 'Hoje poderá compensar mais restaurar disponibilidade do que empurrar o corpo em baixa.' }
    ]
  },
  {
    title: 'Potencial',
    score: 95,
    iconName: 'Target',
    paragraph1: 'Hoje, dar o teu melhor não significa forçar mais.',
    paragraph2: 'Significa usar bem a capacidade que tens, com foco, critério e sem gastar o que o teu corpo ainda precisa para recuperar. O melhor de hoje parece estar mais na consistência do que em ir até ao limite.',
    refText1: 'Nesta leitura foram tidos em conta sobretudo os sinais que ajudam a perceber exigência, fadiga e capacidade de resposta no momento. A frequência cardíaca de repouso, a variabilidade cardíaca e a temperatura ligeiramente acima do teu habitual sugerem um corpo que já trabalhou bastante e que ainda está a reorganizar-se. A literatura associa muitas vezes este tipo de padrão a dias em que o melhor rendimento vem mais de boa gestão do que de insistir em mais carga.',
    refText2: 'A interpretação clínica de questões de saúde cabe sempre a profissionais de saúde.',
    suggestions: [
      { title: 'Define uma prioridade principal para o resto do dia e protege-a', desc: 'Hoje, “dar o melhor” parece mais eficaz quando concentras energia no que importa mesmo.' },
      { title: 'Fecha uma ou duas tarefas com qualidade em vez de dispersar por demasiadas frentes', desc: 'Neste estado, o rendimento tende a cair mais por fragmentação do que por falta de capacidade bruta.' },
      { title: 'Se pensavas acrescentar mais uma sessão, mais uma reunião ou mais uma carga extra, reavalia', desc: 'Hoje pode ser mais inteligente consolidar o que já fizeste bem do que tentar esticar o dia.' },
      { title: 'Usa o final do dia para sair com margem e não em desgaste total', desc: 'Neste caso específico, isso provavelmente vai valer mais para amanhã do que “espremer” o resto da energia hoje.' }
    ]
  },
  {
    title: 'Resistência saudável',
    score: 81,
    iconName: 'Heart',
    paragraph1: 'O teu corpo mostra boa capacidade para aguentar bem o dia ou esforço moderado, desde que mantenhas um ritmo estável.',
    paragraph2: 'Há base para continuidade, mas a melhor resposta tende a surgir com constância e não com picos de intensidade. Hoje, a tua resistência parece mais saudável quando é bem distribuída.',
    refText1: 'Para este tema, o mais importante foi cruzar o teu baseline com os sinais do dia. O teu histórico mostra boa base cardiovascular e boa adaptação ao esforço, mas a leitura atual indica também algum custo acumulado. Foram especialmente relevantes a frequência cardíaca de repouso, a variabilidade cardíaca e alguns sinais urinários como ureia e creatinina, que ajudam a perceber como o corpo está a sustentar esforço e recuperação.',
    refText2: 'Esta explicação serve apenas para contexto funcional e não para diagnóstico.',
    suggestions: [
      { title: 'Mantém um ritmo regular em vez de alternar entre longos períodos parados e picos de intensidade', desc: 'Hoje o teu corpo parece sustentar melhor a continuidade do que mudanças bruscas.' },
      { title: 'Se fores caminhar, correr ou pedalar, fica numa zona confortável e estável', desc: 'Para este dia, o melhor estímulo parece ser contínuo e controlado, não competitivo.' },
      { title: 'Divide tarefas exigentes em blocos com micro-pausas', desc: 'Isso ajuda a manter resistência funcional sem transformar o dia numa acumulação de fadiga.' },
      { title: 'Evita terminar o dia com um “pico final” só porque ainda te sentes capaz', desc: 'Hoje, a resistência parece mais saudável quando não é levada até ao limite.' }
    ]
  },
  {
    title: 'Recuperação',
    score: 45,
    iconName: 'Moon',
    paragraph1: 'O teu corpo está a recuperar, mas ainda não terminou esse processo.',
    paragraph2: 'Não há sinais de quebra, mas há margem evidente para consolidar descanso, hidratação e reposição. Hoje, pode compensar mais proteger a recuperação do que acrescentar nova exigência.',
    refText1: 'Este é um dos temas em que os sinais do dia pesam mais. A variabilidade cardíaca abaixo do teu habitual, a frequência cardíaca de repouso acima do baseline, a temperatura ligeiramente superior e marcadores como creatinina, ureia e F2-isoprostanos ajudam a reforçar a ideia de recuperação ainda em curso. A literatura associa muitas vezes este conjunto de sinais a um organismo que continua funcional, mas ainda a consolidar descanso, hidratação e reposição.',
    refText2: 'Se existirem dúvidas sobre saúde, sintomas ou alterações persistentes, deve falar com o médico.',
    suggestions: [
      { title: 'Hoje à noite, protege um sono mais cedo do que o habitual, se conseguires', desc: 'Neste estado, uma boa janela de recuperação pode pesar mais do que qualquer otimização pequena durante o dia.' },
      { title: 'Faz uma refeição de recuperação real e não apenas um snack improvisado', desc: 'O corpo parece precisar de reposição a sério, não só de “matar a fome”.' },
      { title: 'Evita somar nova carga intensa antes de recompensares hidratação e descanso', desc: 'Hoje o corpo continua funcional, mas a recuperação ainda não fechou o ciclo.' },
      { title: 'Se tiveres sinais de fadiga muscular ou sensação de corpo “pesado”, privilegia alongamento leve ou caminhada curta', desc: 'Para este momento, movimento leve pode ajudar mais do que repouso totalmente passivo ou nova intensidade.' },
      { title: 'Não uses cafeína tardia para mascarar cansaço', desc: 'Neste caso, isso pode roubar qualidade à recuperação de que o corpo realmente precisa hoje.' }
    ]
  },
  {
    title: 'Idade muscular',
    textValue: '35',
    paragraph1: 'A tua base muscular parece boa para o teu contexto, mas hoje o corpo tende a responder melhor a consistência do que a estímulos agressivos.',
    paragraph2: 'Há boa margem funcional, mas a adaptação muscular beneficia mais de regularidade, alimentação e recuperação do que de insistir em carga alta num dia já exigente.',
    refText1: 'Aqui foram considerados sobretudo sinais que ajudam a enquadrar adaptação muscular, exigência do dia e capacidade de recuperação. Ureia e creatinina urinárias mais altas, juntamente com o peso ligeiramente abaixo do habitual e uma variabilidade cardíaca mais baixa, ajudam a perceber um corpo que treinou com intensidade e que pode beneficiar mais de regularidade e recuperação do que de insistência agressiva. Estes sinais são frequentemente usados na literatura para contextualizar esforço, adaptação e frescura funcional.',
    refText2: 'Esta dimensão dá contexto sobre resposta muscular, mas lesões ou dor focalizada devem ser vistas num contexto clínico.',
    suggestions: [
      { title: 'Na próxima refeição principal, garante proteína suficiente e de boa qualidade', desc: 'Hoje isso pesa mais, porque o corpo está num contexto em que a adaptação depende de boa reposição.' },
      { title: 'Se fores fazer trabalho de força, prefere técnica, controlo e amplitude a carga máxima', desc: 'Neste dia, qualidade muscular tende a render mais do que agressividade.' },
      { title: 'Evita treinar grupos já muito exigidos como se estivesses num dia totalmente fresco', desc: 'Hoje a resposta muscular parece beneficiar mais de manutenção inteligente do que de estímulo extremo.' },
      { title: 'Se não fores voltar a treinar hoje, usa 10–15 minutos para mobilidade ou libertação ligeira', desc: 'Isso pode ajudar a preservar melhor sensação muscular e recuperação funcional.' },
      { title: 'Olha para o próximo treino como continuação da adaptação e não como esforço isolado', desc: 'Hoje, a consistência vai render mais a longo prazo.' }
    ]
  }
];

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  console.log('[HOME_BOOT] R1-AI Initializing...');
  const { width, height } = useWindowDimensions();
  const [showControl, setShowControl] = useState(false);
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Real Store State
  const user = useStore(state => state.user);
  const authAccount = useStore(state => state.authAccount);
  const isGuestMode = useStore(state => state.isGuestMode);
  const profileStatus = useStore(state => state.profileStatus);
  const analyses = useStore(state => state.analyses);
  const credits = useStore(state => state.credits);
  const isDemoMode = useStore(state => state.isDemoMode);
  const setIsDemoMode = useStore(state => state.setIsDemoMode);
  const setDemoAnalysis = useStore(state => state.setDemoAnalysis);
  const installedAppIds = useStore(state => state.installedAppIds) || [];
  const installApp = useStore(state => state.installApp);
  const launchApp = useStore(state => state.launchApp);

  const isAuthenticated = !!authAccount || isGuestMode;
  const userName = user?.name || (isGuestMode ? 'Guest' : (authAccount?.email?.split('@')[0] || 'Utilizador'));

  // ── Animation States ──────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const nudgeAnim = useRef(new Animated.Value(0)).current;

  const daysSince = useMemo(() => {
    const lastAnalysisDate = user?.lastAnalysisDate;
    if (!lastAnalysisDate) return 14; // Default para demonstrar aura se não houver data
    return Math.floor((Date.now() - new Date(lastAnalysisDate).getTime()) / (1000 * 60 * 60 * 24));
  }, [user?.lastAnalysisDate]);

  const daysSinceText = daysSince === 0 ? 'HOJE' : `${daysSince} DIAS`;

  // ── Dynamic Glow Logic ──────────────────────────────────────────────────
  const avgScore = useMemo(() => {
    // Se estiver em demo, usamos o score da demo. Se não, média dos domínios.
    if (isDemoMode) return 94; 
    const semanticBundle = getSemanticService().getBundle();
    const vals = Object.values(semanticBundle.domains || {}).map(d => d.score);
    if (vals.length === 0) return 85; // Fallback "Bom"
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [isDemoMode, analyses]);

  const glowColor = useMemo(() => {
    if (avgScore >= 80) return '#FFE600'; // Amarelo Vivo / Dourado (BOM)
    if (avgScore >= 60) return '#FFBF00'; // Amarelo-Âmbar
    if (avgScore >= 40) return '#FF8C00'; // Laranja
    return '#FF0000'; // Vermelho Vivo (MAU)
  }, [avgScore]);

  const glowRadiusFactor = Math.min(daysSince, 30) / 30;
  const dynamicGlowRadius = 120 + (glowRadiusFactor * 100); 
  
  // ── Switch Geometry Constants (DETERMINÍSTICO) ───────────────────────────
  // A posição final da roda é calculada para garantir equilíbrio visual.
  // KNOB_INSET define a distância ao topo (inicial) e ao fundo (final).
  const CAPSULE_HEIGHT = 220; 
  const KNOB_SIZE = 116; 
  const KNOB_INSET = 12; 
  const MAX_DRAG = CAPSULE_HEIGHT - KNOB_SIZE - (2 * KNOB_INSET); 
  // ─────────────────────────────────────────────────────────────────────────────

  const switchAnim = useRef(new Animated.Value(0)).current; // 0 = UP, MAX_DRAG = DOWN
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
        let newY = (isOff.current ? MAX_DRAG : 0) + gestureState.dy;
        if (newY < 0) newY = 0;
        if (newY > MAX_DRAG) newY = MAX_DRAG;
        switchAnim.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        let newY = (isOff.current ? MAX_DRAG : 0) + gestureState.dy;
        let toValue = 0;
        // Se passar da métrica ou tiver pull rápido para baixo
        if (newY > 40 || gestureState.vy > 0.4) {
          toValue = MAX_DRAG;
          isOff.current = true;
        } else {
          toValue = 0;
          isOff.current = false;
        }
        Animated.spring(switchAnim, {
          toValue,
          useNativeDriver: true,
          bounciness: 4,
          speed: 14,
        }).start(({ finished }) => {
          if (finished && toValue === MAX_DRAG) {
            setShowNfcModal(true);
          }
        });
      }
    })
  ).current;

  const DRAWER_DOWN = height - 170; // Ajustado para os ícones reduzidos
  const DRAWER_UP = 0;
  const lastDrawerY = useRef(DRAWER_DOWN);
  const drawerAnim = useRef(new Animated.Value(DRAWER_DOWN)).current;

  // Force sync positions on hot reload/mount
  React.useEffect(() => {
    drawerAnim.setValue(DRAWER_DOWN);
    lastDrawerY.current = DRAWER_DOWN;
    // FIX 1: Garantir posição zero do núcleo no load
    switchAnim.setValue(0);
    isOff.current = false;
  }, [DRAWER_DOWN]);

  const drawerBgOpacity = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [0.99, 0], // Totalmente transparente quando colapsado
    extrapolate: 'clamp',
  });

  const drawerInnerOpacity = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [1, 1], // Manter opaco para os ícones do rodapé
    extrapolate: 'clamp',
  });

  const appContentOpacity = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const footerIconsOpacity = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const centerContentY = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [-150, 0],
    extrapolate: 'clamp',
  });

  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capturar apenas se o movimento vertical for significativo
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, { dy }) => {
        let newY = lastDrawerY.current + dy;
        if (newY < DRAWER_UP) newY = DRAWER_UP;
        if (newY > DRAWER_DOWN) newY = DRAWER_DOWN;
        drawerAnim.setValue(newY);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        let finalY = lastDrawerY.current + dy;
        let toValue = DRAWER_DOWN;

        // Se estiver aberto (UP) e puxar para baixo (dy > 0), fechar (DOWN)
        if (lastDrawerY.current === DRAWER_UP) {
          if (dy > 80 || vy > 0.5) toValue = DRAWER_DOWN;
          else toValue = DRAWER_UP;
        } 
        // Se estiver fechado (DOWN) e puxar para cima (dy < 0), abrir (UP)
        else {
          if (dy < -80 || vy < -0.5) toValue = DRAWER_UP;
          else toValue = DRAWER_DOWN;
        }

        Animated.spring(drawerAnim, {
          toValue,
          bounciness: 2,
          speed: 12,
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 8, duration: 1000, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Zero Credits Alert Animation
    if (credits === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(nudgeAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(nudgeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      nudgeAnim.setValue(1);
    }
  }, [credits]);
  
  useEffect(() => {
    if (isDemoMode) {
      setDemoAnalysis(DEMO_ANALYSIS_SNAPSHOT);
      getSemanticService().loadAnalysis(DEMO_ANALYSIS_SNAPSHOT);
    } else {
      setDemoAnalysis(null);
      getSemanticService().loadAnalysis(null);
    }
  }, [isDemoMode]);

  const displayBiomarkers = useMemo(() => isDemoMode ? [
    { id: 'd1', name: 'Glicose (Demo)', value: '92', unit: 'mg/dL', source: 'ablute' },
    { id: 'd2', name: 'Sódio (Demo)', value: '138', unit: 'mEq/L', source: 'ablute' },
    { id: 'd3', name: 'SpO2 (Demo)', value: '99', unit: '%', source: 'health_kit' },
    { id: 'd4', name: 'Ritmo (Demo)', value: '72', unit: 'bpm', source: 'health_kit' },
  ] : RAW_BIOMARKERS, [isDemoMode]);

  const semanticBundle = useMemo(() => getSemanticService().getBundle(), [isDemoMode, analyses]);
  const domains = semanticBundle.domains || {};
  
  const displayThemes = useMemo(() => isDemoMode ? [
    {
      title: 'Cenário Simulado: Otimização',
      score: 94,
      iconName: 'Target',
      paragraph1: 'Este é um cenário de demonstração ativa. O sistema está a simular uma resposta biológica de alta performance.',
      paragraph2: 'Em modo DEMO, podes navegar pelos Resultados e validar a interpretação da IA sem necessidade de hardware real.',
      refText1: 'Simulação de rastro biográfico de alta fidelidade.',
      refText2: 'Ambiente de teste operacional.',
      suggestions: [
        { title: 'Explora os Resultados', desc: 'Clica em DADOS para ver os biomarcadores simulados.' },
        { title: 'Valida a Navegação', desc: 'Clica em TEMAS para ver esta interpretação detalhada.' }
      ]
    }
  ] : Object.values(domains).map(d => ({
    title: d.label.charAt(0).toUpperCase() + d.label.slice(1),
    score: d.score,
    iconName: d.domain === 'sleep' ? 'Moon' : d.domain === 'energy' ? 'Zap' : d.domain === 'performance' ? 'Target' : d.domain === 'recovery' ? 'Heart' : 'Activity',
    paragraph1: d.mainInsight?.summary || '',
    paragraph2: d.mainInsight?.description || '',
    refText1: '',
    refText2: '',
    suggestions: d.recommendations?.map(r => ({ title: r.title, desc: r.actionable })) || []
  })), [isDemoMode, domains]);

  // ── Gesture Handlers ──────────────────────────────────────────────────────
  const mainPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 10 || Math.abs(dy) > 10,
      onPanResponderRelease: (_, { x0, dx, dy }) => {
        // Left Edge Swipe -> AI Reading
        if (x0 < 60 && dx > 80) {
          navigation.navigate('Leitura AI');
        }
        // Right Edge Swipe -> Results
        if (x0 > width - 60 && dx < -80) {
          navigation.navigate('Resultados');
        }
        // Bottom Swipe Up -> App Drawer
        if (dy < -60) {
          Animated.spring(drawerAnim, { toValue: DRAWER_UP, useNativeDriver: false }).start(() => lastDrawerY.current = DRAWER_UP);
        }
      },
    })
  ).current;

  return (
    <Container safe style={styles.container}>
      {/* ── FULL SCREEN BACKGROUND ───────────────────────────────── */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />

      <View {...mainPanResponder.panHandlers} style={styles.mainView}>
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BrandLogo size="medium" />
            <TouchableOpacity 
              style={[styles.demoPill, isDemoMode && styles.demoPillActive]} 
              onPress={() => setIsDemoMode(!isDemoMode)}
            >
              <Typography variant="caption" style={[styles.demoText, isDemoMode && styles.demoTextActive]}>
                {isDemoMode ? 'DEMO ON' : 'DEMO'}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.topIconRow}>
              <TouchableOpacity 
                style={styles.iconCircle} 
                onPress={() => setShowTokensModal(true)}
              >
                <Animated.View style={{ transform: [{ scale: credits === 0 ? nudgeAnim : 1 }] }}>
                  <Image 
                    source={require('../../assets/token_abl.png')} 
                    style={{ 
                      width: 24,
                      height: 24, 
                      tintColor: credits === 0 ? theme.colors.primary : '#fff',
                      opacity: credits === 0 ? 0.7 : 0.95
                    }} 
                    resizeMode="contain"
                  />
                </Animated.View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Settings')}>
                <SlidersHorizontal size={20} color="#fff" />
              </TouchableOpacity>
              
              {isAuthenticated ? (
                <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Profile')}>
                  <User size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.iconCircle, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('Login')}>
                  <LogIn size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ── CENTRAL VISUAL (The HoloPulse) ────────────────────────────────── */}
        {/* Descido parcialmente para equilíbrio visual entre o topo e as abas laterais */}
        <Animated.View style={[styles.centerContainer, { transform: [{ translateY: Animated.add(centerContentY, -60) }] }]}>
          
          {/* Luz Envolvente (Auras) - Degradê Expansivo Ultra Suave e Sem Linhas Rígidas */}
          
          {/* Camada 4 - Glow Máximo/Externo */}
          <Animated.View style={{ 
            position: 'absolute', 
            width: 116 + 120 * glowRadiusFactor, 
            height: 220 + 120 * glowRadiusFactor, 
            borderRadius: 200, 
            backgroundColor: glowColor,
            opacity: 0.06,
            transform: [{ scale: pulseAnim }],
            ...(Platform.OS === 'web' ? { filter: `blur(${5 + 75 * glowRadiusFactor}px)` } as any : {
               shadowColor: glowColor, shadowOpacity: 0.4, shadowRadius: 5 + 75 * glowRadiusFactor, elevation: 30
            })
          }} />

          {/* Camada 3 - Glow Intermédio-Largo */}
          <Animated.View style={{ 
            position: 'absolute', 
            width: 116 + 80 * glowRadiusFactor, 
            height: 220 + 80 * glowRadiusFactor, 
            borderRadius: 140, 
            backgroundColor: glowColor,
            opacity: 0.12,
            transform: [{ scale: pulseAnim }],
            ...(Platform.OS === 'web' ? { filter: `blur(${5 + 45 * glowRadiusFactor}px)` } as any : {
               shadowColor: glowColor, shadowOpacity: 0.5, shadowRadius: 5 + 45 * glowRadiusFactor, elevation: 20
            })
          }} />

          {/* Camada 2 - Glow Intermédio-Próximo */}
          <Animated.View style={{ 
            position: 'absolute', 
            width: 116 + 40 * glowRadiusFactor, 
            height: 220 + 40 * glowRadiusFactor, 
            borderRadius: 100, 
            backgroundColor: glowColor,
            opacity: 0.22,
            transform: [{ scale: pulseAnim }],
            ...(Platform.OS === 'web' ? { filter: `blur(${2 + 25 * glowRadiusFactor}px)` } as any : {
               shadowColor: glowColor, shadowOpacity: 0.5, shadowRadius: 2 + 25 * glowRadiusFactor, elevation: 15
            })
          }} />

          {/* Camada 1 - Glow Base junto à cápsula */}
          <Animated.View style={{ 
            position: 'absolute', 
            width: 116 + 15 * glowRadiusFactor, 
            height: 220 + 15 * glowRadiusFactor, 
            borderRadius: 70, 
            backgroundColor: glowColor,
            opacity: 0.40,
            transform: [{ scale: pulseAnim }],
            ...(Platform.OS === 'web' ? { filter: `blur(${2 + 10 * glowRadiusFactor}px)` } as any : {
               shadowColor: glowColor, shadowOpacity: 0.6, shadowRadius: 2 + 10 * glowRadiusFactor, elevation: 5
            })
          }} />

          {/* Núcleo Central (POLIDO & ESCULTURAL) */}
          <View style={styles.capsuleShell}>
            {/* NOVO: Fundo em vídeo visível na calha/trilho da cápsula */}
            <Video
              source={require('../../assets/video (4).mp4')}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}
              resizeMode={ResizeMode.COVER}
              rate={0.02}
              shouldPlay
              isLooping
              isMuted
              pointerEvents="none"
            />
            {/* Camada para criar contraste atrás da roda */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.8)' }]} pointerEvents="none" />

            <Animated.View style={{ width: 116, height: 116, transform: [{ translateY: switchAnim }], zIndex: 9999 }} {...switchPanResponder.panHandlers}>
              <View style={styles.wheelKnob}>
                 <BioAnalysisOrbitalCore daysSinceText={daysSinceText} glowColor={glowColor} />
              </View>
            </Animated.View>

            {/* Setas Animadas para orientar o utilizador (REPOSICIONADAS) */}
            <View style={{ position: 'absolute', top: 130, left: 0, right: 0, alignItems: 'center' }}>
              <Animated.View style={{ transform: [{ translateY: arrowAnim }], opacity: 0.7 }}>
                <ChevronDown size={18} color={glowColor} strokeWidth={3} />
                <View style={{ marginTop: -10 }}>
                  <ChevronDown size={18} color={glowColor} strokeWidth={2} opacity={0.4} />
                </View>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* ── LEFT EDGE HANDLE: THEMES ──────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.leftEdgeHandle}
          onPress={() => navigation.navigate('Leitura AI')}
        >
          <View style={styles.edgeLabelContainer}>
            <Typography variant="caption" style={styles.edgeLabel}>LEITURA AI</Typography>
          </View>
        </TouchableOpacity>

        {/* ── RIGHT EDGE HANDLE: RESULTS ────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.rightEdgeHandle}
          onPress={() => navigation.navigate('Resultados')}
        >
          <View style={styles.edgeLabelContainer}>
            <Typography variant="caption" style={styles.edgeLabel}>RESULTADOS</Typography>
          </View>
        </TouchableOpacity>

        {/* Trigger inside drawer now handles interactions */}
      </View>



      {/* ── BOTTOM DRAWER: APPS ───────────────────────────────────────────── */}
      <Animated.View
        style={[styles.appDrawer, { transform: [{ translateY: drawerAnim }] }]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: drawerBgOpacity }]}>
          <BlurView intensity={90} tint="dark" style={styles.drawerContent} />
        </Animated.View>

        <Animated.View style={{ flex: 1, width: '100%', opacity: drawerInnerOpacity, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
          <View {...drawerPanResponder.panHandlers} style={{ zIndex: 10, width: '100%', backgroundColor: 'transparent' }}>
            <View style={styles.drawerHandleArea}>
              <View style={styles.drawerHandle} />
              <Typography variant="caption" style={styles.drawerTitle}>APP PLACE</Typography>
              
              {/* Footer Icons: Estilo Antigo (Maiores, com Label) */}
              <Animated.View style={[styles.footerIconsRow, { opacity: footerIconsOpacity }]}>
                {installedAppIds.length > 0 ? (
                  installedAppIds.map(id => {
                    const app = MINI_APP_CATALOG.find(a => a.id === id);
                    if (!app) return null;
                    return (
                      <View key={id} style={styles.footerIconWrapper}>
                        <View style={styles.footerIconCircle}>
                           {(() => {
                             const IconComp = { Brain, Utensils, Moon, Activity }[app.iconName || 'Activity'] || Activity;
                             return <IconComp size={22} color={app.iconColor || '#fff'} strokeWidth={1.2} />;
                           })()}
                        </View>
                        <Typography style={styles.footerIconLabel}>{app.name.replace(/_/g, '').toUpperCase()}</Typography>
                      </View>
                    );
                  })
                ) : (
                  <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, fontWeight: '800' }}>APP PLACE VAZIO</Typography>
                )}
              </Animated.View>
            </View>
          </View>

          <Animated.View style={{ flex: 1, width: '100%', opacity: appContentOpacity }}>
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.downloadList}>
                <Typography variant="caption" style={styles.sectionHeader}>Disponíveis</Typography>
                {MINI_APP_CATALOG.filter(app => app.availabilityStatus === 'available').map((app) => {
                  const isInstalled = (installedAppIds || []).includes(app.id);
                  return (
                    <TouchableOpacity 
                      key={app.id} 
                      style={[styles.downloadRow, isInstalled && styles.downloadRowInstalled]}
                      activeOpacity={isInstalled ? 0.7 : 1}
                      onPress={() => {
                        if (isInstalled) {
                          launchApp(app);
                          navigation.navigate('MiniApp', { app });
                        }
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[
                          styles.rowIcon, 
                          { backgroundColor: isInstalled ? app.iconBg : 'rgba(255,255,255,0.03)' }
                        ]}>
                           {(() => {
                             const IconComp = { Brain, Utensils, Moon, Activity }[app.iconName || 'Activity'] || Activity;
                             return <IconComp size={22} color={isInstalled ? app.iconColor : 'rgba(255,255,255,0.4)'} strokeWidth={1.5} />;
                           })()}
                        </View>
                        <View style={styles.rowInfo}>
                          <Typography style={[styles.rowTitle, !isInstalled && { opacity: 0.7 }]}>{app.name}</Typography>
                          <Typography variant="caption" style={styles.rowDesc}>{app.tagline}</Typography>
                        </View>
                        <View style={styles.rowActions}>
                          <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={(e) => {
                              e.stopPropagation(); // Prevenir abertura da app
                              setExpandedAppId(expandedAppId === app.id ? null : app.id);
                            }}
                          >
                            <Typography style={styles.actionText}>
                              {expandedAppId === app.id ? 'VER MENOS' : 'INFO'}
                            </Typography>
                          </TouchableOpacity>
                          
                          {isInstalled ? (
                            <TouchableOpacity 
                              style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                              onPress={(e) => {
                                e.stopPropagation();
                                launchApp(app);
                                navigation.navigate('MiniApp', { app });
                              }}
                            >
                              <Typography style={styles.actionText}>ABRIR</Typography>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              style={[styles.actionBtn, styles.installBtn]}
                              onPress={(e) => {
                                e.stopPropagation();
                                installApp(app.id);
                              }}
                            >
                              <Typography style={[styles.actionText, styles.installText]}>INSTALAR</Typography>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      
                      {expandedAppId === app.id && (
                        <Animated.View style={styles.expandedCard}>
                          {/* META INFO ROW */}
                          <View style={styles.metaInfoRow}>
                            <View style={styles.metaBadge}>
                              <Star size={12} color="#FFD700" fill="#FFD700" />
                              <Typography style={styles.metaBadgeText}>{app.rating || '0.0'}</Typography>
                            </View>
                            <View style={styles.metaBadge}>
                              <Typography style={[styles.metaBadgeText, { opacity: 0.5 }]}>VER {app.version}</Typography>
                            </View>
                            <View style={styles.metaBadge}>
                              <Typography style={[styles.metaBadgeText, { color: app.accentColor || theme.colors.primary }]}>
                                {CATEGORY_LABELS[app.category] || 'App'}
                              </Typography>
                            </View>
                          </View>

                          {/* SCREENSHOTS AREA */}
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            style={styles.screenshotScroll}
                            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                          >
                            {(app.screenshots && app.screenshots.length > 0) ? app.screenshots.map((ss, idx) => (
                              <Image key={idx} source={{ uri: ss }} style={styles.screenshotImg} />
                            )) : (
                              // Fallback elegante se não houver imagens
                              [1, 2].map((_, idx) => (
                                <View key={idx} style={[styles.screenshotImg, { backgroundColor: 'rgba(255,255,255,0.02)', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
                                  <Typography style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>SCREENSHOT {idx + 1}</Typography>
                                </View>
                              ))
                            )}
                          </ScrollView>

                          {/* DESCRIPTION AREA */}
                          <View style={styles.descContainer}>
                            <Typography style={styles.expandedPublisher}>{app.publisher || app.developer}</Typography>
                            <Typography style={styles.expandedDesc}>
                              {app.description}
                            </Typography>
                          </View>

                          {/* FOOTER ACTIONS */}
                          <View style={styles.expandedFooter}>
                            <TouchableOpacity 
                              style={styles.closeExpandedBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                setExpandedAppId(null);
                              }}
                            >
                              <Typography style={styles.closeExpandedText}>VER MENOS</Typography>
                            </TouchableOpacity>
                          </View>
                        </Animated.View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                <Typography variant="caption" style={[styles.sectionHeader, { marginTop: 40 }]}>Brevemente disponíveis</Typography>
                {MINI_APP_CATALOG.filter(app => app.availabilityStatus === 'coming_soon').map((app) => {
                  return (
                    <View key={app.id} style={[styles.downloadRow, { opacity: 0.6 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,255,255,0.02)' }]}>
                          <Typography style={{ fontSize: 20, opacity: 0.3 }}>{app.iconEmoji}</Typography>
                        </View>
                        <View style={styles.rowInfo}>
                          <Typography style={[styles.rowTitle, { opacity: 0.5 }]}>{app.name}</Typography>
                          <Typography variant="caption" style={styles.rowDesc}>{app.tagline}</Typography>
                        </View>
                        <View style={styles.rowActions}>
                          <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                          >
                            <Typography style={styles.actionText}>INFO</Typography>
                          </TouchableOpacity>
                          <View style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                            <Typography style={[styles.actionText, { opacity: 0.4 }]}>BREVEMENTE</Typography>
                          </View>
                        </View>
                      </View>
                      {expandedAppId === app.id && (
                        <Animated.View style={styles.expandedCard}>
                          <Typography style={styles.expandedDesc}>{app.description}</Typography>
                          <TouchableOpacity 
                            style={[styles.closeExpandedBtn, { alignSelf: 'center', marginTop: 10 }]}
                            onPress={() => setExpandedAppId(null)}
                          >
                            <Typography style={styles.closeExpandedText}>FECHAR</Typography>
                          </TouchableOpacity>
                        </Animated.View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Animated.View>


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
              <View style={styles.settingsRow}>
                <Typography style={styles.settingsLabel}>Modo de Análise</Typography>
                <Typography style={styles.settingsValueHighlight}>Pico Performance</Typography>
              </View>
              <View style={styles.settingsRow}>
                <Typography style={styles.settingsLabel}>Foco Principal (IA)</Typography>
                <Typography style={styles.settingsValueHighlight}>Equilíbrio Funcional</Typography>
              </View>
              <View style={styles.dividerModal} />
              <View style={styles.settingsRow}>
                <Typography style={styles.settingsLabel}>Sincronização HeathKit</Typography>
                <Typography style={styles.settingsValue}>Ativo</Typography>
              </View>
              <View style={styles.settingsRow}>
                <Typography style={styles.settingsLabel}>Notificações</Typography>
                <Typography style={styles.settingsValue}>Silenciadas</Typography>
              </View>
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

              <TouchableOpacity style={[styles.saveBtn, { width: '100%' }]} onPress={() => {}}>
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

      {/* ── TOKENS INFORMATION MODAL ────────────────────────────────────── */}
      <Modal visible={showTokensModal} transparent animationType="fade" onRequestClose={() => setShowTokensModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTokensModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={80} tint="dark" style={[styles.modalContent, { alignItems: 'center' }]}>
              
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Image 
                  source={require('../../assets/token_abl.png')} 
                  style={{ width: 40, height: 40 }} 
                  resizeMode="contain"
                />
              </View>
              
              <Typography variant="h2" style={{ textAlign: 'center', color: '#fff', marginBottom: 12 }}>Créditos</Typography>
              
              <Typography style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20, marginBottom: 24 }}>
                Os créditos serão usados para análises, interpretações e ações avançadas dentro do ecossistema ablute_.
              </Typography>

              <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                <Typography style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 4 }}>SALDO ATUAL</Typography>
                <Typography style={{ fontSize: 24, color: '#00F2FF', fontWeight: '800' }}>{credits ?? 0} TOKENS</Typography>
              </View>
              
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setShowTokensModal(false)}
              >
                <Typography style={styles.saveBtnText}>FECHAR</Typography>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── FOOTER PADDING FOR GESTURES ──────────────────────────────────── */}
      <View style={{ height: 20 }} />

    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020306',
  },
  banner: {
    backgroundColor: '#FF0000',
    padding: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  bannerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#00F2FF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  testText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  btn: {
    width: '100%',
    padding: 16,
    backgroundColor: '#005500',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
  },
  backBtn: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginTop: 20,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
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
    zIndex: 100,
  },
  headerLeft: {
    alignItems: 'flex-start',
    gap: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  topIconRow: {
    flexDirection: 'row',
    gap: 8,
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
  },
  tokenIconOnly: {
    padding: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  demoPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  demoPillActive: {
    backgroundColor: 'rgba(255, 100, 0, 0.15)',
    borderColor: 'rgba(255, 100, 0, 0.4)',
  },
  demoText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  demoTextActive: {
    color: '#FF6400',
  },
  panelActionBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  panelActionText: {
    color: '#00F2FF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 2,
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
    marginBottom: 0,
    backgroundColor: 'rgba(5,10,20,0.4)',
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
    top: '40%',
    width: 42,
    height: 100,
    backgroundColor: 'rgba(115, 188, 255, 0.06)',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(115, 188, 255, 0.15)',
  },
  rightEdgeHandle: {
    position: 'absolute',
    right: 0,
    top: '40%',
    width: 42,
    height: 100,
    backgroundColor: 'rgba(0, 212, 170, 0.06)',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(0, 212, 170, 0.15)',
  },
  edgePill: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 4,
  },
  edgeLabelContainer: {
    width: 140, 
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Garantir que não colapse em mobile estreito
  },
  edgeLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#fff',
    transform: [{ rotate: '90deg' }],
    width: 140,
    minWidth: 140, // Reforço de largura útil
    textAlign: 'center',
    opacity: 0.9,
    // Estilos Web para evitar elipse/truncamento
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
        wordBreak: 'keep-all',
      } as any
    })
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
  bioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  bioName: {
    color: '#fff',
    fontSize: 15,
  },
  bioValueArea: {
    alignItems: 'flex-end',
  },
  bioVal: {
    color: '#00F2FF',
    fontWeight: '700',
  },
  bioUnit: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
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
    color: 'rgba(255,255,255,0.8)',
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
    borderRadius: 20,
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
    gap: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.4,
    marginBottom: 16,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  downloadRow: {
    flexDirection: 'column',
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
  },
  downloadRowInstalled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
  // Expanded Card Details
  expandedCard: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  metaInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  screenshotScroll: {
    marginBottom: 24,
  },
  screenshotImg: {
    width: 200,
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  descContainer: {
    marginBottom: 24,
  },
  expandedPublisher: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  expandedDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  expandedFooter: {
    alignItems: 'center',
    paddingTop: 10,
  },
  closeExpandedBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeExpandedText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerIconsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  footerIconWrapper: {
    alignItems: 'center',
    width: 60,
  },
  footerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  footerIconLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    textAlign: 'center',
    lineHeight: 12,
  },
  capsuleShell: {
    width: 116, 
    height: 220, 
    borderRadius: 58, 
    overflow: 'hidden', 
    backgroundColor: 'rgba(10, 15, 30, 0.95)', 
    zIndex: 10, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.22)',
    paddingTop: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  wheelKnob: {
    width: 116, 
    height: 116, 
    borderRadius: 58, 
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalCore: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lensBase: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#000',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00F2FF',
    shadowColor: '#00F2FF',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  orbitalRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#00F2FF',
  },
  coreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  coreTopText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
    opacity: 0.6,
    marginBottom: 2,
  },
  coreMainText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    opacity: 0.9,
  }
});

// ── COMPONENTE LOCAL: BioAnalysisOrbitalCore ───────────────────────────
const BioAnalysisOrbitalCore = ({ daysSinceText, glowColor }: { daysSinceText: string, glowColor: string }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.orbitalCore}>
      {/* Deep Atmosphere */}
      <View style={styles.lensBase}>
         <LinearGradient
           colors={['rgba(5, 10, 20, 0.4)', 'rgba(0, 0, 0, 0.95)']}
           style={StyleSheet.absoluteFillObject}
         />
      </View>

      {/* Orbit 1: Fast & Small */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
         <View style={[styles.particle, { top: 20, left: 40, backgroundColor: glowColor, shadowColor: glowColor, opacity: 1 }]} />
         <View style={[styles.particle, { bottom: 25, right: 35, opacity: 0.7 }]} />
         <View style={[styles.orbitalRing, { width: 84, height: 84, borderRadius: 42, opacity: 0.3, alignSelf: 'center', marginTop: 16 }]} />
      </Animated.View>

      {/* Orbit 2: Slow & Large */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: reverseSpin }] }]}>
         <View style={[styles.particle, { top: 50, left: 15, width: 3, height: 3, backgroundColor: '#fff', opacity: 0.9 }]} />
         <View style={[styles.orbitalRing, { width: 98, height: 98, borderRadius: 49, opacity: 0.15, alignSelf: 'center', marginTop: 9 }]} />
      </Animated.View>

      {/* Curved Text - ÚLTIMA ANÁLISE */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]}>
         <Svg width="116" height="116" viewBox="0 0 116 116">
            <Path
               id="arcPath"
               d="M 16 58 A 42 42 0 0 1 100 58"
               fill="none"
               stroke="none"
            />
            <SvgText fill="#fff" fontSize="7" fontWeight="800" letterSpacing="1.5" opacity="0.6">
               <TextPath href="#arcPath" startOffset="50%" textAnchor="middle">
                  ÚLTIMA ANÁLISE
               </TextPath>
            </SvgText>
         </Svg>
      </View>

      {/* Central Labeling */}
      <View style={styles.coreTextContainer}>
         <Typography style={[styles.coreMainText, { color: glowColor, marginTop: 10 }]}>{daysSinceText}</Typography>
      </View>

      {/* Outer Glossy Rim */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: 58, borderWidth: 6, borderColor: 'rgba(255,255,255,0.03)' }]} pointerEvents="none" />
    </View>
  );
};
