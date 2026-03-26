import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, ScrollView, Platform, SafeAreaView, Modal, TextInput, Image, ActivityIndicator, FlatList, Pressable, Vibration, Alert } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeCard } from '../components/ThemeCard';
import { HistoricoModal } from '../components/HistoricoModal';
import { Utensils, Zap, SlidersHorizontal, Activity, Database, Smartphone, X, User, ChevronRight, Menu, Battery, Heart, Scale, Droplets, Target, Settings, RefreshCw, Moon, Droplet, Brain, ChevronsDown, Sparkles } from 'lucide-react-native';
// expo-linear-gradient and expo-blur: use require() guards to avoid web crash

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
import { useStore } from '../store/useStore';

const BIO_CATEGORIES = [
  {
    label: 'Análises de Urina',
    color: '#00F2FF',
    markers: [
      { name: 'F2-isoprostanos', value: '1,8', unit: 'ng/mg creatinina' },
      { name: 'Sódio urinário', value: '118', unit: 'mmol/L' },
      { name: 'Potássio urinário', value: '42', unit: 'mmol/L' },
      { name: 'Creatinina urinária', value: '128', unit: 'mg/dL' },
      { name: 'Albumina', value: '18', unit: 'mg/L' },
      { name: 'NGAL', value: '22', unit: 'ng/mL' },
      { name: 'KIM-1', value: '1,6', unit: 'ng/mL' },
      { name: 'Cistatina C', value: '0,11', unit: 'mg/L' },
      { name: 'Glicose', value: '0', unit: 'mg/dL' },
      { name: 'pH', value: '5,9', unit: '' },
      { name: 'Nitritos', value: 'Negativo', unit: '' },
      { name: 'Ureia', value: '1460', unit: 'mg/dL' },
      { name: 'Ácido úrico', value: '68', unit: 'mg/dL' },
    ],
  },
  {
    label: 'Monitorização Fisiológica',
    color: '#00D4AA',
    markers: [
      { name: 'ECG · FC repouso', value: '74', unit: 'bpm' },
      { name: 'ECG · HRV (RMSSD)', value: '27', unit: 'ms' },
      { name: 'ECG · Ritmo', value: 'Sinusal', unit: '' },
      { name: 'PPG · SpO2', value: '98', unit: '%' },
      { name: 'PPG · Perfusão', value: '4,2', unit: 'índice' },
      { name: 'Impedância · Água corporal', value: '52,1', unit: '%' },
      { name: 'Impedância · Gordura', value: '24,8', unit: '%' },
      { name: 'Impedância · Massa muscular', value: '31,4', unit: 'kg' },
      { name: 'Impedância · Ângulo de fase', value: '5,7', unit: '°' },
      { name: 'Peso', value: '74,8', unit: 'kg' },
      { name: 'Temperatura', value: '36,7', unit: '°C' },
    ],
  },
  {
    label: 'Avaliação Fecal',
    color: '#FFA500',
    markers: [
      { name: 'Bristol', value: 'Tipo 3', unit: '' },
      { name: 'Forma', value: 'Cilíndrica, contínua', unit: '' },
      { name: 'Textura', value: 'Fissuras visíveis', unit: '' },
      { name: 'Consistência', value: 'Média a firme', unit: '' },
      { name: 'Cor', value: 'Castanho escuro', unit: '' },
    ],
  },
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
    title: 'Trânsito Intestinal',
    score: 68,
    iconName: 'Target',
    paragraph1: 'Nível de alerta visual: Baixo, pela imagem isolada.',
    paragraph2: 'Padrão globalmente estável e organizado, sem aspeto de diarreia nem fragmentação marcada. A presença de fissuras e o aspeto compacto apontam para fezes algo mais secas do que o ideal, compatível com hidratação intestinal subótima ou trânsito intestinal ligeiramente lento.',
    refText1: 'Interpretação resumida: Evacuação formada e relativamente dentro do esperado, mas com sinais de ligeira secura. O padrão ideal estaria mais próximo de Bristol tipo 4, com superfície mais lisa e menor compactação.',
    refText2: 'Sinais que justificam atenção: Fezes negras tipo alcatrão, sangue vermelho visível, muco persistente, dor importante, esforço frequente, alteração mantida do padrão intestinal.',
    suggestions: [
      { title: 'Aumenta a ingestão de água ao longo do dia', desc: 'A hidratação intestinal subótima é uma das causas mais comuns de fezes mais secas e compactas.' },
      { title: 'Inclui fibra solúvel nas refeições', desc: 'Aveia, fruta com pele, leguminosas e vegetais ajudam a suavizar o trânsito e melhorar a consistência.' },
      { title: 'Mantém uma rotina de movimento regular', desc: 'A atividade física moderada é um dos estímulos mais eficazes para o trânsito intestinal saudável.' },
      { title: 'Evita períodos prolongados sem comer', desc: 'Refeições regulares ativam o reflexo gastrocólico e favorecem a regularidade intestinal.' }
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
      { title: 'Olha para o próximo treino como continuação da adaptação, não como teste de capacidade', desc: 'Neste momento, a consistência parece servir melhor o teu corpo do que tentar provar mais qualquer coisa hoje.' }
    ]
  }
];

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { width, height } = useWindowDimensions();
  const { installedAppIds, launchApp } = useStore();
  const themesFlatListRef = useRef<FlatList>(null);
  const themesPanelHeight = height;
  const [showProfile, setShowProfile] = useState(false);
  const [showControl, setShowControl] = useState(false);
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [bioTab, setBioTab] = useState(0);
  const [themesOpen, setThemesOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  // Profile Form State
  const [profileName, setProfileName] = useState('Atleta Base');
  const [profileAge, setProfileAge] = useState('34');
  const [profileWeight, setProfileWeight] = useState('78');
  const [profileHeight, setProfileHeight] = useState('180');
  const [profileGoal, setProfileGoal] = useState('Performance');

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

  // Mutable refs for edge gesture callbacks (avoid stale closures in PanResponder)
  const openThemesRef = useRef<() => void>(() => {});
  const openDataRef = useRef<() => void>(() => {});

  // ── Panel open/close helpers (sync animation + state for web backdrop) ────
  const openThemes = () => {
    setThemesOpen(true);
    Animated.spring(themesAnim, { toValue: 0, useNativeDriver: true }).start();
  };
  const closeThemes = () => {
    Animated.spring(themesAnim, { toValue: -width, useNativeDriver: true }).start(() => setThemesOpen(false));
  };
  const openData = () => {
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
          useNativeDriver: true,
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
    outputRange: [1, 0.35],
    extrapolate: 'clamp',
  });

  const centerContentY = drawerAnim.interpolate({
    inputRange: [DRAWER_UP, DRAWER_DOWN],
    outputRange: [-230, -80],
    extrapolate: 'clamp',
  });

  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web',
      onMoveShouldSetPanResponder: () => Platform.OS !== 'web',
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
      onMoveShouldSetPanResponder: () => false,
      onPanResponderRelease: (_, { x0, dx, dy }) => {
        // Left Edge Swipe -> Themes
        if (x0 < 60 && dx > 80) {
          Animated.spring(themesAnim, { toValue: 0, useNativeDriver: true }).start();
        }
        // Right Edge Swipe -> Data
        if (x0 > width - 60 && dx < -80) {
          Animated.spring(dataAnim, { toValue: 0, useNativeDriver: true }).start();
        }
        // Bottom Swipe Up -> App Drawer
        if (dy < -60) {
          Animated.spring(drawerAnim, { toValue: DRAWER_UP, useNativeDriver: false }).start(() => lastDrawerY.current = DRAWER_UP);
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
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      // Left edge swipe right → open Temas
      if (touchStartX < 60 && dx > 60 && Math.abs(dy) < 80) {
        setThemesOpen(true);
        Animated.spring(themesAnim, { toValue: 0, useNativeDriver: true }).start();
      }
      // Right edge swipe left → open Dados
      if (touchStartX > screenW - 60 && dx < -60 && Math.abs(dy) < 80) {
        setDataOpen(true);
        Animated.spring(dataAnim, { toValue: 0, useNativeDriver: true }).start();
      }
      // Bottom area swipe up → open drawer
      if (touchStartY > screenH - 160 && dy < -60 && Math.abs(dx) < 80) {
        Animated.spring(drawerAnim, { toValue: DRAWER_UP, bounciness: 0, useNativeDriver: false })
          .start(() => { lastDrawerY.current = DRAWER_UP; });
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleOpenMiniApp = (appId: string) => {
    console.log('[HomeScreen] Intentando abrir MiniApp:', appId);
    // Vibration.vibrate([0, 10, 5, 10]); // Padrão de vibração se quiseres manter
    
    const app = MINI_APP_CATALOG.find((a: any) => a.id === appId);
    if (app) {
      try {
        // Tentativa de navegação forçada para o topo
        const nav = navigation.getParent() || navigation;
        console.log('[HomeScreen] Navegando para MiniApp:', { appId, url: app.url });
        
        nav.navigate('MiniApp', {
          appId: app.id,
          name: app.name,
          url: app.url
        });
      } catch (err: any) {
        console.error('[HomeScreen] Erro na navegação:', err);
      }
    } else {
      console.warn('[HomeScreen] MiniApp não encontrada:', appId);
    }
  };

  return (
    <Container safe style={styles.container}>
      {/* ── FULL SCREEN BACKGROUND VIDEO ───────────────────────────────── */}
      <View style={StyleSheet.absoluteFillObject}>
        {Platform.OS !== 'web' && (() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { Video: NativeVideo, ResizeMode: NativeResizeMode } = require('expo-av');
          return (
            <NativeVideo
              source={require('../../assets/video (4).mp4')}
              style={StyleSheet.absoluteFillObject}
              resizeMode={NativeResizeMode.COVER}
              rate={0.05}
              shouldPlay
              isLooping
              isMuted
            />
          );
        })()}
        {Platform.OS === 'web' && (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#05070A' }]} />
        )}
        {/* Base darkening layer */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.95)' }]} pointerEvents="none" />

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

      {/* ── BACKDROP: only rendered (and pressable) when a panel is open ── */}
      {themesOpen && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: themesBackdropOpacity, zIndex: 10 }]}
        >
          {Platform.OS === 'web' && (
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeThemes} />
          )}
        </Animated.View>
      )}
      {dataOpen && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: dataBackdropOpacity, zIndex: 10 }]}
        >
          {Platform.OS === 'web' && (
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeData} />
          )}
        </Animated.View>
      )}

      {/* ── WEB EDGE GESTURE ZONES ─────────────────────────────────────────── */}
      {Platform.OS === 'web' && !themesOpen && (
        <View
          {...leftEdgeGesture.panHandlers}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 600 }}
        />
      )}
      {Platform.OS === 'web' && !dataOpen && (
        <View
          {...rightEdgeGesture.panHandlers}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 600 }}
        />
      )}

      <Animated.View
        {...mainPanResponder.panHandlers}
        style={[
          styles.mainView,
          {
            transform: [
              { translateX: homeShiftX },
              { scale: themesOpen ? homeShrinkFromThemes : homeShrinkFromData },
            ],
          },
        ]}
      >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <BrandLogo size="medium" />
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
        <Animated.View style={[styles.centerContainer, { transform: [{ translateY: centerContentY }, { scale: 0.6 }] }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>

            {/* Outer Blue Aura */}
            <View style={{ width: 240, height: 400, borderRadius: 120, shadowColor: '#00F2FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 55, elevation: 8 }}>
              {/* Middle Orange Aura */}
              <View style={{ width: 240, height: 400, borderRadius: 120, shadowColor: '#FF6F00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 35, elevation: 12 }}>
                {/* Inner Yellow Aura */}
                <View style={{ width: 240, height: 400, borderRadius: 120, shadowColor: '#FFE600', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 15, elevation: 18 }}>

                  {/* The Track Base */}
                  <View style={{ width: 240, height: 400, borderRadius: 120, overflow: 'hidden', backgroundColor: 'rgba(5, 10, 20, 0.4)', zIndex: 10 }}>

                    {/* Background Text / Slide CTA */}
                    <View style={{ position: 'absolute', bottom: 70, left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
                      <Animated.View style={{ opacity: arrowOpacity, transform: [{ translateY: arrowTranslate }], marginBottom: 16 }}>
                        <ChevronsDown size={28} color="#00F2FF" />
                      </Animated.View>
                      <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>8 dias desde</Typography>
                      <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>a última avaliação</Typography>
                    </View>

                    <Animated.View style={{ width: 240, height: 240, transform: [{ translateY: switchAnim }], zIndex: 9999 }} {...switchPanResponder.panHandlers}>
                      <View style={[styles.pulseContainer, { marginBottom: 0 }]} pointerEvents="box-none">
                        {/* Outer dynamically playing border */}
                        <View style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                        {Platform.OS !== 'web' && (() => {
                          const { Video: NV, ResizeMode: RM } = require('expo-av');
                          return (
                            <NV
                              source={require('../../assets/video (2).mp4')}
                              style={{ position: 'absolute', width: 240, height: 240, opacity: 1 }}
                              resizeMode={RM.COVER}
                              shouldPlay
                              isLooping
                              isMuted
                              pointerEvents="none"
                            />
                          );
                        })()}
                        </View>

                        {/* Inner primary holographic content */}
                        <View style={{ position: 'absolute', width: 223, height: 223, borderRadius: 111.5, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                          <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 111.5, overflow: 'hidden' }]} />
                          {Platform.OS !== 'web' && (() => {
                            const { Video: NV, ResizeMode: RM } = require('expo-av');
                            return (
                              <NV
                                source={require('../../assets/video (3).mp4')}
                                style={{ position: 'absolute', width: 223, height: 223, opacity: 0.9 }}
                                resizeMode={RM.COVER}
                                shouldPlay
                                isLooping
                                isMuted
                                pointerEvents="none"
                              />
                            );
                          })()}
                          <Image
                            source={require('../../assets/hologram_body.png')}
                            style={{ position: 'absolute', width: 223, height: 223, opacity: 0.3 }}
                            resizeMode="contain"
                          />

                          {/* Floating CTA over Hologram */}
                          <View style={{ position: 'absolute', zIndex: 10 }}>
                            <Typography style={{ color: '#00F2FF', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Deslize para atualizar</Typography>
                          </View>
                          <LinearGradient
                            colors={['rgba(0, 242, 255, 0.2)', 'rgba(0, 212, 170, 0.1)']}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: 111.5, overflow: 'hidden' }]}
                            pointerEvents="none"
                          />

                          {/* Inner diffuse mask (vignette effect) */}
                          <View style={[StyleSheet.absoluteFill, { borderRadius: 111.5, borderWidth: 15, borderColor: 'rgba(5,10,20,0.4)' }]} pointerEvents="none" />
                          <View style={[StyleSheet.absoluteFill, { borderRadius: 111.5, borderWidth: 10, borderColor: 'rgba(5,10,20,0.6)' }]} pointerEvents="none" />
                          <View style={[StyleSheet.absoluteFill, { borderRadius: 111.5, borderWidth: 5, borderColor: 'rgba(5,10,20,0.9)' }]} pointerEvents="none" />
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* ── LEFT EDGE HANDLE: THEMES ──────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.leftEdgeHandle}
          onPress={openThemes}
        >
          <Typography variant="caption" style={styles.edgeLabel}>TEMAS</Typography>
        </TouchableOpacity>

        {/* ── RIGHT EDGE HANDLE: BIODATA ────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.rightEdgeHandle}
          onPress={openData}
        >
          <Typography variant="caption" style={styles.edgeLabel}>DADOS</Typography>
        </TouchableOpacity>

        {/* Trigger inside drawer now handles interactions */}
      </Animated.View>


      {/* ── SIDE PANEL: THEMES (LEFT) ─────────────────────────────────────── */}
      <Animated.View style={[styles.sidePanel, styles.leftPanel, { transform: [{ translateX: themesAnim }] }]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>

          {/* ── Compact Header ── */}
          <View style={styles.themePanelHeader}>
            <View style={{ flex: 1 }}>
              <Typography style={styles.themePanelTitle}>INTERPRETAÇÃO DAS ANÁLISES POR IA</Typography>
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

          {/* ── Paginated FlatList ── */}
          <FlatList
            ref={themesFlatListRef}
            data={[
              { type: 'index' as const },
              ...MOCK_THEMES.map((t, i) => ({ type: 'card' as const, theme: t, idx: i })),
              { type: 'index_clone' as const },
            ]}
            keyExtractor={(_, i) => String(i)}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const pageIndex = Math.round(e.nativeEvent.contentOffset.y / themesPanelHeight);
              // If user scrolled to the clone at the end, silently jump to page 0
              if (pageIndex === MOCK_THEMES.length + 1) {
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
                      {/* Top section: accent line + label */}
                      <View style={styles.themeIndexDivider} />
                      <Typography style={styles.themeIndexLabel}>ÚLTIMAS ANÁLISES</Typography>

                      {/* Theme buttons */}
                      <View style={styles.themeIndexList}>
                        {MOCK_THEMES.map((t, i) => {
                          const scoreColor =
                            t.score === undefined ? '#73BCFF'
                            : t.score >= 75 ? '#00F2FF'
                            : t.score >= 50 ? '#FFA500'
                            : '#FF6060';
                          const IconCmp = ({ Activity: Activity, Zap: Zap, Target: Target, Heart: Heart, Moon: Moon, Brain: Brain, User: User } as any)[t.iconName || 'Activity'] || Activity;
                          return (
                            <TouchableOpacity
                              key={i}
                              style={styles.themeIndexBtn}
                              activeOpacity={0.7}
                              onPress={() => {
                                themesFlatListRef.current?.scrollToIndex({ index: i + 1, animated: true });
                              }}
                            >
                              <View style={[styles.themeIndexBtnIcon, { borderColor: scoreColor + '40' }]}>
                                <IconCmp size={16} color={scoreColor} />
                              </View>
                              <Typography style={styles.themeIndexBtnTitle}>{t.title}</Typography>
                              <View style={[styles.themeIndexScore, { backgroundColor: scoreColor + '20', borderColor: scoreColor + '50' }]}>
                                <Typography style={[styles.themeIndexScoreText, { color: scoreColor }]}>
                                  {t.score !== undefined ? t.score : t.textValue}
                                </Typography>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Bottom section: divider + Histórico button (no label) */}
                      <View style={styles.themeIndexDivider} />
                      <TouchableOpacity style={styles.themeHistoricoBtn} activeOpacity={0.6} onPress={() => setShowHistorico(true)}>
                        <Typography style={styles.themeIndexLabel}>HISTÓRICO</Typography>
                      </TouchableOpacity>

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
                    {/* Page indicator */}
                    <View style={styles.themePageIndicatorRow}>
                      <Typography style={styles.themePageIndicator}>{idx + 1} / {MOCK_THEMES.length}</Typography>
                    </View>

                    {/* The actual card — scrollable inside its page */}
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      <ThemeCard {...t} iconName={t.iconName as any} />
                    </ScrollView>

                    {/* Back to index */}
                    <TouchableOpacity
                      style={styles.themeBackBtn}
                      activeOpacity={0.7}
                      onPress={() => themesFlatListRef.current?.scrollToIndex({ index: 0, animated: true })}
                    >
                      <Typography style={styles.themeBackBtnText}>↑  índice</Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </BlurView>
      </Animated.View>

      {/* ── SIDE PANEL: DATA (RIGHT) ──────────────────────────────────────── */}
      <Animated.View style={[styles.sidePanel, styles.rightPanel, { transform: [{ translateX: dataAnim }] }]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.panelHeader}>
            <TouchableOpacity
              onPress={closeData}
              style={{ padding: 24 }}
              hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
            >
              <X size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <Typography variant="h2" style={styles.panelTitle}>Bioanálise</Typography>
          </View>

          {/* ── Tab Bar ── */}
          <View style={styles.bioTabBar}>
            {BIO_CATEGORIES.map((cat, i) => {
              const shortLabels = ['Urina', 'Fisiológica', 'Fecal'];
              const isActive = bioTab === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.bioTabBtn, isActive && { borderBottomColor: cat.color, borderBottomWidth: 2 }]}
                  onPress={() => setBioTab(i)}
                  activeOpacity={0.7}
                >
                  <Typography style={[
                    styles.bioTabLabel,
                    isActive ? { color: cat.color, fontWeight: '800' } : { color: 'rgba(255,255,255,0.4)' }
                  ]}>
                    {shortLabels[i]}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Active Tab Content ── */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelScroll}>
            {BIO_CATEGORIES[bioTab].markers.map((item, i) => (
              <View key={i} style={styles.bioRow}>
                <Typography style={styles.bioName}>{item.name}</Typography>
                <View style={styles.bioValueArea}>
                  <Typography style={styles.bioVal}>{item.value}</Typography>
                  {item.unit ? <Typography variant="caption" style={styles.bioUnit}>{item.unit}</Typography> : null}
                </View>
              </View>
            ))}
          </ScrollView>
        </BlurView>
      </Animated.View>

      {/* ── BOTTOM DRAWER: APPS ───────────────────────────────────────────── */}
      <Animated.View
        style={[styles.appDrawer, { transform: [{ translateY: drawerAnim }] }]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: drawerBgOpacity }]}>
          <View style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }]}>
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
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.85)' }]} pointerEvents="none" />
          </View>
          <View style={[StyleSheet.absoluteFillObject, styles.drawerContent, { backgroundColor: 'transparent' }]} pointerEvents="none" />
        </Animated.View>

        <Animated.View style={{ flex: 1, width: '100%', opacity: drawerInnerOpacity, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
          <View style={{ zIndex: 10, width: '100%', backgroundColor: 'transparent' }}>
            <TouchableOpacity
              {...(Platform.OS !== 'web' ? drawerPanResponder.panHandlers : {})}
              style={styles.drawerHandleArea}
              activeOpacity={Platform.OS === 'web' ? 0.7 : 1}
              onPress={Platform.OS === 'web' ? () => {
                const isDown = lastDrawerY.current >= DRAWER_DOWN / 2;
                const toValue = isDown ? DRAWER_UP : DRAWER_DOWN;
                Animated.spring(drawerAnim, { toValue, bounciness: 0, useNativeDriver: false })
                  .start(() => { lastDrawerY.current = toValue; });
              } : undefined}
            >
              <View style={styles.drawerHandle} />
              <Typography variant="caption" style={styles.drawerTitle}>APP PLACE</Typography>
            </TouchableOpacity>

            <Animated.View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
              <View style={styles.appGrid}>
                {[
                   { id: 'nutri-menu', name: 'Nutri\nMenu', icon: <Utensils size={24} color="#00D4AA" />, color: '#00D4AA' },
                   { id: 'femmhealth', name: 'Female\nHealth', icon: <View style={{ flexDirection: 'row', alignItems: 'center' }}><Typography style={{ color: '#FF6FBA', fontSize: 22, fontWeight: '800' }}>♀</Typography><Typography style={{ color: '#FF6FBA', fontSize: 16, fontWeight: '900', marginLeft: 2 }}>H</Typography></View>, color: '#FF6FBA' },
                   { id: 'longevity-secrets', name: 'Longevity\nSecrets', icon: <Sparkles size={24} color="#FFD700" />, color: '#FFD700' },
                 ].map((drawerApp) => {
                    const manifest = MINI_APP_CATALOG.find((m: any) => m.id === drawerApp.id);
                   const installed = installedAppIds.includes(drawerApp.id);
                   return (
                   <TouchableOpacity
                     key={drawerApp.id}
                     style={styles.appItem}
                     activeOpacity={0.7}
                     onPress={() => {
                       if (manifest && installed) {
                         launchApp(manifest);
                         navigation?.navigate('MiniApp', { app: manifest });
                       } else {
                         navigation?.navigate('Apps');
                       }
                     }}
                   >
                    <View style={[styles.appIconContainer, {
                      backgroundColor: 'rgba(5, 10, 20, 0.5)',
                      shadowColor: '#fff', // brilho externo suave
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 0 }
                    }]}>

                        {/* Curvatura 3D nas bordas (reflexo em cima, sombra funda em baixo) */}
                        <LinearGradient
                          colors={['rgba(255,255,255,0.35)', 'transparent', 'rgba(0,0,0,0.85)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[StyleSheet.absoluteFillObject, { borderRadius: 20, overflow: 'hidden' }]}
                          pointerEvents="none"
                        />

                        {/* Luz interna (brilho atravessando o cristal) */}
                        <LinearGradient
                          colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
                          start={{ x: 0.2, y: 0 }}
                          end={{ x: 0.8, y: 1 }}
                          style={[StyleSheet.absoluteFillObject, { borderRadius: 20, overflow: 'hidden' }]}
                          pointerEvents="none"
                        />

                      <View style={{ zIndex: 10 }}>{drawerApp.icon}</View>
                    </View>
                    <Typography variant="caption" style={[styles.appName, { textAlign: 'center', lineHeight: 12 }]}>{drawerApp.name}</Typography>
                  </TouchableOpacity>
                   );
                 })}
              </View>
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
                <View style={styles.downloadRow}>
                  <View style={styles.rowIcon}>
                    <Moon size={24} color="#00F2FF" opacity={0.6} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Typography style={styles.rowTitle}>Sleep+</Typography>
                    <Typography variant="caption" style={styles.rowDesc}>Otimização de Ciclos</Typography>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Typography style={styles.actionText}>INFO</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.installBtn]}>
                      <Typography style={[styles.actionText, styles.installText]}>INSTALAR</Typography>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.downloadRow}>
                  <View style={styles.rowIcon}>
                    <Droplet size={24} color="#00F2FF" opacity={0.6} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Typography style={styles.rowTitle}>HydraTrack</Typography>
                    <Typography variant="caption" style={styles.rowDesc}>Gestão de Água</Typography>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Typography style={styles.actionText}>INFO</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.installBtn]}>
                      <Typography style={[styles.actionText, styles.installText]}>INSTALAR</Typography>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.downloadRow}>
                  <View style={styles.rowIcon}>
                    <Brain size={24} color="#00F2FF" opacity={0.6} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Typography style={styles.rowTitle}>Mind</Typography>
                    <Typography variant="caption" style={styles.rowDesc}>Foco e Meditação</Typography>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Typography style={styles.actionText}>INFO</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.installBtn]}>
                      <Typography style={[styles.actionText, styles.installText]}>INSTALAR</Typography>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.downloadRow}>
                  <View style={styles.rowIcon}>
                    <Activity size={24} color="#00F2FF" opacity={0.6} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Typography style={styles.rowTitle}>Fasting</Typography>
                    <Typography variant="caption" style={styles.rowDesc}>Jejum Intermitente</Typography>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Typography style={styles.actionText}>INFO</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.installBtn]}>
                      <Typography style={[styles.actionText, styles.installText]}>INSTALAR</Typography>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.downloadRow}>
                  <View style={styles.rowIcon}>
                    <Heart size={24} color="#00F2FF" opacity={0.6} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Typography style={styles.rowTitle}>CardioSync</Typography>
                    <Typography variant="caption" style={styles.rowDesc}>Saúde Cardiovascular</Typography>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Typography style={styles.actionText}>INFO</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.installBtn]}>
                      <Typography style={[styles.actionText, styles.installText]}>INSTALAR</Typography>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.downloadRow}>
                  <View style={styles.rowIcon}>
                    <Target size={24} color="#00F2FF" opacity={0.6} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Typography style={styles.rowTitle}>MacroTrack</Typography>
                    <Typography variant="caption" style={styles.rowDesc}>Nutrição Detalhada</Typography>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Typography style={styles.actionText}>INFO</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.installBtn]}>
                      <Typography style={[styles.actionText, styles.installText]}>INSTALAR</Typography>
                    </TouchableOpacity>
                  </View>
                </View>
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
                  <Typography variant="caption" style={styles.profilePlan}>PRO · ATHLETE</Typography>
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

                <TouchableOpacity style={styles.saveBtn} onPress={() => setShowProfile(false)}>
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

      <HistoricoModal visible={showHistorico} onClose={() => setShowHistorico(false)} />

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
    zIndex: 100,
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
    top: '40%',
    width: 32,
    height: 80,
    backgroundColor: 'rgba(115, 188, 255, 0.08)',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(115, 188, 255, 0.2)',
    zIndex: 500,
  },
  rightEdgeHandle: {
    position: 'absolute',
    right: 0,
    top: '40%',
    width: 32,
    height: 80,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(0, 212, 170, 0.2)',
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  themeIndexBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
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
    gap: 16,
    paddingBottom: 40,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  bioTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
    marginBottom: 4,
  },
  bioTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  bioTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
