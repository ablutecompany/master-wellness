import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, ScrollView, Platform, SafeAreaView, Modal, TextInput, Image, ActivityIndicator } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeCard } from '../components/ThemeCard';
import { Utensils, Zap, SlidersHorizontal, Activity, Database, Smartphone, X, User, ChevronRight, Menu, Battery, Heart, Scale, Droplets, Target, Settings, RefreshCw, Moon, Droplet, Brain, LogIn, LogOut, Globe, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import { useStore } from '../store/useStore';

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
      { title: 'Olha para o próximo treino como continuação da adaptação, não como teste de capacidade', desc: 'Neste momento, a consistência parece servir melhor o teu corpo do que tentar provar mais qualquer coisa hoje.' }
    ]
  }
];

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { width, height } = useWindowDimensions();
  const [showControl, setShowControl] = useState(false);
  const [showNfcModal, setShowNfcModal] = useState(false);

  // Real Store State
  const user = useStore(state => state.user);
  const authAccount = useStore(state => state.authAccount);
  const isGuestMode = useStore(state => state.isGuestMode);
  const profileStatus = useStore(state => state.profileStatus);
  const analyses = useStore(state => state.analyses);
  const credits = useStore(state => state.credits);

  const isAuthenticated = !!authAccount || isGuestMode;
  const userName = user?.name || (isGuestMode ? 'Guest' : (authAccount?.email?.split('@')[0] || 'Utilizador'));

  // ── Animation States ──────────────────────────────────────────────────────
  const themesAnim = useRef(new Animated.Value(-width)).current;
  const dataAnim = useRef(new Animated.Value(width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(1)).current;

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
        let newY = (isOff.current ? 160 : 0) + gestureState.dy;
        if (newY < 0) newY = 0;
        if (newY > 160) newY = 160;
        switchAnim.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        let newY = (isOff.current ? 160 : 0) + gestureState.dy;
        let toValue = 0;
        // Se passar da métrica ou tiver pull rápido para baixo
        if (newY > 60 || gestureState.vy > 0.4) {
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

  const DRAWER_DOWN = 590;
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
    outputRange: [1, 0.25],
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
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 10,
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 10 || Math.abs(dy) > 10,
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

  return (
    <Container safe style={styles.container}>
      {/* ── FULL SCREEN BACKGROUND VIDEO ───────────────────────────────── */}
      <View style={StyleSheet.absoluteFillObject}>
        <Video
          source={require('../../assets/video (4).mp4')}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          rate={0.05}
          shouldPlay
          isLooping
          isMuted
        />
        {/* Base darkening layer */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.65)' }]} pointerEvents="none" />

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

      <View {...mainPanResponder.panHandlers} style={styles.mainView}>
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <BrandLogo size="medium" />
          <View style={styles.headerRight}>
            <View style={styles.topIconRow}>
              <TouchableOpacity 
                style={styles.tokenChip} 
                onPress={() => {
                  if (Platform.OS === 'web') alert(`Saldo atual: ${credits ?? 0} tokens para bio-análise.`);
                  else Alert.alert('Créditos', `Tens ${credits ?? 0} tokens disponíveis.`);
                }}
              >
                <Zap size={14} color="#000" fill="#000" />
                <Typography variant="caption" style={styles.tokenText}>{credits ?? 0}</Typography>
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
            <TouchableOpacity style={styles.evalBadge} onPress={() => navigation.navigate('Profile')}>
              <Typography variant="caption" style={styles.evalText}>{isAuthenticated ? userName.toUpperCase() : 'NÃO AUTENTICADO'}</Typography>
              <Typography variant="caption" style={styles.evalVal}>{isAuthenticated ? (user?.lastAnalysisDate ? 'ANÁLISE OK' : 'SEM ANÁLISES') : 'FAZER LOGIN'}</Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CENTRAL VISUAL (The HoloPulse) ────────────────────────────────── */}
        <Animated.View style={[styles.centerContainer, { transform: [{ translateY: centerContentY }] }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>

            {/* Outer Blue Aura */}
            <View style={{ width: 240, height: 400, borderRadius: 120, shadowColor: '#00F2FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 55, elevation: 8 }}>
              {/* Middle Orange Aura */}
              <View style={{ width: 240, height: 400, borderRadius: 120, shadowColor: '#FF6F00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 35, elevation: 12 }}>
                {/* Inner Yellow Aura */}
                <View style={{ width: 240, height: 400, borderRadius: 120, shadowColor: '#FFE600', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 15, elevation: 18 }}>

                  {/* The Track Base */}
                  <View style={{ width: 240, height: 400, borderRadius: 120, overflow: 'hidden', backgroundColor: 'rgba(5, 10, 20, 0.4)', zIndex: 10 }}>
                    <Animated.View style={{ width: 240, height: 240, transform: [{ translateY: switchAnim }], zIndex: 9999 }} {...switchPanResponder.panHandlers}>
                      <View style={[styles.pulseContainer, { marginBottom: 0 }]} pointerEvents="box-none">
                    {/* Outer dynamically playing border */}
                    <View style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                      <Video
                        source={require('../../assets/video (2).mp4')}
                        style={{ position: 'absolute', width: 240, height: 240, opacity: 1 }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                        pointerEvents="none"
                      />
                    </View>

                    {/* Inner primary holographic content */}
                    <View style={{ position: 'absolute', width: 223, height: 223, borderRadius: 111.5, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                      <Video
                        source={require('../../assets/video (3).mp4')}
                        style={{ position: 'absolute', width: 223, height: 223, opacity: 0.9 }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                        pointerEvents="none"
                      />
                      <Image
                        source={require('../../assets/hologram_body.png')}
                        style={{ position: 'absolute', width: 223, height: 223, opacity: 0.85 }}
                        resizeMode="contain"
                      />
                      <LinearGradient
                        colors={['rgba(0, 242, 255, 0.2)', 'rgba(0, 212, 170, 0.1)']}
                        style={StyleSheet.absoluteFillObject}
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
          onPress={() => Animated.spring(themesAnim, { toValue: 0, useNativeDriver: true }).start()}
        >
          <View style={styles.edgePill} />
          <Typography variant="caption" style={styles.edgeLabel}>TEMAS</Typography>
        </TouchableOpacity>

        {/* ── RIGHT EDGE HANDLE: BIODATA ────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.rightEdgeHandle}
          onPress={() => Animated.spring(dataAnim, { toValue: 0, useNativeDriver: true }).start()}
        >
          <View style={styles.edgePill} />
          <Typography variant="caption" style={styles.edgeLabel}>DADOS</Typography>
        </TouchableOpacity>

        {/* Trigger inside drawer now handles interactions */}
      </View>


      {/* ── SIDE PANEL: THEMES (LEFT) ─────────────────────────────────────── */}
      <Animated.View style={[styles.sidePanel, styles.leftPanel, { transform: [{ translateX: themesAnim }] }]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.panelHeader}>
            <Typography variant="h2" style={styles.panelTitle}>Interpretação das análises por IA</Typography>
            <TouchableOpacity onPress={() => Animated.spring(themesAnim, { toValue: -width, useNativeDriver: true }).start()}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelScroll}>
            {MOCK_THEMES.map((theme, i) => (
              <ThemeCard key={i} {...theme} iconName={theme.iconName as any} />
            ))}
          </ScrollView>
        </BlurView>
      </Animated.View>

      {/* ── SIDE PANEL: DATA (RIGHT) ──────────────────────────────────────── */}
      <Animated.View style={[styles.sidePanel, styles.rightPanel, { transform: [{ translateX: dataAnim }] }]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.panelHeader}>
            <TouchableOpacity onPress={() => Animated.spring(dataAnim, { toValue: width, useNativeDriver: true }).start()}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Typography variant="h2" style={styles.panelTitle}>Bio-análise</Typography>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelScroll}>
            {RAW_BIOMARKERS.map((item, i) => (
              <View key={i} style={styles.bioRow}>
                <Typography style={styles.bioName}>{item.name}</Typography>
                <View style={styles.bioValueArea}>
                  <Typography style={styles.bioVal}>{item.value}</Typography>
                  <Typography variant="caption" style={styles.bioUnit}>{item.unit}</Typography>
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
          <BlurView intensity={65} tint="dark" style={styles.drawerContent} />
        </Animated.View>

        <Animated.View style={{ flex: 1, width: '100%', opacity: drawerInnerOpacity, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
          <View {...drawerPanResponder.panHandlers} style={{ zIndex: 10, width: '100%', backgroundColor: 'transparent' }}>
            <View style={styles.drawerHandleArea}>
              <View style={styles.drawerHandle} />
              <Typography variant="caption" style={styles.drawerTitle}>APP PLACE</Typography>
            </View>

            <Animated.View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
              <View style={styles.appGrid}>
                {[
                  { id: '1', name: 'Nutri', icon: <Utensils size={24} color="#00F2FF" /> },
                  { id: '2', name: 'Female', icon: <Zap size={24} color="#00D4AA" /> },
                  { id: '3', name: 'MySup', icon: <Activity size={24} color="#FFD700" /> },
                ].map(app => (
                  <TouchableOpacity key={app.id} style={styles.appItem}>
                    <View style={styles.appIconContainer}>{app.icon}</View>
                    <Typography variant="caption" style={styles.appName}>{app.name}</Typography>
                  </TouchableOpacity>
                ))}
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
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'center',
    gap: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  tokenText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
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
  },
  edgePill: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 4,
  },
  edgeLabel: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.4)',
    writingDirection: 'ltr',
    transform: [{ rotate: '90deg' }],
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
});
