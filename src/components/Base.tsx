import React, { ReactNode } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle, ScrollView, SafeAreaView, Platform, Dimensions } from 'react-native';
import { theme } from '../theme';
// Web-safe fallbacks for expo imports to prevent Minified React error #130 on Web
export const LinearGradient = Platform.OS === 'web'
  ? ({ style, colors, ...props }: any) => (
    <View style={[style, { backgroundColor: colors?.[0] ?? 'rgba(0,0,0,0.8)' }]} {...props} />
  )
  : (() => { const { LinearGradient: LG } = require('expo-linear-gradient'); return LG; })();

export const BlurView = Platform.OS === 'web'
  ? ({ style, ...props }: any) => (
    <View style={[style, { backgroundColor: 'rgba(0,0,0,0.6)' }]} {...props} />
  )
  : (() => { const { BlurView: BV } = require('expo-blur'); return BV; })();

const { width, height } = Dimensions.get('window');

interface TypographyProps {
  children: ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
  color?: string;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  variant = 'body', 
  color = theme.colors.text, 
  style,
  numberOfLines 
}) => {
  return (
    <Text 
      style={[theme.typography[variant], { color }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

interface ContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  safe?: boolean;
  scroll?: boolean;
  withAura?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ children, style, safe, scroll, withAura = true }) => {
  const Content = scroll ? ScrollView : View;
  const Wrapper = safe ? SafeAreaView : View;

  return (
    <Wrapper style={styles.wrapper}>
      {withAura && (
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(0, 242, 255, 0.04)', 'transparent']}
            style={[styles.aura, { top: -height * 0.2, left: -width * 0.2 }]}
          />
          <LinearGradient
            colors={['rgba(0, 255, 149, 0.03)', 'transparent']}
            style={[styles.aura, { bottom: -height * 0.1, right: -width * 0.1 }]}
          />
        </View>
      )}
      <Content style={[styles.container, style]} contentContainerStyle={scroll ? styles.scrollContent : undefined}>
        {children}
      </Content>
    </Wrapper>
  );
};

export const GlassCard: React.FC<{ children: ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.glassCard, style]}>
    <BlurView intensity={Platform.OS === 'web' ? 10 : 25} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={styles.glassInner}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  aura: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 500 : undefined,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassInner: {
    padding: theme.spacing.lg,
  },
});
