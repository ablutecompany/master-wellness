import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Typography, BlurView, LinearGradient } from '../components/Base';
import { X } from 'lucide-react-native';
import { MiniAppManifest, Permission, PERMISSION_LABELS } from './types';
import { useStore } from '../store/useStore';
import { useAnalytics } from './analytics';

interface PermissionSheetProps {
  app: MiniAppManifest;
  visible: boolean;
  onClose: () => void;
  onInstalled: () => void;
}

export const PermissionSheet: React.FC<PermissionSheetProps> = ({
  app,
  visible,
  onClose,
  onInstalled,
}) => {
  const [accepting, setAccepting] = useState(false);
  const { installApp, grantPermissions } = useStore();
  const { logEvent } = useAnalytics();

  const handleAccept = () => {
    setAccepting(true);
    grantPermissions(app.id, app.permissions);
    installApp(app.id);
    logEvent('APP_INSTALLED', app.id);
    setTimeout(() => {
      setAccepting(false);
      onInstalled();
    }, 350);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Handle */}
          <View style={styles.handleBar} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* App identity */}
            <View style={styles.appHeader}>
              <View style={[styles.iconCircle, { backgroundColor: app.iconBg, borderColor: app.iconColor + '30' }]}>
                <Typography style={[styles.iconEmoji, { color: app.iconColor }]}>
                  {app.iconEmoji}
                </Typography>
              </View>
              <View style={styles.appMeta}>
                <Typography style={styles.appName}>{app.name}</Typography>
                <Typography style={styles.appDev}>{app.developer}</Typography>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Permissions */}
            <Typography style={styles.sectionLabel}>ESTA APP SOLICITA ACESSO A</Typography>
            <View style={styles.permList}>
              {app.permissions.map((perm: Permission) => {
                const info = PERMISSION_LABELS[perm];
                return (
                  <View key={perm} style={styles.permRow}>
                    <View style={styles.permIcon}>
                      <Typography style={styles.permEmoji}>{info.icon}</Typography>
                    </View>
                    <View style={styles.permText}>
                      <Typography style={styles.permLabel}>{info.label}</Typography>
                      <Typography style={styles.permDesc}>{info.desc}</Typography>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* Trust note */}
            <Typography style={styles.trustNote}>
              As tuas informações são partilhadas de forma encriptada apenas com esta
              aplicação certificada pela ablute_. Podes revogar o acesso a qualquer momento
              nas definições do perfil.
            </Typography>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.acceptBtn, accepting && { opacity: 0.7 }]}
              onPress={handleAccept}
              activeOpacity={0.8}
              disabled={accepting}
            >
              <LinearGradient
                colors={[app.iconColor, app.iconColor + 'AA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptGradient}
              >
                <Typography style={styles.acceptText}>
                  {accepting ? 'A instalar…' : 'Aceitar & Instalar'}
                </Typography>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Typography style={styles.cancelText}>Cancelar</Typography>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 16 },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconEmoji: {
    fontSize: 28,
    fontWeight: '800',
  },
  appMeta: { flex: 1 },
  appName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  appDev: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 16,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  permList: { gap: 14 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  permIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permEmoji: { fontSize: 18 },
  permText: { flex: 1, paddingTop: 2 },
  permLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  permDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  trustNote: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
  },
  acceptBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  acceptGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontWeight: '500',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
