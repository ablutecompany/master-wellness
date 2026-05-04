import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, Image, Alert, Modal, SafeAreaView, Dimensions, FlatList, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
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
  Settings,
  Edit2
} from 'lucide-react-native';
import { GatingOverlay } from '../components/GatingOverlay';
import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';
import { supabase } from '../services/supabase';
import { getAllSelectableProfiles } from '../utils/household';

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useStore(Selectors.selectUser);
  const isGuestMode = useStore(state => state.isGuestMode);
  const authAccount = useStore(state => state.authAccount);
  const household = useStore(Selectors.selectHousehold);
  const activeMemberId = useStore(Selectors.selectActiveMemberId);
  const setActiveMember = useStore(state => state.setActiveMember);
  const hasHydrated = useStore(state => state.hasHydrated);
  const profileStatus = useStore(state => state.profileStatus);

  const availableProfiles = useMemo(() => {
    return getAllSelectableProfiles(user, household?.members);
  }, [user, household?.members]);

  const activeProfile = availableProfiles.find(p => p.id === activeMemberId) || availableProfiles[0];

  const [profileDraft, setProfileDraft] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const credits = useStore(state => state.credits);

  // Inicializar / Sincronizar o draft a partir da store
  useEffect(() => {
    if (user && !isDirty) {
      console.log('[P0_PROFILE_FORM]', { event: 'mount/sync', storeValue: user, isDirty });
      setProfileDraft({ ...user });
    } else if (user && isDirty) {
      // OVERWRITE GUARD
      console.log('[P0_PROFILE_OVERWRITE_GUARD]', {
        attemptedOverwrite: true,
        reason: 'Store user updated while form is dirty',
        blocked: true,
        incomingProfileKeys: Object.keys(user),
        existingDraftKeys: profileDraft ? Object.keys(profileDraft) : []
      });
    }
  }, [user]);


  // Helper para atualizar o draft localmente (marca como dirty)
  const updateDraft = (updates: any) => {
    setProfileDraft((prev: any) => {
      const next = { ...prev, ...updates };
      console.log('[P0_PROFILE_FORM]', { event: 'input_change', field: Object.keys(updates), draftValue: next });
      return next;
    });
    setIsDirty(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DATA HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
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

  const ageDisplay = useMemo(() => calculateAge(profileDraft?.dateOfBirth, profileDraft?.dateOfBirthPrecision), [profileDraft?.dateOfBirth, profileDraft?.dateOfBirthPrecision]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'birthday' | 'height' | 'sex' | 'weight' | 'name' | 'email' | 'avatar';
    title: string;
  }>({ visible: false, type: 'birthday', title: '' });

  const [tempDate, setTempDate] = useState<{ year: number; month?: number | null; day?: number | null }>({ year: 2006 });
  const [tempHeight, setTempHeight] = useState(175);
  const [tempWeight, setTempWeight] = useState(60);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');

  // Modais de Membro
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [tempMember, setTempMember] = useState({ name: '', relationship: 'Filho/a', sex: 'male', dateOfBirth: '' });

  const [memberActionModalVisible, setMemberActionModalVisible] = useState(false);
  const [targetMember, setTargetMember] = useState<any>(null);

  const openMemberAction = (member: any) => {
    setTargetMember(member);
    setMemberActionModalVisible(true);
  };

  const openModal = (type: 'birthday' | 'height' | 'sex' | 'weight' | 'name' | 'email' | 'avatar', title: string) => {
    if (type === 'birthday') {
      const dob = profileDraft.dateOfBirth;
      const precision = profileDraft.dateOfBirthPrecision;
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
      setTempHeight(profileDraft.height || 175);
    } else if (type === 'weight') {
      const w = profileDraft.weight?.manualValue || profileDraft.weight?.value;
      setTempWeight(w ? Math.round(w) : 60);
    } else if (type === 'name') {
      setTempName(profileDraft.name || profileDraft.fullName || '');
    } else if (type === 'email') {
      setTempEmail(profileDraft.email || authAccount?.email || '');
    } else if (type === 'avatar') {
      setTempAvatar(profileDraft.avatarUrl || '');
    }
    setModalConfig({ visible: true, type, title });
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, visible: false }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EDIT ACTIONS (Apply to draft & Trigger Save)
  // ─────────────────────────────────────────────────────────────────────────────
  const triggerSave = async (updates: any) => {
    console.log('[P0_PROFILE_FORM]', { event: 'save_start', field: Object.keys(updates), draftValue: { ...profileDraft, ...updates }, isSaving: true });
    setIsSaving(true);
    
    // Optimistic local update of draft
    setProfileDraft((prev: any) => ({ ...prev, ...updates }));
    
    let success = false;
    if (isGuestMode) {
      useStore.getState().updateGuestProfile(updates);
      success = true;
    } else {
      success = await useStore.getState().updateAuthenticatedProfile(updates);
    }

    if (success) {
      console.log('[P0_PROFILE_FORM]', { event: 'save_success', field: Object.keys(updates) });
      setIsDirty(false); // Clean state after successful save
    } else {
      console.log('[P0_PROFILE_FORM]', { event: 'save_error', field: Object.keys(updates) });
      Alert.alert('Erro', 'Ocorreu um erro ao guardar as tuas alterações.');
      // Keep isDirty true so the draft isn't overwritten by stale store data
    }
    
    setIsSaving(false);
  };

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
    
    triggerSave({ dateOfBirth: dob, dateOfBirthPrecision: precision });
    closeModal();
  };

  const saveHeight = () => {
    triggerSave({ height: tempHeight });
    closeModal();
  };

  const saveWeight = () => {
    triggerSave({ 
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

  const saveName = () => {
    triggerSave({ name: tempName });
    closeModal();
  };

  const saveAvatar = () => {
    triggerSave({ avatarUrl: tempAvatar });
    closeModal();
  };

  const removeAvatar = () => {
    triggerSave({ avatarUrl: null, _explicitAvatarRemoval: true });
    closeModal();
  };

  const handleSaveMember = () => {
    if (!tempMember.name.trim()) {
      Alert.alert('Erro', 'O nome do membro é obrigatório.');
      return;
    }
    const store = useStore.getState();
    if (editingMemberId) {
      const hh = store.household;
      if (hh) {
        const newMembers = hh.members.map((m:any) => m.id === editingMemberId ? { ...m, name: tempMember.name, relationship: tempMember.relationship, sex: tempMember.sex, dateOfBirth: tempMember.dateOfBirth } : m);
        store.setHousehold({ ...hh, members: newMembers });
      }
    } else {
      const newMember = {
        id: `member_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        name: tempMember.name,
        relationship: tempMember.relationship,
        dateOfBirth: tempMember.dateOfBirth || null,
        sex: tempMember.sex || null,
        heightCm: null,
        weightKg: null,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log('[P0_MEMBER_CREATE]', { memberId: newMember.id, name: newMember.name, relationship: newMember.relationship });
      store.addHouseholdMember(newMember);
      
      Alert.alert('Sucesso', 'Membro adicionado ao agregado.', [
        { text: 'Não ativar' },
        { text: 'Tornar ativo agora', onPress: () => store.setActiveMember(newMember.id) }
      ]);
    }
    setMemberModalVisible(false);
  };

  const handleArchiveMember = (member: any) => {
    if (member.isPrimary) {
      Alert.alert('Erro', 'Não pode arquivar o Perfil principal.');
      return;
    }
    Alert.alert(
      'Arquivar Membro',
      'Arquivar este membro remove-o da lista ativa. Dados históricos associados poderão deixar de aparecer nas vistas principais. (Persistência local nesta fase).',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Arquivar', style: 'destructive', onPress: () => {
          useStore.getState().archiveHouseholdMember(member.id);
          setMemberActionModalVisible(false);
        }}
      ]
    );
  };

  const processAvatarAsset = async (sourceUri: string, sourceFileName?: string | null) => {
    console.log('[P0_AVATAR_PROCESSING] start processing', { sourceUri });
    try {
      // 1. Redimensionar para 512x512 ou max 768x768
      let manipResult = await ImageManipulator.manipulateAsync(
        sourceUri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      // 2. Verificar tamanho inicial
      let sizeInBytes = manipResult.base64 ? (manipResult.base64.length * 3) / 4 : 0;
      let sizeInMb = sizeInBytes / (1024 * 1024);

      console.log('[P0_AVATAR_PROCESSING] first pass', { sizeInMb: sizeInMb.toFixed(2), width: manipResult.width });

      // 3. Compressão agressiva se ainda > 1MB
      if (sizeInMb > 1) {
         console.warn('[P0_AVATAR_PROCESSING] too large, compressing further (0.3)');
         manipResult = await ImageManipulator.manipulateAsync(
            manipResult.uri,
            [],
            { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
         );
         sizeInBytes = manipResult.base64 ? (manipResult.base64.length * 3) / 4 : 0;
         sizeInMb = sizeInBytes / (1024 * 1024);
      }

      // 4. Último nível de compressão se > 1MB
      if (sizeInMb > 1) {
         console.warn('[P0_AVATAR_PROCESSING] still too large, aggressive compress (0.1)');
         manipResult = await ImageManipulator.manipulateAsync(
            manipResult.uri,
            [{ resize: { width: 256, height: 256 } }],
            { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
         );
         sizeInBytes = manipResult.base64 ? (manipResult.base64.length * 3) / 4 : 0;
         sizeInMb = sizeInBytes / (1024 * 1024);
      }

      // 5. Validar limite final absoluto
      if (sizeInMb > 1.2 || !manipResult.base64) {
         console.error('[P0_AVATAR_PROCESSING] Rejeitado por tamanho final.', { sizeInMb });
         Alert.alert('Imagem demasiado pesada', `A imagem continua demasiado pesada (${sizeInMb.toFixed(1)}MB) mesmo após compressão. Escolha outra fotografia ou um formato mais pequeno.`);
         return;
      }

      console.log('[P0_AVATAR_PROCESSING] success', {
         resizeApplied: true,
         outputWidth: manipResult.width,
         outputHeight: manipResult.height,
         outputBase64Length: manipResult.base64?.length,
         outputEstimatedBytes: sizeInBytes
      });

      const dataUrl = `data:image/jpeg;base64,${manipResult.base64}`;
      setTempAvatar(dataUrl);
    } catch (err: any) {
      console.error('[P0_AVATAR_PROCESSING] fail', err);
      Alert.alert('Erro ao processar', 'Não foi possível preparar esta fotografia. Pode tratar-se de um formato não suportado ou erro de memória. Tente outra imagem.');
    }
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Recusada', 'A app precisa de acesso às fotografias. Pode alterar isto nas definições do seu dispositivo.');
        console.log('[P0_AVATAR_PICKER]', { action: 'gallery', permissionStatus: status });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // Let manipulator handle compression
        base64: false, // We don't need it yet, manipulator will create it
      });

      console.log('[P0_AVATAR_PICK_RESULT]', { 
        source: 'gallery',
        cancelled: result.canceled,
        uri: result.assets?.[0]?.uri,
        mimeType: result.assets?.[0]?.mimeType,
        fileSize: result.assets?.[0]?.fileSize
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAvatarAsset(result.assets[0].uri, result.assets[0].fileName);
      }
    } catch (e) {
      console.error('[P0_AVATAR_PICKER] Error picking image:', e);
    }
  };

  const handleTakeAvatar = async () => {
    if (Platform.OS === 'web') {
      // On some web environments, camera API isn't fully supported via launchCameraAsync
      Alert.alert('Câmara não suportada', 'O acesso direto à câmara pode não ser suportado neste browser. Utilize a opção "Escolher da Galeria" e, se o browser permitir, poderá tirar foto a partir daí.');
    }
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Recusada', 'A app precisa de acesso à câmara. Altere esta opção nas definições.');
        console.log('[P0_AVATAR_PICKER]', { action: 'camera', permissionStatus: status });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: false,
      });

      console.log('[P0_AVATAR_PICK_RESULT]', { 
        source: 'camera',
        cancelled: result.canceled,
        uri: result.assets?.[0]?.uri,
        fileSize: result.assets?.[0]?.fileSize
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAvatarAsset(result.assets[0].uri, result.assets[0].fileName);
      }
    } catch (e) {
      console.error('[P0_AVATAR_PICKER] Error taking image:', e);
      Alert.alert('Erro na câmara', 'Não foi possível iniciar a câmara. Tente a opção Galeria.');
    }
  };

  const saveEmail = async () => {
    if (!tempEmail || !tempEmail.includes('@')) {
      Alert.alert('Erro', 'Por favor, insere um email válido.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ email: tempEmail });
      if (error) throw error;
      Alert.alert('Confirmação enviada', 'Um link de confirmação foi enviado para o novo email. O email atual será mantido até confirmares o novo.');
      closeModal();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao alterar o email.');
    }
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
                style={[styles.wheelItem, tempDate.year === item ? styles.wheelItemActive : {}]}
                onPress={() => setTempDate({ ...tempDate, year: item })}
              >
                <Typography style={[styles.wheelText, tempDate.year === item ? styles.wheelTextActive : {}]}>{item}</Typography>
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
                style={[styles.wheelItem, tempDate.month === item.value ? styles.wheelItemActive : {}]}
                onPress={() => setTempDate({ ...tempDate, month: item.value, day: item.value === null ? null : tempDate.day })}
              >
                <Typography style={[styles.wheelText, tempDate.month === item.value ? styles.wheelTextActive : {}, item.value === null ? { fontSize: 10 } : {}]}>
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
                style={[styles.wheelItem, tempDate.day === item.value ? styles.wheelItemActive : {}]}
                onPress={() => {
                  if (tempDate.month === null) return;
                  setTempDate({ ...tempDate, day: item.value });
                }}
              >
                <Typography style={[
                  styles.wheelText, 
                  tempDate.day === item.value ? styles.wheelTextActive : {}, 
                  item.value === null ? { fontSize: 10 } : {},
                  tempDate.month === null ? { opacity: 0.1 } : {}
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
                <Typography style={[styles.wheelText, tempHeight === item ? styles.wheelTextActive : {}]}>{item} cm</Typography>
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
                <Typography style={[styles.wheelText, tempWeight === item ? styles.wheelTextActive : {}]}>{item} kg</Typography>
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
            style={[styles.choiceBtn, profileDraft.sex === opt.value ? styles.choiceBtnActive : {}]}
            onPress={() => {
              updateDraft({ sex: opt.value });
              triggerSave({ sex: opt.value });
              closeModal();
            }}
          >
            <Typography style={[styles.choiceText, profileDraft.sex === opt.value ? styles.choiceTextActive : {}]}>{opt.label}</Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderNameInput = () => (
    <View style={styles.textInputContainer}>
      <TextInput
        style={styles.textInputField}
        value={tempName}
        onChangeText={(txt) => {
          setTempName(txt);
          updateDraft({ name: txt });
        }}
        placeholder="O teu nome"
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoFocus={true}
      />
    </View>
  );

  const renderEmailInput = () => (
    <View style={styles.textInputContainer}>
      <TextInput
        style={[styles.textInputField, { opacity: 0.5 }]}
        value={tempEmail}
        editable={false}
        placeholder="O teu email"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="rgba(255,255,255,0.3)"
      />
      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
        O email da conta é gerido na autenticação.
      </Typography>
    </View>
  );

  const renderAvatarInput = () => (
    <View style={{ gap: 12 }}>
      <TouchableOpacity style={styles.actionBtn} onPress={handleTakeAvatar}>
        <Typography style={styles.actionBtnText}>Tirar Foto</Typography>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionBtn} onPress={handlePickAvatar}>
        <Typography style={styles.actionBtnText}>Escolher da Galeria</Typography>
      </TouchableOpacity>

      {tempAvatar ? (
        <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF3B30' }]} onPress={() => setTempAvatar('')}>
          <Typography style={[styles.actionBtnText, { color: '#FF3B30' }]}>Remover Foto</Typography>
        </TouchableOpacity>
      ) : null}

      <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
        Opções nativas para avatar. A integração definitiva com Supabase Storage estará ativa brevemente.
      </Typography>
    </View>
  );
  // ─────────────────────────────────────────────────────────────────────────────
  // 5. MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (profileStatus !== 'loaded' && profileStatus !== 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00F2FF" />
      </View>
    );
  }

  if (!activeProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00F2FF" />
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
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{`PERFIL ATIVO: ${activeProfile?.name?.toUpperCase()}`}</Typography>
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
              <TouchableOpacity style={styles.avatarContainer} onPress={() => openModal('avatar', 'Alterar Foto')}>
                {profileDraft.avatarUrl ? (
                  <Image source={{ uri: profileDraft.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <User size={32} color="white" />
                )}
                <View style={styles.editBadge}>
                  <Edit2 size={12} color="#fff" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.nameBlock}>
                <TouchableOpacity onPress={() => openModal('name', 'Editar Nome')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Typography variant="h2" style={styles.profileName}>
                    {profileDraft.name || profileDraft.fullName || (isGuestMode ? 'Convidada' : 'Utilizadora')}
                  </Typography>
                  <Edit2 size={14} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Typography variant="caption" style={styles.profileEmail}>
                    {profileDraft.email || authAccount?.email || 'MODO GUEST LOCAL'}
                  </Typography>
                </View>
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
              <View style={styles.biometricRow}>
                
                {/* SEXO */}
                <TouchableOpacity style={styles.bioCard} onPress={() => openModal('sex', 'Sexo')}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(160, 32, 240, 0.1)' }]}>
                    <Dna size={14} color="#A020F0" />
                  </View>
                  <Typography style={styles.bioValue}>
                    {profileDraft.sex === 'male' ? 'Homem' : profileDraft.sex === 'female' ? 'Mulher' : '?'}
                  </Typography>
                  <Typography variant="caption" style={styles.bioLabel}>Sexo</Typography>
                </TouchableOpacity>

                {/* IDADE / NASCIMENTO */}
                <TouchableOpacity style={styles.bioCard} onPress={() => openModal('birthday', 'Data de Nascimento')}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                    <Calendar size={14} color="#FF9500" />
                  </View>
                  <Typography style={styles.bioValue}>{ageDisplay.split(' ')[0]}</Typography>
                  <Typography variant="caption" style={styles.bioLabel}>Anos</Typography>
                </TouchableOpacity>

                {/* ALTURA */}
                <TouchableOpacity style={styles.bioCard} onPress={() => openModal('height', 'Altura')}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 242, 255, 0.1)' }]}>
                    <Ruler size={14} color="#00F2FF" />
                  </View>
                  <Typography style={styles.bioValue}>{profileDraft.height || 175}</Typography>
                  <Typography variant="caption" style={styles.bioLabel}>cm</Typography>
                </TouchableOpacity>

              </View>
            </View>

            {/* CRÉDITOS / TOKENS */}
            <View style={styles.menuSection}>
              <TouchableOpacity 
                style={styles.tokensCard} 
                onPress={() => setShowTokensModal(true)}
              >
                <View style={styles.tokensCardLeft}>
                  <View style={styles.tokensIconContainer}>
                    <Image 
                      source={require('../../assets/token_abl.png')} 
                      style={styles.tokensIconImg} 
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Typography style={styles.tokensCardTitle}>Créditos / Tokens</Typography>
                    <Typography style={styles.tokensCardSubtitle}>Saldo atual e compra de planos</Typography>
                  </View>
                </View>
                <View style={styles.tokensCardRight}>
                  <Typography style={styles.tokensCardValue}>{credits ?? 0}</Typography>
                  <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                </View>
              </TouchableOpacity>
            </View>

            {/* MEMBROS AGREGADOS */}
            <View style={styles.menuSection}>
              <Typography variant="caption" style={styles.sectionLabel}>MEMBROS DO AGREGADO</Typography>
              <View style={styles.cardGroup}>
                {availableProfiles.map((p, index) => (
                  <TouchableOpacity 
                    key={p.id}
                    style={[styles.groupItem, index === availableProfiles.length - 1 && { borderBottomWidth: 0 }]} 
                    onPress={() => {
                      if (p.isPrimary) {
                        Alert.alert('Perfil Principal', 'Edite os seus dados na área principal do Perfil.');
                      } else {
                        openMemberAction(p);
                      }
                    }}
                  >
                    <View style={styles.itemLeft}>
                      <View style={[styles.iconBox, { backgroundColor: p.isPrimary ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)' }]}>
                        {p.isPrimary ? <User size={14} color="#00F2FF" /> : <Users size={14} color="#fff" />}
                      </View>
                      <View>
                        <Typography style={styles.itemTitle}>{p.name} {p.isPrimary && '(Eu)'}</Typography>
                        <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.relationship}</Typography>
                      </View>
                    </View>
                    <View style={styles.itemRight}>
                      {activeMemberId === p.id && (
                        <View style={{ backgroundColor: 'rgba(0,242,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 }}>
                          <Typography style={{ color: '#00F2FF', fontSize: 10, fontWeight: '800' }}>ATIVO</Typography>
                        </View>
                      )}
                      <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={[styles.groupItem, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' }]} 
                  onPress={() => {
                    setEditingMemberId(null);
                    setTempMember({ name: '', relationship: 'Filho/a', sex: 'male', dateOfBirth: '' });
                    setMemberModalVisible(true);
                  }}
                >
                  <Typography style={{ color: '#00F2FF', fontWeight: '600' }}>+ Adicionar membro</Typography>
                </TouchableOpacity>
              </View>
            </View>

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
                    useStore.getState().clearSensitiveState();
                  }
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={95} tint="dark" style={styles.pickerSheet}>
              <View style={styles.sheetHandle} />
            <Typography variant="h3" style={styles.sheetTitle}>{modalConfig.title}</Typography>
            
            <View style={styles.sheetContent}>
              {modalConfig.type === 'birthday' && renderBirthdayPicker()}
              {modalConfig.type === 'height' && renderHeightPicker()}
              {modalConfig.type === 'sex' && renderSexPicker()}
              {modalConfig.type === 'weight' && renderWeightPicker()}
              {modalConfig.type === 'name' && renderNameInput()}
              {modalConfig.type === 'email' && renderEmailInput()}
              {modalConfig.type === 'avatar' && renderAvatarInput()}
            </View>

            {modalConfig.type !== 'sex' && (
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={() => {
                  if (modalConfig.type === 'birthday') saveBirthday();
                  else if (modalConfig.type === 'height') saveHeight();
                  else if (modalConfig.type === 'weight') saveWeight();
                  else if (modalConfig.type === 'name') saveName();
                  else if (modalConfig.type === 'email') saveEmail();
                  else if (modalConfig.type === 'avatar') saveAvatar();
                }}
              >
                <Typography style={styles.saveBtnText}>{isSaving ? 'A GUARDAR...' : 'CONFIRMAR'}</Typography>
              </TouchableOpacity>
            )}
            
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                 <Typography style={styles.cancelBtnText}>FECHAR</Typography>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── TOKENS INFORMATION MODAL ────────────────────────────────────── */}
      <Modal visible={showTokensModal} transparent animationType="slide" onRequestClose={() => setShowTokensModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTokensModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={95} tint="dark" style={[styles.pickerSheet, { paddingHorizontal: 24 }]}>
              <View style={styles.sheetHandle} />
              
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                  <Image 
                    source={require('../../assets/token_abl.png')} 
                    style={{ width: 40, height: 40 }} 
                    resizeMode="contain"
                  />
                </View>
                <Typography variant="h2" style={{ textAlign: 'center', color: '#fff', marginBottom: 8 }}>Tokens ablute_</Typography>
                <Typography style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 20 }}>
                  Os tokens são usados para funcionalidades inteligentes e interações avançadas da app.
                </Typography>
              </View>

              <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                <Typography style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8, fontWeight: '800' }}>SALDO DISPONÍVEL</Typography>
                <Typography style={{ fontSize: 32, color: '#00F2FF', fontWeight: '800' }}>{credits ?? 0}</Typography>
              </View>
              
              <Typography style={{ fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 16 }}>Planos de Créditos</Typography>
              
              <View style={{ gap: 12, marginBottom: 24 }}>
                <TouchableOpacity style={styles.tokenPackCard} onPress={() => Alert.alert('Brevemente', 'Compra será ligada numa fase seguinte.')}>
                  <View>
                    <Typography style={styles.tokenPackTitle}>Pack Pequeno</Typography>
                    <Typography style={styles.tokenPackDesc}>Ideal para utilização ocasional</Typography>
                  </View>
                  <View style={styles.tokenPackRight}>
                    <Typography style={styles.tokenPackPrice}>4,99 €</Typography>
                    <View style={styles.tokenPackAmount}>
                      <Typography style={styles.tokenPackAmountText}>500</Typography>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tokenPackCard} onPress={() => Alert.alert('Brevemente', 'Compra será ligada numa fase seguinte.')}>
                  <View>
                    <Typography style={styles.tokenPackTitle}>Pack Médio</Typography>
                    <Typography style={styles.tokenPackDesc}>O melhor equilíbrio para uso regular</Typography>
                  </View>
                  <View style={styles.tokenPackRight}>
                    <Typography style={styles.tokenPackPrice}>9,99 €</Typography>
                    <View style={styles.tokenPackAmount}>
                      <Typography style={styles.tokenPackAmountText}>1200</Typography>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%', marginTop: 0 }]}
                onPress={() => setShowTokensModal(false)}
              >
                <Typography style={styles.saveBtnText}>FECHAR</Typography>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
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
  biometricRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  bioCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    alignItems: 'center',
    gap: 4,
    minHeight: 100,
    justifyContent: 'center',
  },
  bioValue: {
    color: '#00F2FF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  bioLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#00F2FF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#05070A',
  },
  textInputContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  textInputField: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#fff',
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
  },
  tokensCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
    padding: 16,
  },
  tokensCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tokensIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokensIconImg: {
    width: 28,
    height: 28,
  },
  tokensCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tokensCardValue: {
    fontWeight: '700',
    fontSize: 18,
    color: theme.colors.text,
  },
  actionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  actionBtnText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#00F2FF',
  },
  tokensCardSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  tokensCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },

  tokenPackCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  tokenPackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tokenPackDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
  },
  tokenPackRight: {
    alignItems: 'flex-end',
  },
  tokenPackPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  tokenPackAmount: {
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  tokenPackAmountText: {
    color: '#00F2FF',
    fontSize: 12,
    fontWeight: '800',
  },
});
