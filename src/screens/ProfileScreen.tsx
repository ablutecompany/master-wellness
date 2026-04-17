import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { User, CreditCard, Settings, LogOut, ChevronRight, Globe, Activity, Users, Utensils } from 'lucide-react-native';
import { GatingOverlay } from '../components/GatingOverlay';
import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';

import { Alert } from 'react-native';
import { supabase } from '../services/supabase';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const userName = useStore(Selectors.selectUserName);
  const credits = useStore(Selectors.selectCredits);
  const user = useStore(Selectors.selectUser);
  const isGuestMode = useStore(state => state.isGuestMode);
  const updateGuestProfile = useStore(state => state.updateGuestProfile);

  const handleEditName = () => {
    if (!isGuestMode) {
      Alert.alert('Funcionalidade em desenvolvimento', 'A edição de perfil para utilizadores autenticados será disponibilizada na próxima versão.');
      return;
    }

    if (Platform.OS === 'web') {
      const newName = window.prompt('Como gostarias de ser tratada?', userName !== 'Convidada' ? userName : '');
      if (newName !== null && newName !== '') {
        updateGuestProfile({ name: newName });
      }
      return;
    }

    Alert.prompt(
      'Editar Nome (Guest)',
      'Como gostarias de ser tratada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salvar', 
          onPress: (newName) => {
            if (newName) updateGuestProfile({ name: newName });
          } 
        }
      ],
      'plain-text',
      userName !== 'Convidada' ? userName : ''
    );
  };

  return (
    <Container safe style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={handleEditName}>
        <View style={styles.avatar}>
          <Settings size={40} color={theme.colors.background} />
        </View>
        <Typography variant="h2">Configurações</Typography>
        <Typography variant="caption" color={theme.colors.primary}>
          {userName} {isGuestMode && <Typography variant="caption">(Alterar Nome)</Typography>}
      </Typography>
      {/* T05: Explicit Profile Identification */}
      {user?.goals && user.goals.length > 0 && (
        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
          {user.goals.map(g => (
            <View key={g} style={{ backgroundColor: 'rgba(115,188,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Typography variant="caption" style={{ fontSize: 10 }}>{g}</Typography>
            </View>
          ))}
        </View>
      )}
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.creditsSection}>
          <View style={styles.creditsInfo}>
            <CreditCard size={24} color={theme.colors.primary} />
            <View style={styles.creditsText}>
              <Typography variant="h3">{credits} Créditos</Typography>
              <Typography variant="caption">Disponíveis para análise</Typography>
            </View>
          </View>
          <TouchableOpacity style={styles.buyBtn}>
            <Typography variant="caption" style={{ color: theme.colors.background, fontWeight: '700' }}>COMPRAR</Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>SISTEMA & PREFERÊNCIAS</Typography>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Globe size={20} color={theme.colors.text} />
            </View>
            <Typography style={styles.menuTitle}>Mapa de Equipamento</Typography>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OnboardingGoals')}>
            <View style={styles.menuIcon}>
              <User size={20} color={theme.colors.text} />
            </View>
            <Typography style={styles.menuTitle}>Definir Objetivos</Typography>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OnboardingPermissions')}>
            <View style={styles.menuIcon}>
              <Activity size={20} color={theme.colors.text} />
            </View>
            <Typography style={styles.menuTitle}>Inputs e Fontes de Dados</Typography>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {!isGuestMode && (
          <View style={styles.section}>
            <View style={{ marginBottom: 16 }}>
              <Typography variant="caption" style={styles.sectionTitle}>MÓDULOS FAMILIARES</Typography>
            </View>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => Alert.alert('Criar Agregado (Em Breve)', 'A criação e gestão central de agregados familiares será ativada na próxima versão através do ícone no ecrã principal.')}
            >
              <View style={styles.menuIcon}>
                <Users size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography style={styles.menuTitle}>Criar Agregado</Typography>
                <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 11 }}>Partilhar com a família</Typography>
              </View>
              <ChevronRight size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Settings size={20} color={theme.colors.text} />
            </View>
            <Typography style={styles.menuTitle}>Configurações Avançadas</Typography>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            if (isGuestMode) {
              useStore.getState().setGuestMode(false);
              useStore.getState().clearSensitiveState();
            } else {
              try {
                await supabase.auth.signOut();
                useStore.getState().setUser(null);
                useStore.getState().setSessionToken(null);
                useStore.getState().clearSensitiveState();
              } catch (e) {
                console.error("[Logout] Erro a deslogar:", e);
              }
            }
          }}
        >
          <LogOut size={20} color={theme.colors.error} />
          <Typography style={[styles.menuTitle, { color: theme.colors.error, marginLeft: 12 }]}>
            {isGuestMode ? 'Sair do modo Guest' : 'Terminar Sessão'}
          </Typography>
        </TouchableOpacity>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  creditsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.xl,
  },
  creditsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsText: {
    marginLeft: theme.spacing.md,
  },
  buyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
  },
  menuSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: 20,
    marginBottom: theme.spacing.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  }
});
