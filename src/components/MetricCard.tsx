import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Typography, BlurView } from './Base';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react-native';
import { MetricDefinition, MetricObservation } from '../data/metrics-catalog';

export interface MetricCardProps {
  definition: MetricDefinition;
  observation: MetricObservation;
  onExploreSemantics?: () => void;
  testID?: string;
}

/**
 * Helpper mínimo para formatar o valor dependendo do seu tipo,
 * evitando falsos outputs em waveforms ou booleanos literais caso não traga displayValue.
 */
function formatValue(value: any, valueType: string, displayValue?: string): string {
  if (displayValue !== undefined && displayValue !== null) {
    return displayValue;
  }
  
  if (value === undefined || value === null) {
    return '—';
  }

  switch (valueType) {
    case 'binary':
      return value ? 'Positivo' : 'Negativo'; // fallback simplório
    case 'waveform':
      return 'Sinal registado'; // Evitar imprimir [object Object]
    default:
      return String(value);
  }
}

export const MetricCard: React.FC<MetricCardProps> = ({ definition, observation, onExploreSemantics, testID }) => {
  const [showDetail, setShowDetail] = useState(false);
  const { status } = observation;

  // Estados que não apresentam um valor numérico formatado
  const isNoValueState = ['empty', 'processing', 'not_measured', 'unsupported', 'error'].includes(status);

  // Resolver qual o texto de Valor Principal
  const displayValue = isNoValueState 
    ? '—' 
    : formatValue(observation.value, definition.valueType, observation.displayValue);

  // Resolver qual a mensagem de estado para apresentar abaixo (stateText)
  let stateText = '';
  switch (status) {
    case 'demo_value':
      stateText = 'Valor demonstrativo';
      break;
    case 'empty':
      stateText = 'Sem leitura disponível';
      break;
    case 'processing':
      stateText = 'A processar';
      break;
    case 'not_measured':
      stateText = 'Não analisado nesta sessão';
      break;
    case 'unsupported':
      stateText = 'Indisponível nesta configuração';
      break;
    case 'error':
      stateText = 'Erro de leitura';
      break;
    case 'available':
    default:
      // Pode não haver mensagem de erro/estado para disponíveis, fica limpo
      stateText = '';
      break;
  }

  // Regras de unidade: mostrar sempre se aplicável, mesmo sem valor preenchido 
  // (conforme especificação, para manter alinhamento estático) no unsupported só se fizer sentido
  // No unsupported a unidade muitas vezes esconde-se, mas para coerência base podemos sempre exibir se existir.
  const showUnit = !!definition.unit && (status !== 'unsupported'); 

  const formattedDate = observation.measuredAt 
    ? new Date(observation.measuredAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
    : 'Sessão corrente';

  return (
    <>
    <TouchableOpacity 
      activeOpacity={isNoValueState ? 1 : 0.7}
      disabled={isNoValueState}
      onPress={() => setShowDetail(true)}
      style={styles.card} 
      testID={testID}
    >
      <View style={styles.topRow}>
        {/* 1. Label */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <Typography style={[styles.label, { marginRight: 4, flex: 0 }]} numberOfLines={1}>
            {definition.label}
          </Typography>
          {observation.trend?.priority === 'critical' && <Activity size={12} color="#FF3366" />}
          {observation.trend?.priority === 'relevant' && <Activity size={12} color="#FFA500" />}
        </View>

        {/* 2. Valor Principal e Unidade */}
        <View style={styles.valueRow}>
          <Typography 
            style={[styles.value, isNoValueState && styles.valueMuted]}
            numberOfLines={1}
          >
            {displayValue}
          </Typography>

          {showUnit && (
            <Typography style={styles.unit}>
              {definition.unit}
            </Typography>
          )}
        </View>
      </View>

      {/* 3. Estado Textual e Demo Indication */}
      {!!stateText && (
        <Typography 
          style={[
            styles.stateText, 
            status === 'demo_value' && styles.demoText,
            status === 'error' && styles.errorText
          ]}
        >
          {stateText}
        </Typography>
      )}
    </TouchableOpacity>

    {/* DRILL-DOWN MODAL */}
    <Modal visible={showDetail} transparent animationType="fade">
      <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowDetail(false)} activeOpacity={1}/>
        <View style={styles.modalCentered}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={{ color: '#00F2FF', marginBottom: 20 }}>{definition.label}</Typography>
            
            <View style={{ marginBottom: 16 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>VALOR REGISTADO</Typography>
               <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Typography style={{ color: '#ffffff', fontSize: 24, fontWeight: '800' }}>{displayValue}</Typography>
                  {showUnit && <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginLeft: 6 }}>{definition.unit}</Typography>}
               </View>
            </View>

            <View style={{ marginBottom: 16 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>TENDÊNCIA TEMPORAL</Typography>
               {observation.trend ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {observation.trend.direction === 'up' ? <TrendingUp size={16} color="#00F2FF" style={{ marginRight: 6 }} /> : 
                     observation.trend.direction === 'down' ? <TrendingDown size={16} color="#00F2FF" style={{ marginRight: 6 }} /> :
                     <Minus size={16} color="#00F2FF" style={{ marginRight: 6 }} />}
                    <Typography style={{ 
                       color: observation.trend.priority === 'critical' ? '#FF3366' : observation.trend.priority === 'relevant' ? '#FFA500' : '#00F2FF', 
                       fontSize: 14, 
                       fontWeight: observation.trend.priority === 'critical' || observation.trend.priority === 'relevant' ? '800' : '600' 
                    }}>
                       {observation.trend.priority === 'critical' || observation.trend.priority === 'relevant' ? 'Mudança Principal: ' : ''}
                       {observation.trend.diffLabel}
                    </Typography>
                  </View>
               ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Activity size={14} color="rgba(255,255,255,0.3)" style={{ marginRight: 6 }} />
                    <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic' }}>Sem base temporal prévia para comparar estabilidade.</Typography>
                  </View>
               )}
            </View>

            <View style={{ marginBottom: 16 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>CONTEXTO TEMPORAL</Typography>
               <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{formattedDate}</Typography>
            </View>

            <View style={{ marginBottom: 24 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>ORIGEM DO DADO</Typography>
               <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, textTransform: 'capitalize' }}>
                 {observation.mode === 'demo' ? 'Demonstração (Simulada)' : (observation.source === 'manual' ? 'Inserção Manual' : (observation.source === 'derived' ? 'Processado / Derivado' : 'Captura Sensorial'))}
               </Typography>
            </View>

            {onExploreSemantics && (
               <View style={{ marginBottom: 12 }}>
                 <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 1 }}>TRADUÇÃO BIOLÓGICA</Typography>
                 <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
                   O peso exato desta métrica no contexto de bem-estar pode ser consultado na camada de análise base.
                 </Typography>
                 <TouchableOpacity 
                   style={[styles.closeBtn, { backgroundColor: 'rgba(0, 242, 255, 0.1)', borderColor: 'rgba(0, 242, 255, 0.3)' }]} 
                   onPress={() => {
                     setShowDetail(false);
                     onExploreSemantics();
                   }}
                 >
                   <Typography style={[styles.closeBtnText, { color: '#00F2FF' }]}>CONSULTAR LEITURA AI</Typography>
                 </TouchableOpacity>
               </View>
            )}

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setShowDetail(false)}
            >
              <Typography style={styles.closeBtnText}>FECHAR METADADOS</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexShrink: 0,
  },
  value: {
    fontSize: 18, // Ligeiramente reduzido para duas linhas compactas
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  valueMuted: {
    color: 'rgba(255,255,255,0.3)',
  },
  unit: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  stateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
  },
  demoText: {
    color: '#F59E0B', // Laranja-amber de advertência soft
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444', // Vermelho standard para erro
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCentered: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(10, 15, 25, 0.95)',
  },
  closeBtn: {
    marginTop: 8,
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#00F2FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  }
});
