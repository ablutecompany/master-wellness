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
import { Typography, BlurView } from './Base';
import { StateSurface, SynthesisActionCard, WeeklyBriefingCard } from './ShellStateSurfaces';
import { X, ChevronRight, Calendar, Users, Activity, Share2, ShieldAlert } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

// O Modal agora foca-se exclusivamente na navegação temporal

// ── Modal ─────────────────────────────────────────────────────────────────────
import { Analysis } from '../store/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  activeAnalysisId?: string | null;
  onSelectAnalysis?: (id: string) => void;
  onGlobalAction?: (intent: string) => void;
}

import { useStore } from '../store/useStore';
import * as Selectors from '../store/selectors';

export const HistoricoModal: React.FC<Props> = ({ visible, onClose, activeAnalysisId, onSelectAnalysis, onGlobalAction }) => {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 32, 460);
  const timeline = useStore(useShallow(Selectors.selectUnifiedTimeline));
  const dailySynthesis = useStore(useShallow(state => Selectors.selectDailySynthesis(state)));
  const weeklyBriefing = useStore(useShallow(state => Selectors.selectWeeklyBriefing(state)));

  const overlayExtras = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  const renderIcon = (type: string, color: string) => {
     if (type === 'measurement_received') return <Activity size={16} color={color} />;
     if (type === 'sync_success') return <Calendar size={16} color={color} />;
     if (type === 'context_updated') return <Share2 size={16} color={color} />;
     if (type === 'invite_sent' || type === 'invite_accepted') return <Users size={16} color={color} />;
     if (type === 'permission_changed') return <ShieldAlert size={16} color={color} />;
     return <Activity size={16} color={color} />;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={[styles.overlay, overlayExtras]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        <View style={[styles.card, { width: cardW }]}>
          <View style={styles.header}>
            <View>
              <Typography style={styles.headerTitle}>FEED CRONOLÓGICO</Typography>
              <Typography style={styles.headerSub}>Visão integrada de atividade do membro</Typography>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {weeklyBriefing && weeklyBriefing.status !== 'empty' && (
               <View style={{ padding: 16 }}>
                  <WeeklyBriefingCard 
                     briefing={weeklyBriefing} 
                     onAction={(intent) => {
                        onGlobalAction?.(intent);
                        onClose();
                     }} 
                  />
               </View>
            )}

            <View style={{ paddingVertical: 8 }}>
              {timeline.length > 0 ? (
                timeline.map((event, idx) => {
                  const isAnalysis = event.type === 'sync_success' && event.id.startsWith('ana_');
                  const actualAnalysisId = isAnalysis ? event.id.replace('ana_', '') : null;
                  const isSelected = activeAnalysisId === actualAnalysisId;
                  
                  const dateObj = new Date(event.timestamp);
                  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                  const displayDate = `${dateObj.getDate().toString().padStart(2, '0')} ${months[dateObj.getMonth()]} às ${dateObj.getHours().toString().padStart(2,'0')}:${dateObj.getMinutes().toString().padStart(2,'0')}`;

                  return (
                    <TouchableOpacity
                      key={event.id}
                      disabled={!isAnalysis}
                      onPress={() => isAnalysis && actualAnalysisId && onSelectAnalysis?.(actualAnalysisId)}
                      style={[
                        styles.dateRow,
                        isSelected && { borderColor: '#00F2FF', backgroundColor: 'rgba(0, 242, 255, 0.05)' },
                        !isAnalysis && { backgroundColor: 'transparent', borderWidth: 0, borderBottomWidth: 1, paddingVertical: 12, borderRadius: 0, paddingHorizontal: 0 }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${event.color || '#ccc'}15`, justifyContent: 'center', alignItems: 'center' }}>
                           {renderIcon(event.type, event.color || '#ccc')}
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                             <Typography style={{ color: event.color || '#fff', fontSize: 13, fontWeight: '700' }}>
                               {event.label}
                             </Typography>
                             <Typography style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                               {displayDate}
                             </Typography>
                          </View>
                          <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 }}>
                             {event.payload}
                          </Typography>
                          {isSelected && (
                            <View style={styles.latestBadge}>
                              <Typography style={styles.latestText}>ANÁLISE EM VISTA</Typography>
                            </View>
                          )}
                        </View>
                      </View>
                      {isAnalysis && (
                         <ChevronRight size={18} color={isSelected ? '#00F2FF' : 'rgba(255,255,255,0.2)'} style={{ marginLeft: 16, alignSelf: 'center' }} />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <StateSurface 
                   type="no_data" 
                   title="SEM EVENTOS REGISTADOS"
                   description="O feed cronológico é alimentado de forma autónoma através de capturas biográficas e contexto partilhado."
                   style={{ paddingVertical: 40 }}
                />
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
