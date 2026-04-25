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
  // 0. EDIT HANDLERS (DIRECT)
  // ─────────────────────────────────────────────────────────────────────────────
  const updateProfileField = (updates: any) => {
    if (isGuestMode) {
      useStore.getState().updateGuestProfile(updates);
    } else {
      useStore.getState().updateAuthenticatedProfile(updates);
    }
  };

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


  const handleEditName = () => {
    const current = user?.name || user?.fullName || '';
    const msg = 'Como gostarias de ser tratada?';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null && val.trim() !== '') {
        updateProfileField({ name: val.trim(), fullName: val.trim() });
      }
      return;
    }

    Alert.prompt('Editar Nome', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val) => val?.trim() && updateProfileField({ name: val.trim(), fullName: val.trim() }) }
    ], 'plain-text', current);
  };

  const handleEditSex = () => {
    const current = user?.sex || user?.genderIdentity || '';
    const options = ['Homem', 'Mulher', 'Não indicar'];
    
    if (Platform.OS === 'web') {
      const val = window.prompt(`Escolha o Sexo (${options.join(', ')}):`, current);
      if (val !== null) {
        const match = options.find(o => o.toLowerCase() === val.trim().toLowerCase());
        if (match) updateProfileField({ sex: match, genderIdentity: match });
      }
      return;
    }

    Alert.alert('Sexo', 'Selecione uma opção:', options.map(o => ({
      text: o, onPress: () => updateProfileField({ sex: o, genderIdentity: o })
    })));
  };

  const handleEditDateOfBirth = () => {
    const current = user?.dateOfBirth || user?.birthDate || '';
    const msg = 'Data de Nascimento (AAAA-MM-DD):';

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
      { text: 'Salvar', onPress: (val) => {
        if (val?.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
          Alert.alert('Erro', 'Formato inválido. Usa AAAA-MM-DD.');
          return;
        }
        updateProfileField({ dateOfBirth: val?.trim() || '', birthDate: val?.trim() || '' });
      }}
    ], 'plain-text', current);
  };

  const handleEditHeight = () => {
    const current = user?.height ? String(user.height) : '';
    const msg = 'Altura (cm):';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null && val.trim() !== '') {
        const num = parseInt(val.trim(), 10);
        if (!isNaN(num)) updateProfileField({ height: num });
      }
      return;
    }

    Alert.prompt('Altura', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val) => {
        const num = parseInt(val?.trim() || '', 10);
        if (!isNaN(num)) updateProfileField({ height: num });
      }}
    ], 'plain-text', current, 'numeric');
  };

  const handleEditWeight = () => {
    const current = user?.weight?.value ? String(user.weight.value) : '';
    const msg = 'Peso (kg):';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null && val.trim() !== '') {
        const num = parseFloat(val.trim().replace(',', '.'));
        if (!isNaN(num)) updateProfileField({ weight: { ...user?.weight, value: num, source: 'manual' } });
      }
      return;
    }

    Alert.prompt('Peso', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val) => {
        const num = parseFloat(val?.trim().replace(',', '.') || '');
        if (!isNaN(num)) updateProfileField({ weight: { ...user?.weight, value: num, source: 'manual' } });
      }}
    ], 'plain-text', current, 'numeric');
  };

  const userAge = calculateAge(user?.dateOfBirth || (user as any)?.birthDate);

  const isProfileComplete = Boolean(
    (user?.fullName || user?.name) && (user?.fullName || user?.name) !== 'Convidada' &&
    (user?.dateOfBirth || (user as any)?.birthDate) &&
    user?.height
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

  if (exportedContextsCount === 0) {
    setupItems.push({
      id: 'context', title: 'Ativar Mini-Apps', desc: 'Alimente o contexto comportamental para IA mais astuta.',
      icon: <Globe size={14} color="#9D00FF" />,
      action: () => navigation.navigate('Home', { screen: 'MiniApp' })
    });
  }

  return (
    <Container safe scroll withAura={true}>

      <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Main', { screen: 'Home' })} 
            style={styles.closeButton}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatar} onPress={() => {}} disabled>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <User size={40} color="white" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleEditName} style={{ alignItems: 'center' }}>
            <Typography variant="h2" style={{ fontWeight: '700' }}>
              {user?.name || user?.fullName || 'Utilizador'}
            </Typography>
            <Typography variant="caption" style={{ color: theme.colors.textMuted }}>
              {user?.email || (authAccount?.email) || 'Sem email associado'}
            </Typography>
          </TouchableOpacity>
          
          <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 8, marginTop: 8 }}>
             BUILD V2.5-STABLE | {isGuestMode ? 'GUEST' : 'AUTH'}
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

        {/* 1. INFO BIOMÉTRICA (Compacta) */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>DADOS BIOMÉTRICOS</Typography>
          <View style={styles.cardGroup}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              <TouchableOpacity style={[styles.groupItem, { flex: 1, borderBottomWidth: 0 }]} onPress={handleEditSex}>
                <Typography style={styles.groupLabel}>Sexo</Typography>
                <Typography>{user?.sex || user?.genderIdentity || '—'}</Typography>
              </TouchableOpacity>
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <TouchableOpacity style={[styles.groupItem, { flex: 1, borderBottomWidth: 0 }]} onPress={handleEditDateOfBirth}>
                <Typography style={styles.groupLabel}>Idade</Typography>
                <Typography>{userAge !== null ? `${userAge}a` : '—'}</Typography>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={[styles.groupItem, { flex: 1, borderBottomWidth: 0 }]} onPress={handleEditHeight}>
                <Typography style={styles.groupLabel}>Altura</Typography>
                <Typography>{user?.height ? `${user.height}cm` : '—'}</Typography>
              </TouchableOpacity>
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <TouchableOpacity style={[styles.groupItem, { flex: 1, borderBottomWidth: 0 }]} onPress={handleEditWeight}>
                <Typography style={styles.groupLabel}>Peso</Typography>
                <Typography>{user?.weight?.value ? `${user.weight.value}kg` : '—'}</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. CONTA */}
        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>CONTA</Typography>
          <View style={styles.cardGroup}>
            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Plano</Typography>
              <Typography style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {user?.planType || 'Free'}
              </Typography>
            </View>

            <View style={styles.groupItem}>
              <Typography style={styles.groupLabel}>Membro desde</Typography>
              <Typography variant="caption">
                {user?.memberSince || 'N/A'}
              </Typography>
            </View>

            <View style={[styles.groupItem, { borderBottomWidth: 0 }]}>
              <Typography style={styles.groupLabel}>Último Acesso</Typography>
              <Typography variant="caption">
                {user?.lastLogin || 'Agora'}
              </Typography>
            </View>
          </View>
        </View>

        {/* 4. GESTÃO DE MEMBRO (Apenas se activeMemberId) */}
        {activeMemberId && (
          <View style={styles.menuSection}>
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

              {!household?.members.find((m: any) => m.id === activeMemberId)?.userId && !household?.invitations?.find((i: any) => i.memberId === activeMemberId && i.status === 'pending') && (
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
                 </View>
              )}

              {household?.members.find((m: any) => m.id === activeMemberId)?.userId && (
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
          <View style={styles.menuSection}>
            <Typography variant="caption" style={styles.sectionLabel}>MÓDULOS FAMILIARES</Typography>
            <View style={styles.cardGroup}>
              <TouchableOpacity 
                style={[styles.groupItem, { borderBottomWidth: 0 }]} 
                onPress={() => Alert.alert('Criar Agregado (Em Breve)', 'A criação e gestão central de agregados familiares será ativada na próxima versão através do ícone no ecrã principal.')}
                disabled={false}
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
