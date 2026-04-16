import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Base';
import { MetricDefinition, MetricObservation } from '../data/metrics-catalog';

export interface MetricCardProps {
  definition: MetricDefinition;
  observation: MetricObservation;
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

export const MetricCard: React.FC<MetricCardProps> = ({ definition, observation, testID }) => {
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

  return (
    <View style={styles.card} testID={testID}>
      {/* 1. Label */}
      <Typography style={styles.label}>
        {definition.label}
      </Typography>

      <View style={styles.valueRow}>
        {/* 2. Valor Principal */}
        <Typography 
          style={[styles.value, isNoValueState && styles.valueMuted]}
          numberOfLines={1}
        >
          {displayValue}
        </Typography>

        {/* 3. Unidade (sempre da definição estática) */}
        {showUnit && (
          <Typography style={styles.unit}>
            {definition.unit}
          </Typography>
        )}
      </View>

      {/* 4/5. Estado Textual e Demo Indication */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  valueMuted: {
    color: 'rgba(255,255,255,0.3)',
  },
  unit: {
    fontSize: 14,
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
  }
});
