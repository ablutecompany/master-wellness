import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Container, Typography, LinearGradient, BlurView } from '../components/Base';
import { theme } from '../theme';
import { 
  Database, 
  Activity, 
  Heart,
  Smartphone,
  Info,
  X
} from 'lucide-react-native';
import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';
import { GatingOverlay } from '../components/GatingOverlay';

interface Exam {
  id: string;
  name: string;
  value: string;
  unit: string;
  source: 'ablute' | 'health_kit';
  timestamp: string;
}

const TYPE_MAP: Record<string, { name: string; unit: string; source: 'ablute' | 'health_kit' }> = {
  urinalysis: { name: 'Análise Urinária', unit: '', source: 'ablute' },
  ecg: { name: 'Ritmo Cardíaco', unit: 'bpm', source: 'health_kit' },
  ppg: { name: 'PPG', unit: '', source: 'health_kit' },
  weight: { name: 'Peso', unit: 'kg', source: 'health_kit' },
  temp: { name: 'Temperatura', unit: '°C', source: 'health_kit' },
};

export const AnalysesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const storeMeasurements = useStore(Selectors.selectMeasurements);
  const demoAnalysis = useStore(state => state.demoAnalysis);
  const isGuestMode = useStore(state => state.isGuestMode);
  const hasResultsAccess = useStore(Selectors.selectHasResultsAccess);
  const user = useStore(Selectors.selectUser);

  // Use the demo's mocked measurements preferentially if in sandbox mode
  const rawMeasurements = demoAnalysis 
    ? demoAnalysis.measurements.map(m => ({ id: m.id, type: m.type, sourceAppId: m.sourceAppId || 'demo', timestamp: m.recordedAt, value: { marker: m.marker, value: m.value, unit: m.unit } as any }))
    : storeMeasurements;

  const measurements = rawMeasurements;

  const exams: Exam[] = rawMeasurements.map((m) => {
    const config = TYPE_MAP[m.type] || { name: m.type, unit: '', source: 'health_kit' };
    
    // Se o valor for um objeto com campo 'marker', usamos como nome
    const name = (m.type === 'urinalysis' && m.value?.marker) ? m.value.marker : config.name;
    const valStr = typeof m.value === 'object' ? (m.value.displayValue || m.value.value || '---') : String(m.value);
    const unit = m.value?.unit || config.unit;

    return {
      id: m.id,
      name,
      value: valStr,
      unit,
      source: config.source,
      timestamp: new Date(m.timestamp).toLocaleDateString('pt-PT', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  });

  // Dividir em seções (exemplo: Core vs Biomarcadores)
  const coreExams = exams.filter(e => e.source === 'health_kit');
  const biomarkerExams = exams.filter(e => e.source === 'ablute');

  const renderSection = (title: string, data: Exam[]) => {
    if (data.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionTitle}>{title}</Typography>
        
        {data.map((item, index) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.row, index !== data.length - 1 && styles.rowBorder]}
            onPress={() => setSelectedExam(item)}
          >
            <View style={styles.rowLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.source === 'ablute' ? (
                  <Database size={12} color={theme.colors.biologicalBlue} style={{ marginRight: 6 }} />
                ) : (
                  <Smartphone size={12} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                )}
                <Typography style={styles.name}>{item.name}</Typography>
              </View>
              <Typography variant="caption" style={styles.timestamp}>{item.timestamp}</Typography>
            </View>
            
            <View style={styles.rowRight}>
              <Typography style={styles.value}>{item.value}</Typography>
              <Typography variant="caption" style={styles.unit}>{item.unit}</Typography>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Container safe style={styles.container}>
      {/* Immersive Background Atmosphere */}
      <View style={styles.atmosphere}>
        <LinearGradient 
          colors={['rgba(0, 85, 255, 0.1)', 'transparent']}
          style={[styles.glowBall, { top: -150, right: -150 }]} 
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Typography style={styles.backText}>{'< Voltar'}</Typography>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <Typography variant="h2" style={[styles.title, { marginBottom: 0 }]}>Bioanálise</Typography>
            {user?.name && (
              <View style={{ backgroundColor: 'rgba(0,242,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 12 }}>
                <Typography style={{ color: '#00F2FF', fontWeight: '800', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {user.name.split(' ')[0]}
                </Typography>
              </View>
            )}
          </View>
          <Typography style={styles.subtitle}>
            Leitura em tempo real da {user?.name ? `infraestrutura biológica selecionada.` : `sua infraestrutura biológica.`}
          </Typography>
        </View>

        <GatingOverlay
          isBlocked={isGuestMode}
          message="Inicie sessão para guardar e consultar histórico"
          actionLabel="Página Inicial"
          onAction={() => navigation.navigate('Welcome')}
        >
          <View style={{ minHeight: 300 }}>

        {!hasResultsAccess ? (
          <View style={[styles.emptyState, { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, paddingVertical: 60, marginHorizontal: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
               <Typography style={{ fontSize: 24 }}>🔒</Typography>
            </View>
            <Typography style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '800', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Acesso Restrito</Typography>
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 }}>
               Este membro optou por manter o seu histórico biográfico privado. Solicita a partilha de permissões para visionares esta lista orgânica.
            </Typography>
          </View>
        ) : measurements.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>Ainda não existem medições disponíveis.</Typography>
            <Typography variant="caption" style={styles.emptySubtext}>
               As tuas leituras sincronizadas aparecerão aqui assim que forem capturadas.
            </Typography>
          </View>
        ) : (
          <>
            {renderSection('METABOLISMO & DADOS CORE', coreExams)}
            {renderSection('MARCADORES URINÁRIOS', biomarkerExams)}
          </>
        )}

        <View style={styles.disclaimerContainer}>
            <Typography variant="caption" style={styles.bottomDisclaimer}>
               <Info size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
               Estes dados são apenas para referência informativa e não substituem aconselhamento médico profissional.
            </Typography>
        </View>
        </View>
        </GatingOverlay>
        
      </ScrollView>

      {/* Explanation Modal */}
      <Modal
        visible={!!selectedExam}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackgroundDismiss} onPress={() => setSelectedExam(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" style={styles.modalTitle}>{selectedExam?.name}</Typography>
              <TouchableOpacity onPress={() => setSelectedExam(null)} style={styles.modalClose}>
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
               <Typography style={styles.modalText}>
                  Leitura biológica indexada em tempo real pela infraestrutura de análise. 
                  Registo factual de medição capturado e apresentado no seu estado bruto para acompanhamento diário.
               </Typography>
               <Typography variant="caption" style={styles.modalDisclaimer}>
                  <Info size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                  Este dado faz parte do teu Audit Trace e serve para monitorização funcional. 
                  Não substitui diagnósticos clínicos ou exames laboratoriais certificados.
               </Typography>
            </View>
          </View>
        </BlurView>
      </Modal>
    </Container>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05070A',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowBall: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(0, 242, 255, 0.03)',
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } as any : {}),
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
    paddingTop: 40,
  },
  header: {
    marginBottom: 54,
  },
  backButton: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#00F2FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 22,
  },
  section: {
    marginBottom: 48,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    letterSpacing: 3,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  rowLeft: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  value: {
    color: '#00F2FF',
    fontSize: 18,
    fontWeight: '800',
  },
  unit: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
  disclaimerContainer: {
    marginTop: 24,
  },
  bottomDisclaimer: {
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackgroundDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#0A0E14',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
  },
  modalClose: {
    padding: 8,
  },
  modalBody: {
    gap: 16,
  },
  modalText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
  },
  modalDisclaimer: {
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginTop: 16,
  }
});
