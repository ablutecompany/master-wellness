import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { ChevronRight, Globe, Activity, Settings, Shield, Bell, Eye, Database, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { TextInput, SafeAreaView } from 'react-native';
import { BlurView } from '../components/Base';

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
    <View style={styles.outerContainer}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <View>
              <Typography variant="h3" style={{ fontWeight: '700', color: '#fff' }}>Definições</Typography>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>CONFIGURAÇÃO DO SISTEMA</Typography>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.closeBtnCircle}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
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

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '800',
  },
  cardGroup: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  groupLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  menuTitle: {
    fontWeight: '600',
    color: '#fff',
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
    color: '#00F2FF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    padding: 0,
    margin: 0,
    minWidth: 120,
  },
});
