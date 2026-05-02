import { TextStyle } from 'react-native';

export const palette = {
  background: '#02040A', // Deep Midnight
  card: 'rgba(10, 20, 45, 0.4)', // Dark glass
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  primary: '#00F2FF', // Cyan Neon (Holographic feel)
  wellnessGreen: '#00FF95', // Vivid Wellness Emerald
  success: '#00FF95', 
  warning: '#FFD700', // Gold accent
  error: '#FF3B60',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.55)',
  overlay: 'rgba(2, 4, 10, 0.85)',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  biologicalBlue: '#00F2FF', 
  biologicalGreen: '#00FF95',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};

export const theme = {
  colors: palette,
  spacing,
  typography: typography as Record<string, TextStyle>,
};
