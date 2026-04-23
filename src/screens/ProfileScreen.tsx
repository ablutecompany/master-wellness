import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { Container, Typography } from '../components/Base';
import { theme } from '../theme';
import { User, CreditCard, Settings, LogOut, ChevronRight, Globe, Activity, Users, Utensils } from 'lucide-react-native';
import { GatingOverlay } from '../components/GatingOverlay';
import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';

import { Alert, Modal, SafeAreaView, Dimensions } from 'react-native';
import { supabase } from '../services/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const userName = useStore(Selectors.selectUserName);
  const credits = useStore(Selectors.selectCredits);
  const user = useStore(Selectors.selectUser);
  const isGuestMode = useStore(state => state.isGuestMode);
  const updateGuestProfile = useStore(state => state.updateGuestProfile);
  const household = useStore(Selectors.selectHousehold);
  const activeMemberId = useStore(Selectors.selectActiveMemberId);
  const setActiveMember = useStore(state => state.setActiveMember);

  const [isScanningQRCode, setIsScanningQRCode] = React.useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = React.useState(false);

  // DEV MOCK: Prove the UI works locally
  useEffect(() => {
    if (!useStore.getState().household) {
      useStore.getState().setHousehold({
        id: 'hh-123',
        name: 'Família Ablute',
        createdAt: new Date().toISOString(),
        members: [
          {
            id: 'm1',
            role: 'owner',
            profile: { id: 'm1', name: 'Nuno (Owner)', dateOfBirth: '1985-05-20', height: 180, sex: 'M' },
            permissions: { results: 'private', context: 'private' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'm2',
            role: 'dependent',
            profile: { id: 'm2', name: 'Ana (Filha)', dateOfBirth: '2010-02-15', height: 155, sex: 'F' },
            permissions: { results: 'shared_household', context: 'private' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      });
    }
  }, []);

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
    const defaultName = userName !== 'Convidada' ? userName : '';
    const title = isGuestMode ? 'Editar Nome (Guest)' : 'Editar Nome';

    if (Platform.OS === 'web') {
      const newName = window.prompt('Como gostarias de ser tratada?', defaultName);
      if (newName !== null && newName.trim() !== '') {
        if (isGuestMode) { useStore.getState().updateGuestProfile({ name: newName.trim() }); } else { useStore.getState().updateAuthenticatedProfile({ name: newName.trim() }); }
      }
      return;
    }

    Alert.prompt(
      title,
      'Como gostarias de ser tratada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salvar', 
          onPress: (newName) => {
            if (newName && newName.trim() !== '') {
              if (isGuestMode) { useStore.getState().updateGuestProfile({ name: newName.trim() }); } else { useStore.getState().updateAuthenticatedProfile({ name: newName.trim() }); }
            }
          } 
        }
      ],
      'plain-text',
      defaultName
    );
  };

  const handleEditDateOfBirth = () => {
    const current = user?.dateOfBirth || '';
    const title = 'Data de Nascimento';
    const msg = 'Insere a tua data de nascimento (AAAA-MM-DD):';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val.trim()) && val.trim() !== '') {
          alert('Formato inválido. Usa AAAA-MM-DD.');
          return;
        }
        if (isGuestMode) { useStore.getState().updateGuestProfile({ dateOfBirth: val.trim() }); } else { useStore.getState().updateAuthenticatedProfile({ dateOfBirth: val.trim() }); }
      }
      return;
    }

    Alert.prompt(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val) => {
        if (val !== undefined && val !== null) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(val.trim()) && val.trim() !== '') {
            Alert.alert('Erro', 'Formato inválido. Usa AAAA-MM-DD.');
            return;
          }
          if (isGuestMode) { useStore.getState().updateGuestProfile({ dateOfBirth: val.trim() }); } else { useStore.getState().updateAuthenticatedProfile({ dateOfBirth: val.trim() }); }
        }
      }}
    ], 'plain-text', current);
  };

  const handleEditHeight = () => {
    const current = user?.height ? String(user.height) : '';
    const title = 'Altura';
    const msg = 'Insere a tua altura em cm:';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null && val.trim() !== '') {
        const num = parseInt(val.trim(), 10);
        if (isNaN(num) || num < 50 || num > 300) {
          alert('Altura inválida. Usa um número em cm (ex: 170).');
          return;
        }
        if (isGuestMode) { useStore.getState().updateGuestProfile({ height: num }); } else { useStore.getState().updateAuthenticatedProfile({ height: num }); }
      }
      return;
    }

    Alert.prompt(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val) => {
        if (val !== undefined && val !== null && val.trim() !== '') {
          const num = parseInt(val.trim(), 10);
          if (isNaN(num) || num < 50 || num > 300) {
            Alert.alert('Erro', 'Altura inválida em cm.');
            return;
          }
          if (isGuestMode) { useStore.getState().updateGuestProfile({ height: num }); } else { useStore.getState().updateAuthenticatedProfile({ height: num }); }
        }
      }}
    ], 'plain-text', current, 'numeric');
  };

  const handleEditSex = () => {
    const current = user?.sex || '';
    const title = 'Sexo';
    const msg = 'Insere o teu sexo (M, F ou deixa vazio):';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null) {
        const cleanVal = val.trim().toUpperCase();
        if (cleanVal !== '' && cleanVal !== 'M' && cleanVal !== 'F') {
          alert('Sexo inválido. Usa M, F ou deixa vazio.');
          return;
        }
        const newSex = cleanVal || null;
        if (isGuestMode) { useStore.getState().updateGuestProfile({ sex: newSex as 'M' | 'F' | undefined }); } else { useStore.getState().updateAuthenticatedProfile({ sex: newSex as 'M' | 'F' | undefined }); }
      }
      return;
    }

    Alert.prompt(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val) => {
        if (val !== undefined && val !== null) {
          const cleanVal = val.trim().toUpperCase();
          if (cleanVal !== '' && cleanVal !== 'M' && cleanVal !== 'F') {
            Alert.alert('Erro', 'Sexo inválido. Usa M, F ou deixa vazio.');
            return;
          }
          const newSex = cleanVal || null;
          if (isGuestMode) { useStore.getState().updateGuestProfile({ sex: newSex as 'M' | 'F' | undefined }); } else { useStore.getState().updateAuthenticatedProfile({ sex: newSex as 'M' | 'F' | undefined }); }
        }
      }}
    ], 'plain-text', current);
  };

  const handleEditWeight = () => {
    const current = user?.weight?.manualValue ? String(user.weight.manualValue) : (user?.weight?.value ? String(user.weight.value) : '');
    const title = 'Peso Atual (Override)';
    const msg = 'Insere o teu peso (kg) ou deixa em branco para reverter para a última medição da balança:';

    if (Platform.OS === 'web') {
      const val = window.prompt(msg, current);
      if (val !== null) {
        if (val.trim() === '') {
          const measured = user?.weight?.measuredValue || null;
          const newWeightObj: typeof user.weight = {
            value: measured,
            source: measured ? 'measured' : 'missing',
            manualValue: null,
            measuredValue: measured,
            isDiscrepant: false
          };
          if (isGuestMode) useStore.getState().updateGuestProfile({ weight: newWeightObj }); else useStore.getState().updateAuthenticatedProfile({ weight: newWeightObj });
          return;
        }
        const num = parseFloat(val.trim().replace(',', '.'));
        if (isNaN(num) || num < 20 || num > 300) {
          alert('Peso inválido. Usa um número em kg (ex: 70.5).');
          return;
        }
        
        const measured = user?.weight?.measuredValue || null;
        const discrepant = measured !== null && Math.abs(num - measured) >= 2.5;
        const newWeightObj: typeof user.weight = {
          value: num,
          source: 'manual',
          manualValue: num,
          measuredValue: measured,
          isDiscrepant: discrepant
        };

        if (isGuestMode) { useStore.getState().updateGuestProfile({ weight: newWeightObj }); } else { useStore.getState().updateAuthenticatedProfile({ weight: newWeightObj }); }
      }
      return;
    }

    Alert.prompt(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: (val) => {
        if (val !== undefined && val !== null) {
          if (val.trim() === '') {
             const measured = user?.weight?.measuredValue || null;
             const newWeightObj: typeof user.weight = {
               value: measured,
               source: measured ? 'measured' : 'missing',
               manualValue: null,
               measuredValue: measured,
               isDiscrepant: false
             };
             if (isGuestMode) useStore.getState().updateGuestProfile({ weight: newWeightObj }); else useStore.getState().updateAuthenticatedProfile({ weight: newWeightObj });
             return;
          }
          const num = parseFloat(val.trim().replace(',', '.'));
          if (isNaN(num) || num < 20 || num > 300) {
            Alert.alert('Erro', 'Peso inválido em kg.');
            return;
          }

          const measured = user?.weight?.measuredValue || null;
          const discrepant = measured !== null && Math.abs(num - measured) >= 2.5;
          const newWeightObj: typeof user.weight = {
            value: num,
            source: 'manual',
            manualValue: num,
            measuredValue: measured,
            isDiscrepant: discrepant
          };

          if (isGuestMode) { useStore.getState().updateGuestProfile({ weight: newWeightObj }); } else { useStore.getState().updateAuthenticatedProfile({ weight: newWeightObj }); }
        }
      }}
    ], 'plain-text', current, 'numeric');
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

  const userAge = calculateAge(user?.dateOfBirth);

  const isProfileComplete = Boolean(
    userName && userName !== 'Convidada' &&
    user?.dateOfBirth &&
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
    <Container safe style={styles.container}>
      <View style={{ backgroundColor: '#ff00ff', padding: 8, alignItems: 'center', marginVertical: 10, borderRadius: 8 }}>
        <Typography variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>PROFILE V2 LIVE MARKER: 6b9731d</Typography>
      </View>
      <TouchableOpacity style={styles.header} onPress={handleEditName}>
        <View style={styles.avatar}>
          <Settings size={40} color={theme.colors.background} />
        </View>
        <Typography variant="h2">Configurações</Typography>
        <Typography variant="caption" color={theme.colors.primary}>
          {userName} {isGuestMode && <Typography variant="caption">(Alterar Nome)</Typography>}
        </Typography>
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
            
            {!activeMemberId && (
              <View style={{ marginTop: 25, alignSelf: 'stretch', width: '100%' }}>
                <Typography variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 12, letterSpacing: 1 }}>RESUMO DO AGREGADO</Typography>
                
                {/* O dashboard consolida lista de membros e estado */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', paddingBottom: 8 }}>
                  <Typography variant="h3" style={{ color: theme.colors.text, fontWeight: '800', marginTop: 16, marginLeft: 16, marginBottom: 16 }}>{household.name.toUpperCase()}</Typography>
                  
                  {[{id: 'self', role: 'owner', profile: { name: userName || 'Eu (Root)' }}, ...household.members].map((m: any, index: number) => {
                    const isRoot = m.role === 'owner';
                    const hasLink = !!m.userId;
                    const invitation = household.invitations?.find((i: { memberId: string, status: string }) => i.memberId === m.id && i.status === 'pending');
                    const isPrivate = !isRoot && (m.permissions?.results === 'private' || m.permissions?.context === 'private');
                    
                    // Fetch real-time permission dynamically based on current AppState
                    const rootUserId = useStore.getState().user?.id;
                    const targetId = isRoot ? rootUserId : m.id;
                    const memberFreshness = Selectors.selectDataFreshness(useStore.getState(), targetId);
                    const hasAccess = memberFreshness.status !== 'no_access';
                    const allMeasurements = useStore.getState().measurements || [];
                    
                    // Isolate exact measurements for this member
                    const memDbg = allMeasurements.filter((meas: any) => 
                       isRoot ? (!meas.memberId || meas.memberId === rootUserId) : (meas.memberId === m.id)
                    ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    // Try to extract useful signals natively
                    const weightMark = memDbg.find((i: any) => i.type === 'weight' || i.value?.marker === 'Peso');
                    const hrMark = memDbg.find((i: any) => i.type === 'ecg' || i.value?.marker === 'Frequência Cardíaca');
                    const energyMark = memDbg.find((i: any) => i.type === 'vitals' && i.value?.marker === 'Energia Base');
                    
                    return (
                      <View 
                        key={m.id}
                        style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: index === household.members.length ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: isRoot ? 'rgba(0, 242, 255, 0.05)' : 'transparent' }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isRoot ? theme.colors.primary : 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                               <Typography style={{ color: isRoot ? theme.colors.background : theme.colors.text, fontWeight: '800', fontSize: 16 }}>{m.profile.name.charAt(0).toUpperCase()}</Typography>
                            </View>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Typography style={{ color: theme.colors.text, fontWeight: '800', fontSize: 14 }}>{m.profile.name}</Typography>
                                {isRoot && <View style={{ marginLeft: 6, backgroundColor: 'rgba(0,242,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}><Typography variant="caption" style={{ color: theme.colors.primary, fontSize: 9, fontWeight: '800' }}>GESTOR</Typography></View>}
                              </View>
                              <Typography variant="caption" style={{ color: isRoot ? theme.colors.primary : (hasLink ? theme.colors.success : theme.colors.textMuted), fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                                {isRoot ? 'Conta Sessão Atual' : hasLink ? 'Conta Emparelhada ✅' : invitation ? `Convite Pendente (${invitation.code || '...'}) ⏳` : 'Perfil Local'}
                              </Typography>
                              
                              {!isRoot && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isPrivate ? 'rgba(255,96,96,0.1)' : 'rgba(0,212,170,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 6 }}>
                                    <Typography variant="caption" style={{ color: isPrivate ? '#FF6060' : '#00D4AA', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>{isPrivate ? '🔒 RESTRITO' : '✅ VÍSIVEL'}</Typography>
                                  </View>
                                  {m.permissions?.results && (
                                    <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Res: {m.permissions.results.split('_')[0]}</Typography>
                                  )}
                                </View>
                              )}

                              {/* ÚLTIMOS DADOS / RESUMO ÚTIL */}
                              <View style={{ marginTop: 6, backgroundColor: 'rgba(0,0,0,0.15)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasAccess && memDbg.length > 0 ? 8 : 0 }}>
                                   <View style={{ flexDirection: 'column', flex: 1 }}>
                                     <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                       <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: memberFreshness.color, marginRight: 6 }} />
                                       <Typography style={{ color: memberFreshness.color, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{memberFreshness.label.toUpperCase()}</Typography>
                                     </View>
                                     <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', marginLeft: 12 }}>
                                       {memberFreshness.temporalLabel}
                                     </Typography>
                                   </View>

                                   {memberFreshness.actionIntent !== 'wait' && (
                                     <TouchableOpacity 
                                        onPress={() => {
                                          if (memberFreshness.actionIntent === 'manage_permissions') {
                                             alert("Consulte as definições do membro abaixo para reconfigurar privacidade.");
                                          } else if (memberFreshness.actionIntent === 'sync_now' || memberFreshness.actionIntent === 're_sync') {
                                             useStore.getState().setActiveMember(targetId);
                                             useStore.getState().setIsMeasuring(true);
                                             navigation.navigate("Home");
                                          } else if (memberFreshness.actionIntent === 'analyze') {
                                             useStore.getState().setActiveMember(targetId);
                                             navigation.navigate("Home");
                                          }
                                        }}
                                        style={{ backgroundColor: memberFreshness.actionIntent === 'analyze' ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: memberFreshness.actionIntent === 'analyze' ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.1)' }}
                                     >
                                        <Typography style={{ color: memberFreshness.actionIntent === 'analyze' ? '#00D4AA' : 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{memberFreshness.actionLabel}</Typography>
                                     </TouchableOpacity>
                                   )}
                                </View>

                                {hasAccess && memDbg.length > 0 && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {weightMark && (
                                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                          <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginRight: 4 }}>PESO</Typography>
                                          <Typography style={{ color: '#00F2FF', fontSize: 11, fontWeight: '800' }}>{typeof weightMark.value === 'object' ? (weightMark.value as any).value : weightMark.value} {weightMark.value?.unit || 'kg'}</Typography>
                                       </View>
                                    )}
                                    {hrMark && (
                                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                          <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginRight: 4 }}>BPM</Typography>
                                          <Typography style={{ color: '#00D4AA', fontSize: 11, fontWeight: '800' }}>{typeof hrMark.value === 'object' ? (hrMark.value as any).value : hrMark.value}</Typography>
                                       </View>
                                    )}
                                    {(!weightMark && !hrMark) && memDbg[0] && (
                                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                          <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginRight: 4 }}>ÚLT. SINAL</Typography>
                                          <Typography style={{ color: '#fff', fontSize: 11 }}>{new Date(memDbg[0].timestamp).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</Typography>
                                       </View>
                                    )}
                                  </View>
                                )}
                              </View>
                              {/* FIM DO RESUMO ÚTIL */}

                            </View>
                          </View>
                        </View>

                        {/* AÇÕES RÁPIDAS (Quick Actions Strip) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, paddingLeft: 58 }}>
                            {/* 1. VER DASHBOARD PRINCIPAL */}
                            <TouchableOpacity 
                              onPress={() => {
                                if (!isRoot) setActiveMember(m.id);
                                else setActiveMember(null);
                                navigation.navigate('Home');
                              }}
                              style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, marginRight: 8 }}
                            >
                               <Typography style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>PANORÂMICA</Typography>
                            </TouchableOpacity>

                            {/* 2. VER BIOANÁLISE (Apenas se tiver acesso) */}
                            {hasAccess && (
                              <TouchableOpacity 
                                onPress={() => {
                                  if (!isRoot) setActiveMember(m.id);
                                  else setActiveMember(null);
                                  navigation.navigate('Analyses');
                                }}
                                style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(0, 242, 255, 0.08)', borderRadius: 6, marginRight: 8 }}
                              >
                                 <Typography style={{ color: '#00F2FF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>BIOANÁLISE</Typography>
                              </TouchableOpacity>
                            )}

                            {/* 3. GERIR ADMINISTRAÇÃO (Apenas para não-Root) */}
                            {!isRoot && (
                              <TouchableOpacity 
                                onPress={() => {
                                  setActiveMember(m.id);
                                }}
                                style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                              >
                                 <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>GERIR DADOS</Typography>
                              </TouchableOpacity>
                            )}
                        </View>

                      </View>
                    );
                  })}
                </View>

                {/* Acções de Ligação Rápidas abaixo do painel do agregado */}
                <Typography variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 8, marginTop: 12 }}>JUNÇÃO RÁPIDA (ROOT)</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <TouchableOpacity 
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        const code = window.prompt("Insere o código manual rápido (ex: 8fk21x) ou completo:");
                        if (code && code.trim() !== '') {
                          const finalCode = code.trim().startsWith('inv_') ? code.trim() : `inv_${code.trim()}`;
                          useStore.getState().acceptHouseholdInvite(finalCode).then(ok => {
                            if (ok) alert('Convite aceite! Foste adicionado(a) ao agregado.');
                            else alert('Erro ao aceitar convite. Verifica o código.');
                          });
                        }
                      } else {
                        Alert.prompt('Aceitar Convite', 'Insere o código de convite rápido ou completo:', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Aceitar', onPress: (code) => {
                            if (code && code.trim() !== '') {
                              const finalCode = code.trim().startsWith('inv_') ? code.trim() : `inv_${code.trim()}`;
                              useStore.getState().acceptHouseholdInvite(finalCode).then(ok => {
                                if (ok) Alert.alert('Sucesso', 'Foste adicionado(a) ao agregado.');
                                else Alert.alert('Erro', 'Código de convite inválido.');
                              });
                            }
                          }}
                        ]);
                      }
                    }}
                    style={{ flex: 1, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }}
                  >
                    <Typography variant="caption" style={{ color: theme.colors.text, fontWeight: '800' }}>
                      INSERIR CÓDIGO
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={async () => {
                      if (Platform.OS === 'web') {
                        alert('Leitor direto indisponível na WEB.');
                        return;
                      }
                      if (!cameraPermission?.granted) {
                        const status = await requestCameraPermission();
                        if (!status.granted) {
                           alert('É necessária a câmara para ler o convite.');
                           return;
                        }
                      }
                      setHasScanned(false);
                      setIsScanningQRCode(true);
                    }}
                    style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }}
                  >
                    <Typography variant="caption" style={{ color: theme.colors.text, fontWeight: '800' }}>
                      LER QR CODE
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

         <View style={[styles.menuSection, { marginBottom: theme.spacing.xl }]}>
          <Typography variant="caption" style={styles.sectionLabel}>RESUMO DO PERFIL</Typography>
          <View style={[styles.menuItem, { flexDirection: 'column', alignItems: 'flex-start', padding: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15, alignItems: 'flex-start' }}>
              <Typography variant="caption" style={{ color: isProfileComplete ? theme.colors.primary : '#ff9800' }}>
                {isProfileComplete ? 'Completude: Completo' : 'Completude: Faltam campos essenciais'}
              </Typography>
              
              {activeMemberId && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Typography variant="caption" style={{ 
                    color: household?.members.find(m => m.id === activeMemberId)?.userId ? theme.colors.primary : theme.colors.textMuted,
                    fontWeight: household?.members.find(m => m.id === activeMemberId)?.userId ? 'bold' : 'normal'
                  }}>
                    {household?.members.find(m => m.id === activeMemberId)?.userId 
                      ? '✓ Conta Ligada' 
                      : (household?.invitations?.find(i => i.memberId === activeMemberId && i.status === 'pending') ? '⏳ Convite Pendente' : '👤 Conta Local')
                    }
                  </Typography>
                  
                  {!household?.members.find(m => m.id === activeMemberId)?.userId && !household?.invitations?.find(i => i.memberId === activeMemberId && i.status === 'pending') && (
                     <View style={{ alignItems: 'flex-end' }}>
                       <TouchableOpacity onPress={() => {
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
                              { text: 'Enviar', onPress: (email) => {
                                if (email && email.trim() !== '') {
                                  useStore.getState().inviteHouseholdMember(activeMemberId, email.trim()).then(ok => {
                                      if (ok) Alert.alert('Sucesso', 'Convite emitido.');
                                      else Alert.alert('Erro', 'Falha ao emitir convite.');
                                  });
                                }
                              }}
                            ]);
                          }
                       }} style={{ marginTop: 4 }}>
                          <Typography variant="caption" style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>+ Enviar Convite</Typography>
                       </TouchableOpacity>
                       
                       <TouchableOpacity onPress={() => {
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
                       }} style={{ marginTop: 6 }}>
                          <Typography variant="caption" style={{ color: '#E53E3E', textDecorationLine: 'underline' }}>Remover Localmente</Typography>
                       </TouchableOpacity>
                     </View>
                  )}
                  {household?.invitations?.find(i => i.memberId === activeMemberId && i.status === 'pending') && (
                     <View style={{ alignItems: 'flex-end', marginTop: 15 }}>
                       <View style={{ backgroundColor: 'white', padding: 5, borderRadius: 12, marginBottom: 10 }}>
                         <Image 
                           source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(((household?.invitations || []).find(i => i.memberId === activeMemberId && i.status === 'pending') || {id: ''}).id)}` }}
                           style={{ width: 120, height: 120 }}
                         />
                       </View>
                       <Typography style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 2, letterSpacing: 2 }}>
                          {household.invitations.find(i => i.memberId === activeMemberId && i.status === 'pending')?.id.replace('inv_', '')}
                       </Typography>
                       <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 10 }}>
                          Partilha este QR Code ou Código Curto
                       </Typography>
                       <TouchableOpacity onPress={() => {
                          if (Platform.OS === 'web') {
                            if (window.confirm('Queres cancelar este convite pendente?')) {
                              useStore.getState().cancelHouseholdInvite((((household?.invitations || []).find(i => i.memberId === activeMemberId && i.status === 'pending') || {id: ''}).id));
                            }
                          } else {
                            Alert.alert('Cancelar Convite', 'Cancelar convite pendente?', [
                              { text: 'Não', style: 'cancel' },
                              { text: 'Sim', onPress: () => useStore.getState().cancelHouseholdInvite((((household?.invitations || []).find(i => i.memberId === activeMemberId && i.status === 'pending') || {id: ''}).id)) }
                            ]);
                          }
                       }} style={{ padding: 8, backgroundColor: theme.colors.cardBorder, borderRadius: 8 }}>
                          <Typography variant="caption" style={{ color: theme.colors.text }}>Cancelar Convite</Typography>
                       </TouchableOpacity>
                     </View>
                  )}
                  {household?.members.find(m => m.id === activeMemberId)?.userId && (
                     <TouchableOpacity onPress={() => {
                        if (Platform.OS === 'web') {
                          if (window.confirm('Desligar a conta vai preservar os dados localmente mas corta o Sync com o dono da conta. Continuar?')) {
                            useStore.getState().disconnectHouseholdMember(activeMemberId);
                          }
                        } else {
                          Alert.alert('Desativar Ligação', 'O membro manterá o histórico local, mas a ligação à conta remota será cortada. Deste modo o membro deixa de sincronizar com a sua APP. Continuar?', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Desligar Conta', style: 'destructive', onPress: () => useStore.getState().disconnectHouseholdMember(activeMemberId) }
                          ]);
                        }
                     }} style={{ marginTop: 8 }}>
                        <Typography variant="caption" style={{ color: theme.colors.textMuted, textDecorationLine: 'underline' }}>Desligar Conta Real</Typography>
                     </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
             
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
               <Typography style={{ color: theme.colors.textMuted }}>Nome</Typography>
               <Typography>{userName !== 'Convidada' ? userName : 'Não definido'}</Typography>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
               <Typography style={{ color: theme.colors.textMuted }}>Idade</Typography>
               <Typography>
                 {userAge !== null ? `${userAge} anos ` : 'Não definida'}
                 {userAge !== null && <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 10 }}>(Derivada)</Typography>}
               </Typography>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
               <Typography style={{ color: theme.colors.textMuted }}>Altura</Typography>
               <Typography>
                 {user?.height ? `${user.height} cm ` : 'Não definida'}
                 {user?.height && <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 10 }}>(Manual)</Typography>}
               </Typography>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
               <Typography style={{ color: theme.colors.textMuted }}>Sexo</Typography>
               <Typography>{user?.sex || 'Não definido'}</Typography>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
               <Typography style={{ color: theme.colors.textMuted }}>Peso Atual</Typography>
               <Typography>
                 {user?.weight?.value ? `${user.weight.value} kg ` : 'Não definido'}
                 {user?.weight?.source === 'manual' && <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 10 }}>(Manual)</Typography>}
                 {user?.weight?.source === 'measured' && <Typography variant="caption" style={{ color: theme.colors.textMuted, fontSize: 10 }}>(Medido)</Typography>}
               </Typography>
             </View>
             {user?.weight?.isDiscrepant && (
               <View style={{ width: '100%', alignItems: 'flex-end', marginTop: -8, marginBottom: 10 }}>
                 <Typography variant="caption" style={{ color: '#ff9800', fontSize: 10 }}>
                   Discrepância face à balança ({user.weight.measuredValue} kg)
                 </Typography>
               </View>
             )}
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
               <Typography style={{ color: theme.colors.textMuted }}>Localização</Typography>
               <Typography>{user?.country === '' ? 'Omitida' : (user?.country || 'A detetar...')}</Typography>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
               <Typography style={{ color: theme.colors.textMuted }}>Fuso Horário</Typography>
               <Typography variant="caption">{user?.timezone || 'A detetar...'}</Typography>
             </View>
          </View>
        </View>

        {activeMemberId && household && (
          <View style={[styles.menuSection, { marginBottom: theme.spacing.xl }]}>
            <Typography variant="caption" style={styles.sectionLabel}>PERMISSÕES DO MEMBRO</Typography>
            <View style={[styles.menuItem, { flexDirection: 'column', alignItems: 'flex-start', padding: 20 }]}>
              <View style={{ width: '100%', marginBottom: 15 }}>
                <Typography style={{ color: theme.colors.textMuted, marginBottom: 4 }}>Bioanálise (Resultados)</Typography>
                <TouchableOpacity onPress={() => {
                   if (Platform.OS === 'web') {
                     const perms = ['private', 'shared_household', 'shared_selective'];
                     const current = household.members.find(m => m.id === activeMemberId)?.permissions?.results || 'private';
                     const next = perms[(perms.indexOf(current) + 1) % perms.length];
                     useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { results: next });
                   } else {
                     Alert.alert('Bioanálise', 'Escolhe a visibilidade:', [
                       { text: 'Privado (Só Root e Membro)', onPress: () => useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { results: 'private' }) },
                       { text: 'Agregado (Todos)', onPress: () => useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { results: 'shared_household' }) },
                       { text: 'Seletivo', onPress: () => useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { results: 'shared_selective' }) },
                       { text: 'Cancelar', style: 'cancel' }
                     ]);
                   }
                }}>
                  <Typography variant="caption" style={{ color: theme.colors.primary }}>
                    {household.members.find(m => m.id === activeMemberId)?.permissions?.results === 'private' ? '🔒 Privado (Private)' : 
                     (household.members.find(m => m.id === activeMemberId)?.permissions?.results === 'shared_household' ? '👁 Agregado (Shared)' : '⚙️ Seletivo (Selective)')}
                  </Typography>
                </TouchableOpacity>

                {household.members.find(m => m.id === activeMemberId)?.permissions?.results === 'shared_selective' && (
                  <View style={{ marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderColor: theme.colors.cardBorder }}>
                    <Typography variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 5 }}>Selecionar quem pode ver:</Typography>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: theme.colors.textMuted, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" style={{ color: 'white', fontSize: 10, lineHeight: 12 }}>✓</Typography>
                      </View>
                      <Typography variant="caption" style={{ color: theme.colors.textMuted }}>Dono do Agregado (Sempre)</Typography>
                    </View>
                    {household.members.filter(m => m.id !== activeMemberId).map(m => {
                       const isSelected = (household.members.find(memb => memb.id === activeMemberId)?.permissions?.resultsTargetIds || []).includes(m.id);
                       return (
                         <TouchableOpacity key={m.id} onPress={() => {
                            const currentTargetIds = household.members.find(memb => memb.id === activeMemberId)?.permissions?.resultsTargetIds || [];
                            const nextTargetIds = isSelected 
                                ? currentTargetIds.filter((id: string) => id !== m.id)
                                : [...currentTargetIds, m.id];
                            useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { resultsTargetIds: nextTargetIds });
                         }} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                           <View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: isSelected ? theme.colors.primary : theme.colors.textMuted, backgroundColor: isSelected ? theme.colors.primary : 'transparent', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                             {isSelected && <Typography variant="caption" style={{ color: 'white', fontSize: 10, lineHeight: 12 }}>✓</Typography>}
                           </View>
                           <Typography variant="caption" style={{ color: theme.colors.text }}>{m.profile?.name || 'Membro'}</Typography>
                         </TouchableOpacity>
                       );
                    })}
                  </View>
                )}
              </View>

              <View style={{ width: '100%' }}>
                <Typography style={{ color: theme.colors.textMuted, marginBottom: 4 }}>Contexto Exportado (Objetivos)</Typography>
                <TouchableOpacity onPress={() => {
                   if (Platform.OS === 'web') {
                     const perms = ['private', 'shared_household', 'shared_selective'];
                     const current = household.members.find(m => m.id === activeMemberId)?.permissions?.context || 'private';
                     const next = perms[(perms.indexOf(current) + 1) % perms.length];
                     useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { context: next });
                   } else {
                     Alert.alert('Contexto Exportado', 'Escolhe a visibilidade:', [
                       { text: 'Privado (Só Root e Membro)', onPress: () => useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { context: 'private' }) },
                       { text: 'Agregado (Todos)', onPress: () => useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { context: 'shared_household' }) },
                       { text: 'Seletivo', onPress: () => useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { context: 'shared_selective' }) },
                       { text: 'Cancelar', style: 'cancel' }
                     ]);
                   }
                }}>
                  <Typography variant="caption" style={{ color: theme.colors.primary }}>
                    {household.members.find(m => m.id === activeMemberId)?.permissions?.context === 'private' ? '🔒 Privado (Private)' : 
                     (household.members.find(m => m.id === activeMemberId)?.permissions?.context === 'shared_household' ? '👁 Agregado (Shared)' : '⚙️ Seletivo (Selective)')}
                  </Typography>
                </TouchableOpacity>

                {household.members.find(m => m.id === activeMemberId)?.permissions?.context === 'shared_selective' && (
                  <View style={{ marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderColor: theme.colors.cardBorder }}>
                    <Typography variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 5 }}>Selecionar quem pode ver:</Typography>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: theme.colors.textMuted, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" style={{ color: 'white', fontSize: 10, lineHeight: 12 }}>✓</Typography>
                      </View>
                      <Typography variant="caption" style={{ color: theme.colors.textMuted }}>Dono do Agregado (Sempre)</Typography>
                    </View>
                    {household.members.filter(m => m.id !== activeMemberId).map(m => {
                       const isSelected = (household.members.find(memb => memb.id === activeMemberId)?.permissions?.contextTargetIds || []).includes(m.id);
                       return (
                         <TouchableOpacity key={m.id} onPress={() => {
                            const currentTargetIds = household.members.find(memb => memb.id === activeMemberId)?.permissions?.contextTargetIds || [];
                            const nextTargetIds = isSelected 
                                ? currentTargetIds.filter((id: string) => id !== m.id)
                                : [...currentTargetIds, m.id];
                            useStore.getState().updateHouseholdMemberPermissions(activeMemberId, { contextTargetIds: nextTargetIds });
                         }} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                           <View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: isSelected ? theme.colors.primary : theme.colors.textMuted, backgroundColor: isSelected ? theme.colors.primary : 'transparent', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                             {isSelected && <Typography variant="caption" style={{ color: 'white', fontSize: 10, lineHeight: 12 }}>✓</Typography>}
                           </View>
                           <Typography variant="caption" style={{ color: theme.colors.text }}>{m.profile?.name || 'Membro'}</Typography>
                         </TouchableOpacity>
                       );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <Typography variant="caption" style={styles.sectionLabel}>SISTEMA & PREFERÊNCIAS</Typography>


          <TouchableOpacity style={styles.menuItem} onPress={handleEditDateOfBirth}>
            <View style={styles.menuIcon}>
              <User size={20} color={theme.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.menuTitle}>Data de Nascimento</Typography>
              <Typography variant="caption" style={{ color: theme.colors.textMuted }}>{user?.dateOfBirth || 'Não definida'}</Typography>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleEditHeight}>
            <View style={styles.menuIcon}>
              <Activity size={20} color={theme.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.menuTitle}>Altura</Typography>
              <Typography variant="caption" style={{ color: theme.colors.textMuted }}>{user?.height ? `${user.height} cm` : 'Não definida'}</Typography>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleEditWeight}>
            <View style={styles.menuIcon}>
              <Activity size={20} color={theme.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.menuTitle}>Peso Atual</Typography>
              <Typography variant="caption" style={{ color: theme.colors.textMuted }}>
                {user?.weight?.value ? `${user.weight.value} kg` : 'Não definido'}
                {user?.weight?.source === 'manual' && ' (Editado pelo utilizador)'}
              </Typography>
              {user?.weight?.isDiscrepant && (
                <Typography variant="caption" style={{ color: '#ff9800', fontSize: 10, marginTop: 2 }}>
                  Aviso discreto: Discrepância face à última medição ({user.weight.measuredValue} kg)
                </Typography>
              )}
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEditSex}>
            <View style={styles.menuIcon}>
              <User size={20} color={theme.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.menuTitle}>Sexo</Typography>
              <Typography variant="caption" style={{ color: theme.colors.textMuted }}>{user?.sex || 'Não definido'}</Typography>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Globe size={20} color={theme.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.menuTitle}>País</Typography>
              <Typography variant="caption" style={{ color: theme.colors.textMuted }}>{user?.country === '' ? 'Auto-obtenção ignorada' : (user?.country || 'A detetar...')}</Typography>
            </View>
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Globe size={20} color={theme.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.menuTitle}>Fuso Horário</Typography>
              <Typography variant="caption" style={{ color: theme.colors.textMuted }}>{user?.timezone || 'A detetar...'}</Typography>
            </View>
          </View>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Globe size={20} color={theme.colors.text} />
            </View>
            <Typography style={styles.menuTitle}>Mapa de Equipamento</Typography>
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
                 setTimeout(() => { // UI thread sync
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
