import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from './Base';
import { X, ChevronRight, Calendar } from 'lucide-react-native';

// O Modal agora foca-se exclusivamente na navegação temporal

// ── Modal ─────────────────────────────────────────────────────────────────────
import { Analysis } from '../store/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  analyses?: Analysis[];
  activeAnalysisId?: string | null;
  onSelectAnalysis?: (id: string) => void;
}

export const HistoricoModal: React.FC<Props> = ({ visible, onClose, analyses = [], activeAnalysisId, onSelectAnalysis }) => {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 32, 460);
  const chartW = cardW - 48;

  const overlayExtras = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={[styles.overlay, overlayExtras]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        <View style={[styles.card, { width: cardW }]}>
          <View style={styles.header}>
            <View>
              <Typography style={styles.headerTitle}>HISTÓRICO</Typography>
              <Typography style={styles.headerSub}>Selecione a análise para visualizar os detalhes</Typography>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* O Modal foca-se agora exclusivamente na navegação temporal */}

            <View style={styles.divider} />
            
            <View style={{ paddingVertical: 8 }}>
              <Typography style={[styles.headerTitle, { color: 'rgba(255,255,255,0.4)', marginBottom: 16 }]}>SELECIONAR ANÁLISE</Typography>
              
              {analyses.length > 0 ? (
                analyses.map((analysis, idx) => {
                  const isSelected = analysis.id === activeAnalysisId;
                  const isLatest = idx === 0;
                  const dateObj = new Date(analysis.analysisDate);
                  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                  const displayDate = `${dateObj.getDate().toString().padStart(2, '0')} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

                  return (
                    <TouchableOpacity
                      key={analysis.id}
                      onPress={() => onSelectAnalysis?.(analysis.id)}
                      style={[
                        styles.dateRow,
                        isSelected && { borderColor: '#00F2FF', backgroundColor: 'rgba(0, 242, 255, 0.05)' }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Calendar size={16} color={isSelected ? '#00F2FF' : 'rgba(255,255,255,0.3)'} />
                        <View style={{ marginLeft: 12 }}>
                          <Typography style={[styles.dateText, isSelected && styles.selectedDateText]}>
                            {displayDate}
                          </Typography>
                          {isLatest && (
                            <View style={styles.latestBadge}>
                              <Typography style={styles.latestText}>ÚLTIMA ANÁLISE</Typography>
                            </View>
                          )}
                        </View>
                      </View>
                      <ChevronRight size={18} color={isSelected ? '#00F2FF' : 'rgba(255,255,255,0.2)'} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Typography style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
                  Nenhuma análise anterior encontrada.
                </Typography>
              )}
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    maxHeight: '88%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(5,10,20,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 14,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginTop: 3,
    fontStyle: 'italic',
  },
  closeBtn: { padding: 4 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  chartCaption: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  // Date Selection
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 12,
  },
  dateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  selectedDateText: {
    color: '#fff',
    fontWeight: '700',
  },
  latestBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  latestText: {
    color: '#00D4AA',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
