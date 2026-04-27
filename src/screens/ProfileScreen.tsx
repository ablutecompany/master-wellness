import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, Image, Alert, Modal, SafeAreaView, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { Container, Typography, BlurView } from '../components/Base';
import { theme } from '../theme';
import { 
  ChevronRight, 
  X,
  User,
  LogOut,
  Activity,
  Users,
  Calendar,
  Ruler,
  Dna,
  Settings
} from 'lucide-react-native';
import { GatingOverlay } from '../components/GatingOverlay';
import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useStore(Selectors.selectUser);
  const isGuestMode = useStore(state => state.isGuestMode);
  const authAccount = useStore(state => state.authAccount);
  const household = useStore(Selectors.selectHousehold);
  const activeMemberId = useStore(Selectors.selectActiveMemberId);
  const setActiveMember = useStore(state => state.setActiveMember);
  const hasHydrated = useStore(state => state.hasHydrated);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DATA HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const updateProfileField = (updates: any) => {
    if (isGuestMode) {
      useStore.getState().updateGuestProfile(updates);
    } else {
      useStore.getState().updateAuthenticatedProfile(updates);
    }
  };

  const calculateAge = (dobStr: string | undefined, precision: string | undefined | null): string => {
    if (!dobStr) return '—';
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return '—';
    
    let age = new Date().getFullYear() - dob.getFullYear();
    const m = new Date().getMonth() - (dob.getMonth() || 0);
    if (m < 0 || (m === 0 && new Date().getDate() < (dob.getDate() || 1))) {
      age--;
    }
    
    if (age < 0) return '—';
    
    if (precision === 'day') return `${age} anos`;
    return `aprox. ${age} anos`;
  };

  const ageDisplay = useMemo(() => calculateAge(user?.dateOfBirth, user?.dateOfBirthPrecision), [user?.dateOfBirth, user?.dateOfBirthPrecision]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'birthday' | 'height' | 'sex' | 'weight';
    title: string;
  }>({ visible: false, type: 'birthday', title: '' });

  const [tempDate, setTempDate] = useState<{ year: number; month?: number | null; day?: number | null }>({ year: 2006 });
  const [tempHeight, setTempHeight] = useState(175);
  const [tempWeight, setTempWeight] = useState(60);

  const openModal = (type: 'birthday' | 'height' | 'sex' | 'weight', title: string) => {
    if (type === 'birthday') {
      const dob = user?.dateOfBirth;
      const precision = user?.dateOfBirthPrecision;
      if (dob) {
        const parts = dob.split('-');
        setTempDate({
          year: parseInt(parts[0]) || 2006,
          month: precision !== 'year' && parts[1] ? parseInt(parts[1]) : null,
          day: precision === 'day' && parts[2] ? parseInt(parts[2]) : null
        });
      } else {
        setTempDate({ year: 2006, month: null, day: null });
      }
    } else if (type === 'height') {
      setTempHeight(user?.height || 175);
    } else if (type === 'weight') {
      const w = user?.weight?.manualValue || user?.weight?.value;
      setTempWeight(w ? Math.round(w) : 60);
    }
    setModalConfig({ visible: true, type, title });
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, visible: false }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EDIT ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const saveBirthday = () => {
    let dob = `${tempDate.year}`;
    let precision: 'year' | 'month' | 'day' = 'year';
    
    if (tempDate.month) {
      dob += `-${String(tempDate.month).padStart(2, '0')}`;
      precision = 'month';
      if (tempDate.day) {
        dob += `-${String(tempDate.day).padStart(2, '0')}`;
        precision = 'day';
      }
    }
    
    updateProfileField({ dateOfBirth: dob, dateOfBirthPrecision: precision });
    closeModal();
  };

  const saveHeight = () => {
    updateProfileField({ height: tempHeight });
    closeModal();
  };

  const saveWeight = () => {
    updateProfileField({ 
      weight: { 
        value: tempWeight, 
        manualValue: tempWeight, 
        source: 'manual', 
        unit: 'kg', 
        updatedAt: new Date().toISOString() 
      } 
    });
    closeModal();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. RENDER PICKERS
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBirthdayPicker = () => {
    const years = Array.from({ length: 110 }, (_, i) => 2024 - i);
    const months = [{ label: 'Não indicar', value: null }, ...Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))];
    const days = [{ label: 'Não indicar', value: null }, ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))];

    return (
      <View style={styles.pickerContainer}>
        {/* ANO */}
        <View style={styles.pickerColumn}>
          <Typography variant="caption" style={styles.pickerColLabel}>ANO</Typography>
          <FlatList
            data={years}
            keyExtractor={item => `year-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.wheelItem, tempDate.year === item && styles.wheelItemActive]}
                onPress={() => setTempDate({ ...tempDate, year: item })}
              >
                <Typography style={[styles.wheelText, tempDate.year === item && styles.wheelTextActive]}>{item}</Typography>
              </TouchableOpacity>
            )}
            initialScrollIndex={years.indexOf(tempDate.year) !== -1 ? years.indexOf(tempDate.year) : 18}
            getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* MÊS */}
        <View style={styles.pickerColumn}>
          <Typography variant="caption" style={styles.pickerColLabel}>MÊS</Typography>
          <FlatList
            data={months}
            keyExtractor={item => `month-${item.value}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.wheelItem, tempDate.month === item.value && styles.wheelItemActive]}
                onPress={() => setTempDate({ ...tempDate, month: item.value, day: item.value === null ? null : tempDate.day })}
              >
                <Typography style={[styles.wheelText, tempDate.month === item.value && styles.wheelTextActive, item.value === null && { fontSize: 10 }]}>
                  {item.label}
                </Typography>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* DIA */}
        <View style={styles.pickerColumn}>
          <Typography variant="caption" style={styles.pickerColLabel}>DIA</Typography>
          <FlatList
            data={days}
            keyExtractor={item => `day-${item.value}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.wheelItem, tempDate.day === item.value && styles.wheelItemActive]}
                onPress={() => {
                  if (tempDate.month === null) return;
                  setTempDate({ ...tempDate, day: item.value });
                }}
              >
                <Typography style={[
                  styles.wheelText, 
                  tempDate.day === item.value && styles.wheelTextActive, 
                  item.value === null && { fontSize: 10 },
                  tempDate.month === null && { opacity: 0.1 }
                ]}>
                  {item.label}
                </Typography>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    );
  };

  const renderHeightPicker = () => {
    const range = Array.from({ length: 120 }, (_, i) => 130 + i);
    return (
      <View style={styles.pickerContainer}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={range}
            keyExtractor={item => `h-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.wheelItem, tempHeight === item && styles.wheelItemActive]}
                onPress={() => setTempHeight(item)}
              >
                <Typography style={[styles.wheelText, tempHeight === item && styles.wheelTextActive]}>{item} cm</Typography>
              </TouchableOpacity>
            )}
            initialScrollIndex={range.indexOf(tempHeight) !== -1 ? range.indexOf(tempHeight) : 45}
            getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    );
  };

  const renderWeightPicker = () => {
    const range = Array.from({ length: 221 }, (_, i) => 30 + i);
    return (
      <View style={styles.pickerContainer}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={range}
            keyExtractor={item => `w-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.wheelItem, tempWeight === item && styles.wheelItemActive]}
                onPress={() => setTempWeight(item)}
              >
                <Typography style={[styles.wheelText, tempWeight === item && styles.wheelTextActive]}>{item} kg</Typography>
              </TouchableOpacity>
            )}
            initialScrollIndex={range.indexOf(tempWeight) !== -1 ? range.indexOf(tempWeight) : 30}
            getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    );
  };

  const renderSexPicker = () => {
    const options = [
      { label: 'Homem', value: 'male' },
      { label: 'Mulher', value: 'female' },
      { label: 'Não indicar', value: 'undisclosed' }
    ];
    return (
      <View style={{ gap: 8, marginTop: 10 }}>
        {options.map(opt => (
          <TouchableOpacity 
            key={String(opt.value)}
            style={[styles.choiceBtn, user?.sex === opt.value && styles.choiceBtnActive]}
            onPress={() => {
              updateProfileField({ sex: opt.value });
              closeModal();
            }}
          >
            <Typography style={[styles.choiceText, user?.sex === opt.value && styles.choiceTextActive]}>{opt.label}</Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (!hasHydrated) {
    return (
      <View style={[styles.outerContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#00F2FF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <View>
              <Typography variant="h3" style={{ fontWeight: '700', color: '#fff' }}>Perfil</Typography>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>CONFIGURAÇÃO BIOGRÁFICA</Typography>
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
            {/* HERO SECTION */}
            <View style={styles.heroSection}>
              <View style={styles.avatarContainer}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <User size={32} color="white" />
                )}
              </View>
              
              <View style={styles.nameBlock}>
                <Typography variant="h2" style={styles.profileName}>
                  {user?.name || user?.fullName || (isGuestMode ? 'Convidada' : 'Utilizadora')}
                </Typography>
                <Typography variant="caption" style={styles.profileEmail}>
                  {user?.email || authAccount?.email || 'MODO GUEST LOCAL'}
                </Typography>
                <View style={styles.badgeRow}>
                   <Typography style={styles.versionBadge}>BUILD 2.7 • STABLE</Typography>
                   <Typography style={[styles.modeBadge, { backgroundColor: isGuestMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 242, 255, 0.1)' }]}>
                     {isGuestMode ? 'CONVIDADA' : 'MEMBRO'}
                   </Typography>
                </View>
              </View>
            </View>

            {/* DADOS BIOMÉTRICOS */}
            <View style={styles.menuSection}>
              <Typography variant="caption" style={styles.sectionLabel}>DADOS BIOMÉTRICOS</Typography>
              <View style={styles.cardGroup}>
                
                {/* SEXO */}
                <TouchableOpacity style={styles.groupItem} onPress={() => openModal('sex', 'Sexo')}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(160, 32, 240, 0.1)' }]}>
                      <Dna size={14} color="#A020F0" />
                    </View>
                    <Typography style={styles.itemTitle}>Sexo</Typography>
                  </View>
                  <View style={styles.itemRight}>
                    <Typography style={styles.itemValue}>
                      {user?.sex === 'male' ? 'Homem' : user?.sex === 'female' ? 'Mulher' : 'Não indicado'}
                    </Typography>
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </View>
                </TouchableOpacity>

                {/* IDADE / NASCIMENTO */}
                <TouchableOpacity style={styles.groupItem} onPress={() => openModal('birthday', 'Data de Nascimento')}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                      <Calendar size={14} color="#FF9500" />
                    </View>
                    <Typography style={styles.itemTitle}>Idade</Typography>
                  </View>
                  <View style={styles.itemRight}>
                    <Typography style={styles.itemValue}>{ageDisplay}</Typography>
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </View>
                </TouchableOpacity>

                {/* ALTURA */}
                <TouchableOpacity style={styles.groupItem} onPress={() => openModal('height', 'Altura')}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 242, 255, 0.1)' }]}>
                      <Ruler size={14} color="#00F2FF" />
                    </View>
                    <Typography style={styles.itemTitle}>Altura</Typography>
                  </View>
                  <View style={styles.itemRight}>
                    <Typography style={styles.itemValue}>{user?.height ? `${user.height} cm` : '175 cm'}</Typography>
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </View>
                </TouchableOpacity>

                {/* PESO */}
                <TouchableOpacity style={[styles.groupItem, { borderBottomWidth: 0 }]} onPress={() => openModal('weight', 'Peso')}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 51, 102, 0.1)' }]}>
                      <Activity size={14} color="#FF3366" />
                    </View>
                    <Typography style={styles.itemTitle}>Peso</Typography>
                  </View>
                  <View style={styles.itemRight}>
                    <Typography style={styles.itemValue}>
                      {user?.weight?.manualValue || user?.weight?.value ? `${Math.round(user.weight.manualValue || user.weight.value)} kg` : '60 kg'}
                    </Typography>
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* MEMBROS AGREGADOS */}
            {household && (
              <View style={styles.menuSection}>
                <Typography variant="caption" style={styles.sectionLabel}>MEMBROS AGREGADOS</Typography>
                <View style={styles.cardGroup}>
                  <View style={styles.hhHeader}>
                    <Users size={16} color="#00F2FF" />
                    <Typography style={styles.hhTitle}>{household.name.toUpperCase()}</Typography>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10 }}>
                    <TouchableOpacity 
                      onPress={() => setActiveMember(null)}
                      style={[styles.memberCard, !activeMemberId && styles.memberCardActive]}
                    >
                      <User size={16} color={!activeMemberId ? '#000' : '#fff'} />
                      <Typography style={[styles.memberName, { color: !activeMemberId ? '#000' : '#fff' }]}>Eu</Typography>
                    </TouchableOpacity>

                    {household.members.map(m => (
                      <TouchableOpacity 
                        key={m.id}
                        onPress={() => setActiveMember(m.id)}
                        style={[styles.memberCard, activeMemberId === m.id && styles.memberCardActive]}
                      >
                        <User size={16} color={activeMemberId === m.id ? '#000' : '#fff'} />
                        <Typography style={[styles.memberName, { color: activeMemberId === m.id ? '#000' : '#fff' }]}>{m.profile.name}</Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* LOGOUT */}
            <View style={{ marginTop: 24 }}>
              <TouchableOpacity 
                style={styles.logoutBtn}
                onPress={async () => {
                  if (isGuestMode) {
                    useStore.getState().setGuestMode(false);
                  } else {
                    await supabase.auth.signOut();
                    useStore.getState().setUser(null);
                  }
                  navigation.goBack();
                }}
              >
                <LogOut size={18} color="#FF3B30" />
                <Typography style={styles.logoutText}>
                  {isGuestMode ? 'Sair do Modo Convidada' : 'Terminar Sessão'}
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </SafeAreaView>

      <GatingOverlay />

      {/* REUSABLE PICKER MODAL */}
      <Modal visible={modalConfig.visible} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <BlurView intensity={95} tint="dark" style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Typography variant="h3" style={styles.sheetTitle}>{modalConfig.title}</Typography>
            
            <View style={styles.sheetContent}>
              {modalConfig.type === 'birthday' && renderBirthdayPicker()}
              {modalConfig.type === 'height' && renderHeightPicker()}
              {modalConfig.type === 'sex' && renderSexPicker()}
              {modalConfig.type === 'weight' && renderWeightPicker()}
            </View>

            {modalConfig.type !== 'sex' && (
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={() => {
                  if (modalConfig.type === 'birthday') saveBirthday();
                  else if (modalConfig.type === 'height') saveHeight();
                  else if (modalConfig.type === 'weight') saveWeight();
                }}
              >
                <Typography style={styles.saveBtnText}>CONFIRMAR</Typography>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
               <Typography style={styles.cancelBtnText}>FECHAR</Typography>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#05070A',
  },
  modalPanel: {
    flex: 1,
    marginHorizontal: 16,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  nameBlock: {
    alignItems: 'center',
  },
  profileName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 22,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  versionBadge: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '900',
    letterSpacing: 1,
  },
  modeBadge: {
    fontSize: 8,
    color: '#00F2FF',
    fontWeight: '900',
    letterSpacing: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    textTransform: 'uppercase',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemValue: {
    color: '#00F2FF',
    fontSize: 15,
    fontWeight: '700',
  },
  hhHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  hhTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F2FF',
    letterSpacing: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  memberCardActive: {
    backgroundColor: '#00F2FF',
    borderColor: '#00F2FF',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.15)',
    gap: 10,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#0A0E14',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  sheetContent: {
    minHeight: 250,
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 250,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerColLabel: {
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '800',
    marginBottom: 10,
  },
  wheelItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemActive: {
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
  },
  wheelText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: '500',
  },
  wheelTextActive: {
    color: '#00F2FF',
    fontSize: 18,
    fontWeight: '800',
  },
  choiceBtn: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  choiceBtnActive: {
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderColor: '#00F2FF',
  },
  choiceText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  choiceTextActive: {
    color: '#00F2FF',
    fontWeight: '800',
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#00F2FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
