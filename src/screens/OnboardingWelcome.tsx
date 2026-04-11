import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Text,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';

// ── Subtle grain texture ──────────────────────────────────────────────────────
const TextureOverlay: React.FC = () => {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={width} height={height} opacity={0.07}>
        <Defs>
          <Pattern id="grain" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
            <Circle cx="1" cy="1" r="0.6" fill="white" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#grain)" />
      </Svg>
    </View>
  );
};

// ── Welcome Screen ────────────────────────────────────────────────────────────
export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.94)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(10)).current;

  const goLogin = () => navigation.navigate('Login');
  const goOnboarding = () => navigation.navigate('OnboardingGoals');

  useEffect(() => {
    // Stop auto-redirect on web and allow manual navigation
    if (Platform.OS === 'web') {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]).start();
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const logoGlow = Platform.OS === 'web'
    ? { textShadow: '0 0 18px rgba(255,255,255,0.38)' } as any
    : { shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 14 };

  const underGlow = Platform.OS === 'web'
    ? { textShadow: '0 0 22px rgba(115,188,255,0.75)' } as any
    : { shadowColor: '#73BCFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 18 };

  const taglineGlow = Platform.OS === 'web'
    ? { textShadow: '0 0 12px rgba(115,188,255,0.25)' } as any
    : {};

  return (
    <View style={styles.screen}>
      <TextureOverlay />

      <View style={styles.centerWrap}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Text style={[styles.logoText, logoGlow]}>
            {'ablute'}
            <Text style={[styles.logoUnder, underGlow]}>{'_'}</Text>
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
            marginTop: 20,
          }}
        >
          <Text style={[styles.tagline, taglineGlow]}>
            Sencing Your Wellbeing
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, { opacity: taglineOpacity }]}>
          <TouchableOpacity style={styles.primaryButton} onPress={goOnboarding}>
            <Text style={styles.primaryButtonText}>Começar Agora</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={goLogin}>
            <Text style={styles.secondaryButtonText}>Já tenho conta — Entrar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#010204',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: -2,
    marginBottom: 4,
  },
  logoUnder: {
    color: '#73BCFF',
    fontWeight: '400',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(115,188,255,0.5)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 80,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  primaryButton: {
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '400',
  },
});

