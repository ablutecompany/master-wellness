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

import { Alert, Modal, SafeAreaView, Dimensions, TextInput, ImageBackground } from 'react-native';
import { BlurView } from '../components/Base';
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
    <View style={styles.outerContainer}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <Typography variant="h3" style={{ fontWeight: '700', color: '#fff' }}>O Meu Perfil</Typography>
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
            {/* Header / Avatar */}
            <View style={styles.profileHero}>
              <TouchableOpacity style={styles.avatarCircle} onPress={() => {}} disabled>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                ) : (
                  <User size={36} color="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditName} style={{ alignItems: 'center', marginTop: 16 }}>
                <Typography variant="h2" style={{ fontWeight: '700', color: '#fff' }}>
                  {user?.name || user?.fullName || 'Utilizador'}
                </Typography>
                <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {user?.email || (authAccount?.email) || 'Sem email associado'}
                </Typography>
                <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, marginTop: 8, letterSpacing: 1 }}>
                   BUILD V2.5-STABLE • UI-R2-FROSTED • {isGuestMode ? 'GUEST' : 'AUTH'}
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Maturidade / Setup Items */}
            {setupItems.length > 0 && (
              <View style={styles.maturityCard}>
                <Typography variant="caption" style={styles.sectionLabel}>MATURIDADE DO ECOSSISTEMA</Typography>
                <View style={{ gap: 8 }}>
                  {setupItems.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      onPress={item.action}
                      style={styles.setupRow}
                    >
                      <View style={styles.setupIconBox}>{item.icon}</View>
                      <View style={{ flex: 1 }}>
                        <Typography style={styles.setupTitle}>{item.title}</Typography>
                        <Typography style={styles.setupDesc}>{item.desc}</Typography>
                      </View>
                      <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Household Selector */}
            {household && (
              <View style={styles.section}>
                <Typography variant="caption" style={styles.sectionLabel}>{household.name.toUpperCase()}</Typography>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  <TouchableOpacity 
                    onPress={() => setActiveMember(null)}
                    style={[styles.memberTab, !activeMemberId && styles.memberTabActive]}>
                      <Typography variant="caption" style={{ color: !activeMemberId ? '#000' : '#fff', fontWeight: '700' }}>Eu</Typography>
                  </TouchableOpacity>
                  {household.members.map(m => (
                    <TouchableOpacity 
                      key={m.id}
                      onPress={() => setActiveMember(m.id)}
                      style={[styles.memberTab, activeMemberId === m.id && styles.memberTabActive]}>
                        <Typography variant="caption" style={{ color: activeMemberId === m.id ? '#000' : '#fff', fontWeight: '700' }}>{m.profile.name}</Typography>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    onPress={() => {/* logic already in setupItems but here for completeness */}}
                    style={styles.memberTabAdd}>
                      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>+ Membro</Typography>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Biometria */}
            <View style={styles.section}>
              <Typography variant="caption" style={styles.sectionLabel}>DADOS BIOMÉTRICOS</Typography>
              <View style={styles.glassGroup}>
                <View style={styles.groupRow}>
                  <TouchableOpacity style={styles.groupCell} onPress={handleEditSex}>
                    <Typography style={styles.cellLabel}>Sexo</Typography>
                    <Typography style={styles.cellValue}>{user?.sex || user?.genderIdentity || '—'}</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.groupCell} onPress={handleEditDateOfBirth}>
                    <Typography style={styles.cellLabel}>Idade</Typography>
                    <Typography style={styles.cellValue}>{userAge !== null ? `${userAge} anos` : '—'}</Typography>
                  </TouchableOpacity>
                </View>
                <View style={styles.groupRow}>
                  <TouchableOpacity style={styles.groupCell} onPress={handleEditHeight}>
                    <Typography style={styles.cellLabel}>Altura</Typography>
                    <Typography style={styles.cellValue}>{user?.height ? `${user.height} cm` : '—'}</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.groupCell} onPress={handleEditWeight}>
                    <Typography style={styles.cellLabel}>Peso</Typography>
                    <Typography style={styles.cellValue}>{user?.weight?.value ? `${user.weight.value} kg` : '—'}</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity 
              style={styles.logoutAction}
              onPress={async () => {
                if (isGuestMode) {
                  useStore.getState().setGuestMode(false);
                  useStore.getState().clearSensitiveState();
                } else {
                  await supabase.auth.signOut();
                  useStore.getState().setUser(null);
                  useStore.getState().setSessionToken(null);
                  useStore.getState().clearSensitiveState();
                }
              }}
            >
              <LogOut size={18} color="#FF453A" />
              <Typography style={{ color: '#FF453A', marginLeft: 10, fontWeight: '600' }}>
                {isGuestMode ? 'Sair do modo Guest' : 'Terminar Sessão'}
              </Typography>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
      
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
    </View>
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
  outerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalPanel: {
    flex: 1,
    marginHorizontal: 16,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 20,
    backgroundColor: 'rgba(10, 15, 25, 0.8)',
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
    paddingBottom: 20,
  },
  profileHero: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  maturityCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  setupIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  setupTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  setupDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    lineHeight: 14,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  glassGroup: {
    gap: 12,
  },
  groupRow: {
    flexDirection: 'row',
    gap: 12,
  },
  groupCell: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cellLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cellValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  memberTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  memberTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  memberTabAdd: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
});
