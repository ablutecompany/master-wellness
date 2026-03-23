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

  const goHome = () => navigation.navigate('Main', { screen: 'Home' });

  useEffect(() => {
    Animated.sequence([
      // 1 — Logo fades + scales in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 2 — Brief pause, then tagline slides + fades up
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 3 — Hold for 3 seconds
      Animated.delay(3000),

      // 4 — Tagline fades out first
      Animated.timing(taglineOpacity, {
        toValue: 0,
        duration: 700,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),

      // 5 — Then logo fades out
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 700,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),

      // 6 — Navigate after fade
      Animated.delay(100),
    ]).start(({ finished }) => {
      if (finished) goHome();
    });
  }, []);

  // Web-safe glow: textShadow instead of shadow* (avoids box-shadow rectangle)
  const logoGlow    = Platform.OS === 'web'
    ? { textShadow: '0 0 18px rgba(255,255,255,0.38)' } as any
    : { shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 14 };

  const underGlow   = Platform.OS === 'web'
    ? { textShadow: '0 0 22px rgba(115,188,255,0.75)' } as any
    : { shadowColor: '#73BCFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 18 };

  const taglineGlow = Platform.OS === 'web'
    ? { textShadow: '0 0 12px rgba(115,188,255,0.25)' } as any
    : {};

  return (
    <TouchableOpacity style={styles.screen} activeOpacity={1} onPress={goHome}>
      <TextureOverlay />

      <View style={styles.centerWrap}>
        {/* Logo */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Text style={[styles.logoText, logoGlow]}>
            {'ablute'}
            <Text style={[styles.logoUnder, underGlow]}>{'_'}</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
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
      </View>
    </TouchableOpacity>
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
  },
  logoText: {
    fontSize: 36,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.90)',
    letterSpacing: -1.5,
  },
  logoUnder: {
    color: '#73BCFF',
    fontWeight: '600',
  },
  tagline: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(115,188,255,0.55)',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
