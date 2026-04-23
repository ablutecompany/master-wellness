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
        <Typography variant="h3" style={{ fontWeight: '600', letterSpacing: 0.5 }}>Definições</Typography>
        <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>CONFIGURAÇÃO DO SISTEMA</Typography>
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
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  menuSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    letterSpacing: 2.5,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardGroup: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  groupLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  menuTitle: {
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    padding: 0,
    margin: 0,
    minWidth: 120,
  },
});
