import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { ChevronRight, Globe, Activity, Settings, Shield, Bell, Eye, Database } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { TextInput } from 'react-native';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useStore(state => state.user);
  const isGuestMode = useStore(state => state.isGuestMode);
  const updateGuestProfile = useStore(state => state.updateGuestProfile);
  const updateAuthenticatedProfile = useStore(state => state.updateAuthenticatedProfile);

  const handleUpdateLocation = (val: string) => {
    const updates = { location: val };
    if (isGuestMode) {
      useStore.getState().updateGuestProfile(updates);
    } else {
      useStore.getState().updateAuthenticatedProfile(updates);
    }
  };

  return (
    <Container safe scroll withAura={true}>
      <View style={styles.header}>
        <Typography variant="h2" style={{ fontWeight: '700' }}>Definições</Typography>
        <Typography variant="caption" style={{ color: theme.colors.textMuted }}>Configuração do Sistema e Privacidade</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* 1. LOCALIZAÇÃO (Migrado do Perfil) */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>GEOGRAFIA & PRIVACIDADE</Typography>
          <View style={styles.cardGroup}>
            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Localização</Typography>
              <View style={styles.groupValueRow}>
                <TextInput
                  value={user?.location || user?.country || ''}
                  onChangeText={handleUpdateLocation}
                  placeholder="Cidade, País"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.inlineInput}
                />
              </View>
            </View>
            <View style={[styles.groupItem, { borderBottomWidth: 0 }]}>
              <Typography style={styles.groupLabel}>Fuso Horário</Typography>
              <Typography variant="caption">{user?.timezone || 'A detetar...'}</Typography>
            </View>
          </View>
        </View>

        {/* 2. SISTEMA & PREFERÊNCIAS (Migrado do Perfil) */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>SISTEMA & PREFERÊNCIAS</Typography>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.groupItem} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Mapa de Equipamento</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.groupItem, { borderBottomWidth: 0 }]} 
              onPress={() => navigation.navigate('OnboardingPermissions')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Activity size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Inputs e Fontes de Dados</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. CONFIGURAÇÕES AVANÇADAS (Migrado do Perfil) */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>AVANÇADO</Typography>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.groupItem} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Shield size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Privacidade e Segurança</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.groupItem} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Bell size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Notificações</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.groupItem, { borderBottomWidth: 0 }]} onPress={() => {}}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Settings size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                <Typography style={styles.menuTitle}>Configurações Técnicas</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginVertical: theme.spacing.xxl,
  },
  menuSection: {
    marginBottom: theme.spacing.xxl,
  },
  sectionLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
    fontWeight: '800',
    opacity: 0.8,
  },
  cardGroup: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  groupLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  menuTitle: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 15,
  },
  groupValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  inlineInput: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    padding: 0,
    margin: 0,
    minWidth: 120,
  },
});
