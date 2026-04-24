import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { 
  ChevronRight, 
  Camera, 
  Globe, 
  Activity, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  X,
  User,
  CreditCard
} from 'lucide-react-native';
import { GatingOverlay } from '../components/GatingOverlay';
import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';

import { Alert, Modal, SafeAreaView, Dimensions, TextInput } from 'react-native';
import { supabase } from '../services/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const userName = useStore(Selectors.selectUserName);
  const credits = useStore(Selectors.selectCredits);
  const user = useStore(Selectors.selectUser);
  const isGuestMode = useStore(state => state.isGuestMode);
  const updateGuestProfile = useStore(state => state.updateGuestProfile);
  const authAccount = useStore(state => state.authAccount);
  const household = useStore(Selectors.selectHousehold);
  const activeMemberId = useStore(Selectors.selectActiveMemberId);
  const setActiveMember = useStore(state => state.setActiveMember);

  const [isScanningQRCode, setIsScanningQRCode] = React.useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = React.useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 0. EDIT MODE STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [localUpdates, setLocalUpdates] = React.useState<any>({});
  const [isSaving, setIsSaving] = React.useState(false);

  // Derived user with local changes applied
  const displayUser = React.useMemo(() => ({ ...user, ...localUpdates }), [user, localUpdates]);
  const displayUserName = localUpdates.fullName || localUpdates.name || (user?.fullName || user?.name);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. BOOT & SYNC EFFECTS
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let tz = user?.timezone;
    if (!tz) {
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { tz = 'UTC'; }
    }

    if (!user?.country || !user?.timezone) {
       const fetchCountryAndSave = async (fallbackTz: string) => {
         let countryCode = user?.country || '';
         if (!countryCode) {
           try {
             // Fallback IP Geo
             const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { headers: { Accept: 'application/json' } });
             if (res.ok) {
               const data = await res.json();
               countryCode = data.country || '';
             }
           } catch { }
         }

         const updates: any = {};
         if (!user?.timezone && fallbackTz) updates.timezone = fallbackTz;
         // Assign countryCode even if empty, so it clears the "A detetar..." loop
         if (user?.country === undefined) updates.country = countryCode;

         if (Object.keys(updates).length > 0) {
            if (useStore.getState().isGuestMode) { useStore.getState().updateGuestProfile(updates); } else { useStore.getState().updateAuthenticatedProfile(updates); }
         }
       };

       if (!user?.country && Platform.OS === 'web' && 'geolocation' in navigator && (navigator as any).permissions) {
         (navigator as any).permissions.query({ name: 'geolocation' }).then((result: any) => {
           if (result.state === 'granted') {
             navigator.geolocation.getCurrentPosition(
               async (pos) => {
                 try {
                   const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
                   const data = await res.json();
                   const code = data.address?.country || '';
                   const updates: any = {};
                   if (!user?.timezone && tz) updates.timezone = tz;
                   // Assign code even if empty, to halt loop
                   if (user?.country === undefined) updates.country = code;
                   if (Object.keys(updates).length > 0) {
                      if (useStore.getState().isGuestMode) useStore.getState().updateGuestProfile(updates); else useStore.getState().updateAuthenticatedProfile(updates);
                   }
                 } catch { fetchCountryAndSave(tz || ''); }
               },
               () => fetchCountryAndSave(tz || ''),
               { timeout: 5000 }
             );
           } else {
             fetchCountryAndSave(tz || '');
           }
         }).catch(() => fetchCountryAndSave(tz || ''));
       } else {
          fetchCountryAndSave(tz || '');
       }
    }
  }, [user?.timezone, user?.country, isGuestMode]);


  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EDIT HANDLERS (CONSOLIDATED)
  // ─────────────────────────────────────────────────────────────────────────────
  const updateProfileField = (updates: any) => {
    if (isEditMode) {
      setLocalUpdates((prev: any) => ({ ...prev, ...updates }));
    } else {
      // Direct update for boot/auto-sync logic
      if (isGuestMode) {
        useStore.getState().updateGuestProfile(updates);
      } else {
        useStore.getState().updateAuthenticatedProfile(updates);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isGuestMode) {
        useStore.getState().updateGuestProfile(localUpdates);
      } else {
        await useStore.getState().updateAuthenticatedProfile(localUpdates);
      }
      setIsEditMode(false);
      setLocalUpdates({});
      if (Platform.OS === 'web') alert('Perfil atualizado com sucesso.');
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') alert('Falha ao guardar perfil.');
      else Alert.alert('Erro', 'Falha ao guardar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalUpdates({});
    setIsEditMode(false);
  };

  const handleEditName = () => {
    if (!isEditMode) return;
    const defaultName = displayUserName || '';
    const title = isGuestMode ? 'Editar Nome (Guest)' : 'Editar Nome';
    const msg = 'Como gostarias de ser tratada?';

    if (Platform.OS === 'web') {
      const newName = window.prompt(msg, defaultName);
      if (newName !== null && newName.trim() !== '') {
        updateProfileField({ name: newName.trim(), fullName: newName.trim() });
      }
      return;
    }

    Alert.prompt(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val: string | undefined) => val?.trim() && updateProfileField({ name: val.trim(), fullName: val.trim() }) }
    ], 'plain-text', defaultName);
  };

  const handleEditDateOfBirth = () => {
    if (!isEditMode) return;
    const current = displayUser?.dateOfBirth || displayUser?.birthDate || '';
    const msg = 'Insere a tua data de nascimento (AAAA-MM-DD):';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val.trim()) && val.trim() !== '') {
          alert('Formato inválido. Usa AAAA-MM-DD.');
          return;
        }
        updateProfileField({ dateOfBirth: val.trim(), birthDate: val.trim() });
      }
      return;
    }

    Alert.prompt('Data de Nascimento', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val: string | undefined) => {
        if (val?.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
          Alert.alert('Erro', 'Formato inválido. Usa AAAA-MM-DD.');
          return;
        }
        updateProfileField({ dateOfBirth: val?.trim() || '', birthDate: val?.trim() || '' });
      }}
    ], 'plain-text', current);
  };

  const handleEditHeight = () => {
    if (!isEditMode) return;
    const current = displayUser?.height ? String(displayUser.height) : '';
    const msg = 'Insere a tua altura em cm:';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null && val.trim() !== '') {
        const num = parseInt(val.trim(), 10);
        if (isNaN(num) || num < 50 || num > 300) {
          alert('Altura inválida. Usa um número em cm.');
          return;
        }
        updateProfileField({ height: num });
      }
      return;
    }

    Alert.prompt('Altura', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val: string | undefined) => {
        const num = parseInt(val?.trim() || '', 10);
        if (!isNaN(num) && num >= 50 && num <= 300) {
          updateProfileField({ height: num });
        } else if (val?.trim()) {
          Alert.alert('Erro', 'Altura inválida.');
        }
      }}
    ], 'plain-text', current, 'numeric');
  };

  const handleEditSex = () => {
    if (!isEditMode) return;
    const current = displayUser?.genderIdentity || displayUser?.sex || '';
    const msg = 'Insere o teu sexo (M, F ou vazio):';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null) {
        const clean = val.trim().toUpperCase();
        if (clean !== '' && clean !== 'M' && clean !== 'F') {
          alert('Sexo inválido (M/F).');
          return;
        }
        updateProfileField({ sex: clean || null, genderIdentity: clean || null });
      }
      return;
    }

    Alert.prompt('Sexo', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val: string | undefined) => {
        const clean = val?.trim().toUpperCase();
        if (clean === '' || clean === 'M' || clean === 'F') {
          updateProfileField({ sex: clean || null, genderIdentity: clean || null });
        } else {
          Alert.alert('Erro', 'Use M ou F.');
        }
      }}
    ], 'plain-text', current);
  };

  const handleEditWeight = () => {
    if (!isEditMode) return;
    const current = displayUser?.weight?.manualValue ? String(displayUser.weight.manualValue) : (displayUser?.weight?.value ? String(displayUser.weight.value) : '');
    const msg = 'Peso (kg) ou vazio para automático:';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val === null) return;
      
      if (val.trim() === '') {
        const measured = displayUser?.weight?.measuredValue || null;
        updateProfileField({ weight: { value: measured, source: measured ? 'measured' : 'missing', manualValue: null, measuredValue: measured, isDiscrepant: false } });
        return;
      }

      const num = parseFloat(val.trim().replace(',', '.'));
      if (isNaN(num) || num < 20 || num > 300) {
        alert('Peso inválido.');
        return;
      }
      const measured = displayUser?.weight?.measuredValue || null;
      updateProfileField({ weight: { value: num, source: 'manual', manualValue: num, measuredValue: measured, isDiscrepant: measured !== null && Math.abs(num - measured) >= 2.5 } });
      return;
    }

    Alert.prompt('Peso', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val: string | undefined) => {
        if (val?.trim() === '') {
          const m = displayUser?.weight?.measuredValue || null;
          updateProfileField({ weight: { value: m, source: m ? 'measured' : 'missing', manualValue: null, measuredValue: m, isDiscrepant: false } });
        } else {
          const num = parseFloat(val?.trim().replace(',', '.') || '');
          if (!isNaN(num)) {
            const m = displayUser?.weight?.measuredValue || null;
            updateProfileField({ weight: { value: num, source: 'manual', manualValue: num, measuredValue: m, isDiscrepant: m !== null && Math.abs(num - m) >= 2.5 } });
          }
        }
      }}
    ], 'plain-text', current, 'numeric');
  };

  const handleEditLocation = () => {
    if (!isEditMode) return;
    const current = displayUser?.location || displayUser?.country || '';
    const msg = 'Insere a tua localização (País/Cidade):';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null) updateProfileField({ country: val.trim(), location: val.trim() });
      return;
    }

    Alert.prompt('Localização', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val: string | undefined) => updateProfileField({ country: val?.trim() || '', location: val?.trim() || '' }) }
    ], 'plain-text', current);
  };

  const handleEditAvatar = () => {
    if (!isEditMode) return;
    const msg = 'URL da imagem do avatar:';
    const current = displayUser?.avatarUrl || '';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null) updateProfileField({ avatarUrl: val.trim() });
      return;
    }

    Alert.prompt('Avatar', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val: string | undefined) => updateProfileField({ avatarUrl: val?.trim() || '' }) }
    ], 'plain-text', current);
  };


  const userAge = calculateAge(displayUser?.dateOfBirth || (displayUser as any)?.birthDate);

  const isProfileComplete = Boolean(
    (displayUser?.fullName || displayUser?.name) && (displayUser?.fullName || displayUser?.name) !== 'Convidada' &&
    (displayUser?.dateOfBirth || (displayUser as any)?.birthDate) &&
    displayUser?.height
  );

  const measurementsCount = useStore.getState().measurements?.length || 0;
  const exportedContextsCount = useStore.getState().exportedContexts?.length || 0;
  const pendingInvitesCount = household?.invitations?.filter((i: any) => i.status === 'pending').length || 0;
  const dependentsCount = household ? household.members.length : 0;

  const setupItems: Array<{ id: string, title: string, desc: string, icon: any, action: () => void }> = [];

  if (!isProfileComplete) {
    setupItems.push({
      id: 'profile', title: 'Completar Perfil', desc: 'Idade e Altura são essenciais para bioanálises exatas.',
      icon: <User size={14} color={theme.colors.primary} />,
      action: () => {
        const h = window.prompt("A sua altura em cm (ex: 175):");
        if (h && !isNaN(Number(h))) {
          const dob = window.prompt("A sua data de nascimento (YYYY-MM-DD):");
          if (dob) {
            if (isGuestMode) useStore.getState().updateGuestProfile({ height: Number(h), dateOfBirth: dob }); else useStore.getState().updateAuthenticatedProfile({ height: Number(h), dateOfBirth: dob });
          }
        }
      }
    });
  }

  if (dependentsCount === 0) {
    setupItems.push({
      id: 'household', title: 'Criar Household', desc: 'Mapeie o seu agregado familiar e centralize exames.',
      icon: <Users size={14} color="#FFA500" />,
      action: () => {
        const name = window.prompt("Nome do novo membro:");
        if (name && name.trim() !== '') {
          const id = 'mem_' + Date.now();
          useStore.getState().addHouseholdMember({
            id, role: 'dependent', profile: { id, name: name.trim() },
            permissions: { results: 'private', context: 'private' },
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          });
        }
      }
    });
  }

  if (pendingInvitesCount > 0) {
    setupItems.push({
      id: 'invites', title: 'Convites Pendentes', desc: 'Existem contas por emparelhar no seu agregado.',
      icon: <Activity size={14} color="#FF6060" />,
      action: () => { alert('Role para baixo até ao Agregado para gerir os convites pendentes.'); }
    });
  }

  if (measurementsCount === 0) {
    setupItems.push({
      id: 'data', title: 'Primeira Sincronização', desc: 'Aguardando fluxo biométrico dos seus dispositivos.',
      icon: <Activity size={14} color="#00D4AA" />,
      action: () => navigation.navigate('Home')
    });
  }

  if (exportedContextsCount === 0) {
    setupItems.push({
      id: 'context', title: 'Ativar Mini-Apps', desc: 'Alimente o contexto comportamental para IA mais astuta.',
      icon: <Globe size={14} color="#9D00FF" />,
      action: () => navigation.navigate('Home', { screen: 'MiniApp' })
    });
  }

  return (
    <Container safe scroll withAura={true}>
      {/* 0. STICKY EDIT BAR */}
      <View style={{ 
        position: Platform.OS === 'web' ? 'sticky' : 'relative', 
        top: 0, 
        zIndex: 100, 
        backgroundColor: isEditMode ? theme.colors.primary + 'EE' : 'transparent',
        borderBottomWidth: isEditMode ? 1 : 0,
        borderColor: 'rgba(255,255,255,0.2)'
      } as any}>
        <View style={{ 
          padding: 12, 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: 500,
          alignSelf: 'center',
          width: '100%'
        }}>
          {isEditMode ? (
            <>
              <TouchableOpacity onPress={handleCancel} disabled={isSaving} style={{ padding: 8 }}>
                <Typography style={{ color: 'white', fontWeight: 'bold' }}>CANCELAR</Typography>
              </TouchableOpacity>
              <Typography style={{ color: 'white', fontWeight: 'bold' }}>MODO EDIÇÃO</Typography>
              <TouchableOpacity onPress={handleSave} disabled={isSaving} style={{ 
                backgroundColor: 'white', 
                paddingHorizontal: 16, 
                paddingVertical: 6, 
                borderRadius: 8,
                opacity: isSaving ? 0.7 : 1
              }}>
                <Typography style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {isSaving ? 'A GUARDAR...' : 'GUARDAR'}
                </Typography>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View />
              <TouchableOpacity 
                onPress={() => setIsEditMode(true)} 
                style={{ 
                  backgroundColor: theme.colors.primary, 
                  paddingHorizontal: 20, 
                  paddingVertical: 8, 
                  borderRadius: 12,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5
                }}
              >
                <Typography style={{ color: 'white', fontWeight: 'bold', letterSpacing: 1 }}>EDITAR PERFIL</Typography>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatar} onPress={handleEditAvatar} disabled={!isEditMode}>
            {displayUser?.avatarUrl ? (
              <Image source={{ uri: displayUser.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <User size={40} color="white" />
            )}
            {isEditMode && (
               <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, borderRadius: 12, padding: 4, borderWidth: 2, borderColor: theme.colors.background }}>
                  <Activity size={12} color="white" />
               </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Main', { screen: 'Home' })} 
            style={styles.closeButton}
          >
            <X size={24} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <Typography variant="h2" style={{ fontWeight: '700' }}>
            {displayUserName || 'Utilizador'}
          </Typography>
          <Typography variant="caption" style={{ color: theme.colors.textMuted }}>
            {displayUser?.email || (authAccount?.email) || 'Sem email associado'}
          </Typography>
          <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 8, marginTop: 4 }}>
             BUILD V2.2-DEMO | {isGuestMode ? 'GUEST' : 'AUTH'}
          </Typography>
        </View>

        {setupItems.length > 0 && (
          <View style={{ marginBottom: theme.spacing.xl, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <Typography variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 16, letterSpacing: 1, fontWeight: '700' }}>
              MATURIDADE DO ECOSSISTEMA ({5 - setupItems.length}/5)
            </Typography>
            <View style={{ gap: 8 }}>
              {setupItems.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  onPress={item.action}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    {item.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>{item.title}</Typography>
                    <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 15 }}>{item.desc}</Typography>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {household && (
          <View style={[styles.menuSection, { marginBottom: theme.spacing.xl }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <Typography variant="caption" style={styles.sectionLabel}>{household.name.toUpperCase()}</Typography>
              {!activeMemberId && <Typography variant="caption" style={{ color: theme.colors.textMuted }}>O Meu Perfil Base</Typography>}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                onPress={() => setActiveMember(null)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                  backgroundColor: !activeMemberId ? theme.colors.primary : theme.colors.card,
                  borderColor: theme.colors.cardBorder, borderWidth: 1
                }}>
                  <Typography variant="caption" style={{ color: !activeMemberId ? theme.colors.background : theme.colors.text }}>Eu (Root)</Typography>
              </TouchableOpacity>
              {household.members.map(m => (
                <TouchableOpacity 
                  key={m.id}
                  onPress={() => setActiveMember(m.id)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                    backgroundColor: activeMemberId === m.id ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.cardBorder, borderWidth: 1
                  }}>
                    <Typography variant="caption" style={{ color: activeMemberId === m.id ? theme.colors.background : theme.colors.text }}>{m.profile.name}</Typography>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                onPress={() => {
                   const name = window.prompt("Nome do novo membro:");
                   if (name && name.trim() !== '') {
                     const id = 'mem_' + Date.now();
                     useStore.getState().addHouseholdMember({
                       id,
                       role: 'dependent',
                       profile: { id, name: name.trim() },
                       permissions: { results: 'private', context: 'private' },
                       createdAt: new Date().toISOString(),
                       updatedAt: new Date().toISOString()
                     });
                     useStore.getState().setActiveMember(id);
                   }
                }}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                  backgroundColor: theme.colors.card, borderColor: theme.colors.primary, borderWidth: 1, borderStyle: 'dashed'
                }}>
                  <Typography variant="caption" style={{ color: theme.colors.text }}>+ Adicionar</Typography>
              </TouchableOpacity>
            </ScrollView>
            
          </View>
        )}

        {/* 1. IDENTIDADE */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={[styles.sectionLabel, isEditMode ? { color: theme.colors.primary } : {}]}>
            IDENTIDADE {isEditMode && '(EDITÁVEL)'}
          </Typography>
          <View style={[styles.cardGroup, isEditMode && { borderColor: theme.colors.primary + '40' }]}>
            <View style={[styles.groupItem, !isEditMode && { opacity: 0.9 }]}>
              <Typography style={styles.groupLabel}>Nome Completo</Typography>
              <View style={styles.groupValueRow}>
                {isEditMode ? (
                  <TextInput
                    value={displayUserName || ''}
                    onChangeText={(val) => updateProfileField({ fullName: val })}
                    placeholder="Seu nome"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.inlineInput}
                  />
                ) : (
                  <Typography>{displayUserName || 'Não definido'}</Typography>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.groupItem} 
              onPress={handleEditAvatar}
              disabled={!isEditMode}
            >
              <Typography style={styles.groupLabel}>Avatar</Typography>
              <View style={styles.groupValueRow}>
                <Typography variant="caption" style={{ color: theme.colors.textMuted }}>
                  {displayUser?.avatarUrl ? 'Personalizado' : 'Ícone Padrão'}
                </Typography>
                {isEditMode && <ChevronRight size={16} color={theme.colors.primary} />}
              </View>
            </TouchableOpacity>

            <View style={[styles.groupItem, { borderBottomWidth: 0, opacity: isEditMode ? 0.5 : 1 }]}>
              <Typography style={styles.groupLabel}>Email</Typography>
              <Typography>{displayUser?.email || (authAccount?.email) || 'Não definido'}</Typography>
            </View>
          </View>
        </View>

        {/* 2. PERFIL PESSOAL */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={[styles.sectionLabel, isEditMode ? { color: theme.colors.primary } : {}]}>
            PERFIL PESSOAL {isEditMode && '(EDITÁVEL)'}
          </Typography>
          <View style={[styles.cardGroup, isEditMode && { borderColor: theme.colors.primary + '40' }]}>
            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Data de Nascimento</Typography>
              <View style={styles.groupValueRow}>
                {isEditMode ? (
                  <TextInput
                    value={displayUser?.dateOfBirth || displayUser?.birthDate || ''}
                    onChangeText={(val) => updateProfileField({ dateOfBirth: val })}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.inlineInput}
                  />
                ) : (
                  <Typography>{displayUser?.dateOfBirth || displayUser?.birthDate || 'Não definida'}</Typography>
                )}
              </View>
            </View>

            <View style={[styles.groupItem, { opacity: isEditMode ? 0.5 : 1 }]}>
              <Typography style={styles.groupLabel}>Idade</Typography>
              <Typography>
                {userAge !== null ? `${userAge} anos` : 'Não definida'}
              </Typography>
            </View>

            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Identidade de Género</Typography>
              <View style={styles.groupValueRow}>
                {isEditMode ? (
                  <TextInput
                    value={displayUser?.genderIdentity || displayUser?.sex || ''}
                    onChangeText={(val) => updateProfileField({ genderIdentity: val })}
                    placeholder="Gênero"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.inlineInput}
                  />
                ) : (
                  <Typography>{displayUser?.genderIdentity || displayUser?.sex || 'Não definido'}</Typography>
                )}
              </View>
            </View>

            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Altura</Typography>
              <View style={styles.groupValueRow}>
                {isEditMode ? (
                  <TextInput
                    value={displayUser?.height ? String(displayUser.height) : ''}
                    onChangeText={(val) => updateProfileField({ height: parseInt(val) || 0 })}
                    placeholder="cm"
                    keyboardType="numeric"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.inlineInput}
                  />
                ) : (
                  <Typography>{displayUser?.height ? `${displayUser.height} cm` : 'Não definida'}</Typography>
                )}
              </View>
            </View>

            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Peso Atual</Typography>
              <View style={styles.groupValueRow}>
                {isEditMode ? (
                  <TextInput
                    value={displayUser?.weight?.value ? String(displayUser.weight.value) : ''}
                    onChangeText={(val) => updateProfileField({ weight: { ...displayUser.weight, value: parseFloat(val) || 0, source: 'manual' } })}
                    placeholder="kg"
                    keyboardType="numeric"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.inlineInput}
                  />
                ) : (
                  <Typography>{displayUser?.weight?.value ? `${displayUser.weight.value} kg` : 'Não definido'}</Typography>
                )}
              </View>
            </View>

            <View style={[styles.groupItem, { borderBottomWidth: 0, opacity: isEditMode ? 0.5 : 1 }]}>
              <Typography style={styles.groupLabel}>Última Bioanálise</Typography>
              <Typography variant="caption" style={{ color: theme.colors.textMuted }}>
                {displayUser?.lastAnalysisDate || 'Sem registos recentes'}
              </Typography>
            </View>
          </View>
        </View>

        {/* 3. CONTA */}
        <View style={[styles.menuSection, isEditMode && { opacity: 0.4 }]}>
          <Typography variant="caption" style={styles.sectionLabel}>CONTA</Typography>
          <View style={styles.cardGroup}>
            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Plano</Typography>
              <Typography style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {displayUser?.planType || 'Free'}
              </Typography>
            </View>

            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Membro desde</Typography>
              <Typography variant="caption">
                {displayUser?.memberSince || 'N/A'}
              </Typography>
            </View>

            <View style={[styles.groupItem, { borderBottomWidth: 0 }]}>
              <Typography style={styles.groupLabel}>Último Acesso</Typography>
              <Typography variant="caption">
                {displayUser?.lastLogin || 'Agora'}
              </Typography>
            </View>
          </View>
        </View>

        {/* 4. GESTÃO DE MEMBRO (Apenas se activeMemberId) */}
        {activeMemberId && (
          <View style={[styles.menuSection, isEditMode && { opacity: 0.4 }]}>
            <Typography variant="caption" style={styles.sectionLabel}>GESTÃO DE MEMBRO</Typography>
            <View style={[styles.cardGroup, { padding: 20 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Typography variant="caption" style={{ color: isProfileComplete ? theme.colors.primary : '#ff9800' }}>
                  {isProfileComplete ? '✓ Perfil Completo' : '⚠ Perfil Incompleto'}
                </Typography>
                
                <Typography variant="caption" style={{ 
                  color: household?.members.find((m: any) => m.id === activeMemberId)?.userId ? theme.colors.primary : theme.colors.textMuted,
                  fontWeight: 'bold'
                }}>
                  {household?.members.find((m: any) => m.id === activeMemberId)?.userId 
                    ? 'CONTA LIGADA' 
                    : (household?.invitations?.find((i: any) => i.memberId === activeMemberId && i.status === 'pending') ? 'INVITE PENDENTE' : 'CONTA LOCAL')
                  }
                </Typography>
              </View>

              {!household?.members.find((m: any) => m.id === activeMemberId)?.userId && !household?.invitations?.find((i: any) => i.memberId === activeMemberId && i.status === 'pending') && !isEditMode && (
                 <View style={{ gap: 12 }}>
                   <TouchableOpacity 
                     style={{ backgroundColor: theme.colors.primary + '20', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary + '40' }}
                     onPress={() => {
                        if (Platform.OS === 'web') {
                          const email = window.prompt("Email do utilizador a convidar:");
                          if (email && email.trim() !== '') {
                              useStore.getState().inviteHouseholdMember(activeMemberId, email.trim()).then(ok => {
                                  if (ok) alert('Convite gerado com sucesso!');
                                  else alert('Falha ao emitir convite.');
                              });
                          }
                        } else {
                          Alert.prompt('Convite', 'Email do utilizador a convidar:', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Enviar', onPress: (email: string | undefined) => {
                              if (email && email.trim() !== '') {
                                useStore.getState().inviteHouseholdMember(activeMemberId, email.trim()).then(ok => {
                                    if (ok) Alert.alert('Sucesso', 'Convite emitido.');
                                    else Alert.alert('Erro', 'Falha ao emitir convite.');
                                });
                              }
                            }}
                          ]);
                        }
                     }}
                   >
                      <Typography style={{ color: theme.colors.primary, fontWeight: '600' }}>Enviar Convite Real</Typography>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     onPress={() => {
                        if (Platform.OS === 'web') {
                          if (window.confirm('O membro local vai ser removido de forma destrutiva. Continuar?')) {
                            useStore.getState().removeHouseholdMember(activeMemberId);
                          }
                        } else {
                          Alert.alert('Remover Membro Local', 'O membro será removido completamente do teu agregado. Continuar?', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Remover', style: 'destructive', onPress: () => useStore.getState().removeHouseholdMember(activeMemberId) }
                          ]);
                        }
                     }}
                     style={{ padding: 8, alignItems: 'center' }}
                   >
                      <Typography variant="caption" style={{ color: '#E53E3E' }}>Remover Membro do Agregado</Typography>
                   </TouchableOpacity>
                 </View>
              )}

              {household?.invitations?.find((i: any) => i.memberId === activeMemberId && i.status === 'pending') && (
                 <View style={{ alignItems: 'center', marginTop: 10 }}>
                   <View style={{ backgroundColor: 'white', padding: 8, borderRadius: 16, marginBottom: 15 }}>
                     <Image 
                       source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(((household?.invitations || []).find((i: any) => i.memberId === activeMemberId && i.status === 'pending') || {id: ''}).id)}` }}
                       style={{ width: 140, height: 140 }}
                     />
                   </View>
                   <Typography style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 22, marginBottom: 4, letterSpacing: 3 }}>
                      {household.invitations.find((i: any) => i.memberId === activeMemberId && i.status === 'pending')?.id.replace('inv_', '')}
                   </Typography>
                   <Typography variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 20 }}>
                      QR Code para emparelhamento
                   </Typography>
                   {!isEditMode && (
                     <TouchableOpacity 
                       onPress={() => {
                          if (Platform.OS === 'web') {
                            if (window.confirm('Queres cancelar este convite pendente?')) {
                              useStore.getState().cancelHouseholdInvite((((household?.invitations || []).find((i: any) => i.memberId === activeMemberId && i.status === 'pending') || {id: ''}).id));
                            }
                          } else {
                            Alert.alert('Cancelar Convite', 'Cancelar convite pendente?', [
                              { text: 'Não', style: 'cancel' },
                              { text: 'Sim', onPress: () => useStore.getState().cancelHouseholdInvite((((household?.invitations || []).find((i: any) => i.memberId === activeMemberId && i.status === 'pending') || {id: ''}).id)) }
                            ]);
                          }
                       }}
                       style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: theme.colors.cardBorder, borderRadius: 12 }}
                     >
                        <Typography variant="caption" style={{ color: theme.colors.text }}>Cancelar Convite</Typography>
                     </TouchableOpacity>
                   )}
                 </View>
              )}

              {household?.members.find((m: any) => m.id === activeMemberId)?.userId && !isEditMode && (
                 <TouchableOpacity 
                   style={{ marginTop: 10, alignItems: 'center' }}
                   onPress={() => {
                      if (Platform.OS === 'web') {
                        if (window.confirm('Desligar a conta vai preservar os dados localmente mas corta o Sync com o dono da conta. Continuar?')) {
                          useStore.getState().disconnectHouseholdMember(activeMemberId);
                        }
                      } else {
                        Alert.alert('Desativar Ligação', 'O membro manterá o histórico local, mas a ligação à conta remota será cortada. Continuar?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Desligar Conta', style: 'destructive', onPress: () => useStore.getState().disconnectHouseholdMember(activeMemberId) }
                        ]);
                      }
                   }}
                 >
                    <Typography variant="caption" style={{ color: theme.colors.textMuted, textDecorationLine: 'underline' }}>Desligar Conta Real do Membro</Typography>
                 </TouchableOpacity>
              )}
            </View>
          </View>
        )}


        {!isGuestMode && (
          <View style={[styles.menuSection, isEditMode && { opacity: 0.4 }]}>
            <Typography variant="caption" style={styles.sectionLabel}>MÓDULOS FAMILIARES</Typography>
            <View style={styles.cardGroup}>
              <TouchableOpacity 
                style={[styles.groupItem, { borderBottomWidth: 0 }]} 
                onPress={() => Alert.alert('Criar Agregado (Em Breve)', 'A criação e gestão central de agregados familiares será ativada na próxima versão através do ícone no ecrã principal.')}
                disabled={isEditMode}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Users size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                  <View>
                    <Typography style={styles.menuTitle}>Criar Agregado</Typography>
                    <Typography variant="caption" style={{ color: theme.colors.textMuted }}>Partilhar com a família</Typography>
                  </View>
                </View>
                <ChevronRight size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.logoutBtn, isEditMode && { opacity: 0.4 }]}
          disabled={isEditMode}
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
          <Typography style={{ color: theme.colors.error, marginLeft: 12, fontWeight: '600' }}>
            {isGuestMode ? 'Sair do modo Guest' : 'Terminar Sessão'}
          </Typography>
        </TouchableOpacity>

        <GatingOverlay />

        <Modal visible={isScanningQRCode} animationType="slide" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Typography style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Scan de Agregado</Typography>
               <TouchableOpacity onPress={() => setIsScanningQRCode(false)} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                  <Typography style={{ color: 'white' }}>Fechar</Typography>
               </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <CameraView 
                 style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').width }}
                 facing="back"
                 barcodeScannerSettings={{
                   barcodeTypes: ["qr"]
                 }}
                 onBarcodeScanned={({ data }) => {
                   if (hasScanned) return;
                   setHasScanned(true);
                   setIsScanningQRCode(false);
                   setTimeout(() => {
                     if (data && data.trim() !== '') {
                       const finalCode = data.trim().startsWith('inv_') ? data.trim() : `inv_${data.trim()}`;
                       useStore.getState().acceptHouseholdInvite(finalCode).then(ok => {
                         if (ok) {
                            if (Platform.OS === 'web') alert('Convite aceite por QR! Foste adicionado(a) ao agregado.');
                            else Alert.alert('Sucesso', 'Foste adicionado(a) ao agregado.');
                         } else {
                            if (Platform.OS === 'web') alert('Falha ao aceder ao convite lido.');
                            else Alert.alert('Erro', 'Convite QR inválido ou expirado.');
                         }
                       });
                     }
                   }, 500);
                 }}
              />
              <View style={{ position: 'absolute', width: 250, height: 250, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 10, backgroundColor: 'transparent' }} />
            </View>
            <View style={{ padding: 30, alignItems: 'center' }}>
               <Typography style={{ color: 'white', textAlign: 'center' }}>Aponta o quadrado central para o QR code no telemóvel do Dono do Agregado.</Typography>
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </Container>
  );
};

const calculateAge = (dobStr: string | undefined): number | null => {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  let age = new Date().getFullYear() - dob.getFullYear();
  const m = new Date().getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && new Date().getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginVertical: theme.spacing.xxl,
    position: 'relative',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: -20,
    padding: 10,
    zIndex: 10,
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
  },
  cardGroup: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
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
  inlineInput: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    padding: 0,
    margin: 0,
    minWidth: 120,
  },
  groupLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  groupValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
});
