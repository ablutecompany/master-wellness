import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeCard } from '../components/ThemeCard';
import { Utensils, Zap, SlidersHorizontal, Activity, Database, Smartphone, X, User, ChevronRight, Menu } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';

const RAW_BIOMARKERS = [
  { id: 'b1',  name: 'NT-proBNP',      value: '120',      unit: 'pg/mL',  source: 'ablute' },
  { id: 'b2',  name: 'F2-isoprostanos', value: '2.4',      unit: 'ng/mg',  source: 'ablute' },
  { id: 'b3',  name: 'Sódio',          value: '140',      unit: 'mEq/L',  source: 'ablute' },
  { id: 'b4',  name: 'Potássio',       value: '4.2',      unit: 'mEq/L',  source: 'ablute' },
  { id: 'b5',  name: 'Potencial Redox', value: '-12',      unit: 'mV',     source: 'ablute' },
  { id: 'b6',  name: 'pH Urinário',    value: '6.2',      unit: 'pH',     source: 'ablute' },
  { id: 'b7',  name: 'Glicose',        value: '88',       unit: 'mg/dL',  source: 'ablute' },
  { id: 'b8',  name: 'Ritmo Cardíaco', value: '64',       unit: 'bpm',    source: 'health_kit' },
];

const MOCK_THEMES = [
  {
    title: 'Recuperação Muscular',
    score: 64,
    state: 'em stress',
    summary: 'O corpo está em modo catabólico moderado.',
    explanation: 'Rácio de cortisol elevado e desidratação celular detetada.',
    potential: '64 → 78',
    optimizations: [{ type: 'HÁBITO', description: 'Repouso ativo.' }]
  },
  {
    title: 'Performance Cognitiva',
    score: 82,
    state: 'ótimo',
    summary: 'Foco e neurotransmissores em equilíbrio.',
    explanation: 'Níveis de magnésio e estabilidade de HRV sugerem fase propícia para foco.',
    potential: '82 → 90',
    optimizations: [{ type: 'NUTRI', description: 'Manter hidratação.' }]
  }
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [showProfile, setShowProfile] = useState(false);
  const [showControl, setShowControl] = useState(false);

  // ── Animation States ──────────────────────────────────────────────────────
  const themesAnim = useRef(new Animated.Value(-width)).current;
  const dataAnim = useRef(new Animated.Value(width)).current;
  const drawerAnim = useRef(new Animated.Value(400)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Central Visual Animation ──────────────────────────────────────────────
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
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
          Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <Container safe style={styles.container}>
      <View {...mainPanResponder.panHandlers} style={styles.mainView}>
        {/* ── BACKGROUND VIDEO ─────────────────────────────────────────────── */}
        <View style={StyleSheet.absoluteFillObject}>
          <Video
            source={require('../../assets/background.mp4')}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        </View>

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
            <TouchableOpacity style={styles.evalBadge}>
              <Typography variant="caption" style={styles.evalText}>EVALUATION:</Typography>
              <Typography variant="caption" style={styles.evalVal}>8 DAYS AGO</Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CENTRAL VISUAL (The HoloPulse) ────────────────────────────────── */}
        <View style={styles.centerContainer}>
          <Animated.View style={[styles.pulseContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['rgba(0, 242, 255, 0.2)', 'rgba(0, 212, 170, 0.1)']}
              style={styles.orbInner}
            />
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Typography variant="h2" style={styles.centerLabel}>SISTEMA ATIVO</Typography>
          <Typography variant="caption" style={styles.centerSub}>Balanço Biométrico Estável</Typography>
        </View>

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

        {/* ── BOTTOM: APP DRAWER TRIGGER (always visible) ───────────────────── */}
        <TouchableOpacity
          style={styles.drawerTrigger}
          onPress={() => Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true }).start()}
        >
          <View style={styles.drawerHandle} />
          <Typography variant="caption" style={styles.drawerTitle}>APP PLACE</Typography>
        </TouchableOpacity>
      </View>


      {/* ── SIDE PANEL: THEMES (LEFT) ─────────────────────────────────────── */}
      <Animated.View style={[styles.sidePanel, styles.leftPanel, { transform: [{ translateX: themesAnim }] }]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.panelHeader}>
            <Typography variant="h2" style={styles.panelTitle}>Temas AI</Typography>
            <TouchableOpacity onPress={() => Animated.spring(themesAnim, { toValue: -width, useNativeDriver: true }).start()}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelScroll}>
            {MOCK_THEMES.map((theme, i) => (
              <ThemeCard key={i} {...theme} />
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
            <Typography variant="h2" style={styles.panelTitle}>Biodata</Typography>
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
      <Animated.View style={[styles.appDrawer, { transform: [{ translateY: drawerAnim }] }]}>
        <BlurView intensity={65} tint="dark" style={styles.drawerContent}>
          <TouchableOpacity 
            style={styles.drawerHandleArea} 
            onPress={() => Animated.spring(drawerAnim, { toValue: 400, useNativeDriver: true }).start()}
          >
            <View style={styles.drawerHandle} />
            <Typography variant="caption" style={styles.drawerTitle}>APP PLACE</Typography>
          </TouchableOpacity>
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
        </BlurView>
      </Animated.View>
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
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
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
    height: 400,
    zIndex: 400,
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
  }
});
