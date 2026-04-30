import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Typography, BlurView } from './Base';
import { TrendingUp, TrendingDown, Minus, Activity, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react-native';
import { MetricDefinition, MetricObservation } from '../data/metrics-catalog';
import { BIOMARKER_INFO } from '../data/biomarker-info';

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
  const [ecgZoom, setEcgZoom] = useState(1);
  const { status } = observation;

  const isEcg = definition.label === 'ECG' || definition.label === 'Eletrocardiograma (ECG)';

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

  // Get biomarker metadata if available
  const meta = BIOMARKER_INFO[definition.label] || null;

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
            style={[styles.value, isNoValueState ? styles.valueMuted : {}]}
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
            status === 'demo_value' ? styles.demoText : {},
            status === 'error' ? styles.errorText : {}
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
            <Typography variant="h3" style={{ color: '#00F2FF', marginBottom: 20 }}>{meta?.label || definition.label}</Typography>
            
            <View style={{ marginBottom: 16 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>{isEcg ? 'REGISTO VISUAL' : 'VALOR REGISTADO'}</Typography>
               <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Typography style={{ color: '#ffffff', fontSize: 24, fontWeight: '800' }}>{displayValue}</Typography>
                  {showUnit && <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginLeft: 6 }}>{definition.unit}</Typography>}
                  {observation.mode === 'demo' && (
                    <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                      <Typography style={{ color: '#F59E0B', fontSize: 10, fontWeight: 'bold' }}>SIMULAÇÃO</Typography>
                    </View>
                  )}
               </View>
            </View>

            {isEcg && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ height: 120, backgroundColor: 'rgba(0, 242, 255, 0.05)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.1)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ transform: [{ scale: ecgZoom }], flexDirection: 'row', width: '200%', justifyContent: 'space-around', opacity: 0.8 }}>
                    <Activity size={80} color="#00F2FF" strokeWidth={1} />
                    <Activity size={80} color="#00F2FF" strokeWidth={1} />
                    <Activity size={80} color="#00F2FF" strokeWidth={1} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                  <TouchableOpacity onPress={() => setEcgZoom(Math.max(1, ecgZoom - 0.5))} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
                    <ZoomOut size={18} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEcgZoom(1)} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
                    <RotateCcw size={18} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEcgZoom(Math.min(3, ecgZoom + 0.5))} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
                    <ZoomIn size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!isEcg && (
            <>
            <View style={{ marginBottom: 16 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>HISTÓRICO RECENTE</Typography>
               {observation.trend ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {observation.trend.direction === 'up' ? <TrendingUp size={16} color="#00F2FF" style={{ marginRight: 6 }} /> : 
                     observation.trend.direction === 'down' ? <TrendingDown size={16} color="#00F2FF" style={{ marginRight: 6 }} /> :
                     <Minus size={16} color="#00F2FF" style={{ marginRight: 6 }} />}
                    <Typography style={{ color: '#ffffff', fontSize: 14 }}>
                       {observation.trend.direction === 'up' ? 'Subiu' : observation.trend.direction === 'down' ? 'Desceu' : 'Semelhante'} em relação à última medição.
                    </Typography>
                  </View>
               ) : (
                  <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic' }}>Ainda não há histórico suficiente para comparar este parâmetro.</Typography>
               )}
            </View>

            <View style={{ marginBottom: 16 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>BASELINE PESSOAL</Typography>
               <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                 {observation.mode === 'demo' ? 'Baseline indisponível (Simulação)' : 'Baseline pessoal ainda não disponível.'}
               </Typography>
            </View>
            </>
            )}

            <View style={{ marginBottom: 16 }}>
               <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4, letterSpacing: 1 }}>REFERÊNCIA GERAL</Typography>
               <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                 {meta?.generalReferenceLabel || 'Referência geral não definida nesta versão.'}
               </Typography>
            </View>

            {meta && (
              <View style={{ marginBottom: 16, backgroundColor: 'rgba(0, 242, 255, 0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 242, 255, 0.1)' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                   <Info size={14} color="#00F2FF" style={{ marginRight: 6 }} />
                   <Typography variant="caption" style={{ color: '#00F2FF', letterSpacing: 1 }}>O QUE ESTE PARÂMETRO COSTUMA INDICAR</Typography>
                 </View>
                 <Typography style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }}>
                   {meta.educationalMeaning}
                 </Typography>
                 {meta.isExperimental && (
                   <Typography style={{ color: '#F59E0B', fontSize: 12, marginTop: 8, fontWeight: '500' }}>
                     Nota: Em contexto de investigação/monitorização. Não deve ser lido isoladamente.
                   </Typography>
                 )}
              </View>
            )}

            <View style={{ marginBottom: 24 }}>
               <Typography style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 16, textAlign: 'center', fontStyle: 'italic' }}>
                 {meta?.limitation || 'Esta informação é educativa e deve ser lida em conjunto com o contexto, histórico e avaliação profissional quando aplicável. Não constitui diagnóstico.'}
               </Typography>
            </View>

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
