import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { Typography } from './Base';
import { theme } from '../theme';
import { Lock } from 'lucide-react-native';

export const GatingOverlay: React.FC<{ 
  isBlocked: boolean; 
  message: string; 
  actionLabel?: string; 
  onAction?: () => void; 
  children: React.ReactNode; 
  style?: ViewStyle;
}> = ({ isBlocked, message, actionLabel, onAction, children, style }) => {
  if (!isBlocked) return <>{children}</>;

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      <View style={{ opacity: 0.3, pointerEvents: 'none', minHeight: 150 }}>
        {Platform.OS === 'web' ? <View style={{ height: 300, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20 }} /> : children}
      </View>
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <Lock size={28} color={theme.colors.primary} style={{ marginBottom: 12 }} />
        <Typography variant="h3" style={{ textAlign: 'center', marginBottom: 16, color: '#fff' }}>
          {message}
        </Typography>
        {actionLabel && onAction && (
          <TouchableOpacity style={styles.btn} onPress={onAction}>
            <Typography style={{ color: '#000', fontWeight: '600', fontSize: 13 }}>
              {actionLabel}
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(5,7,10,0.7)',
    borderRadius: 24,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  }
});
