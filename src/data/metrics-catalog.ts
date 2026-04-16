/**
 * CORE METRICS CATALOG
 * Base canónica para definição estática e observação da sessão de métricas.
 * Mantém modo real e demo explicitamente separados.
 */

// 1. Categorias e Tipos
export type MetricCategory = 'urine' | 'vitals' | 'signals' | 'fecal';

export type MetricValueType = 'number' | 'binary' | 'scale' | 'text' | 'waveform';

export type MetricObservationStatus = 
  | 'available'
  | 'empty'
  | 'processing'
  | 'not_measured'
  | 'unsupported'
  | 'error'
  | 'demo_value';

// 2. Definição Estática (Imutável, catálogo de capacidades)
export interface MetricDefinition {
  key: string;
  label: string;
  category: MetricCategory;
  unit: string;
  valueType: MetricValueType;
  supportedModes: ('demo' | 'real')[];
  visibleByDefault: boolean;
  visualOrder: number;
  sourceType?: string;
  referenceRange?: {
    min?: number;
    max?: number;
    exactMatch?: string | number;
  };
}

// 3. Observação Dinâmica (Estado computado da sessão)
export interface MetricObservation {
  metricKey: string;
  status: MetricObservationStatus;
  value: any;
  displayValue?: string;
  measuredAt?: number;
  source?: string;
  mode: 'demo' | 'real';
  isSimulated?: boolean;
}

// 4. Catálogo Canónico Inicial
export const METRICS_CATALOG: Record<string, MetricDefinition> = {
  // --- URINE & BIOMARKERS ---
  'nt_probnp': {
    key: 'nt_probnp', label: 'NT-proBNP', category: 'urine', unit: 'pg/mL', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 10
  },
  'f2_isoprostanes': {
    key: 'f2_isoprostanes', label: 'F2-isoprostanos', category: 'urine', unit: 'ng/mg creatinina', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 20
  },
  'sodium': {
    key: 'sodium', label: 'Sódio', category: 'urine', unit: 'mmol/L', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 30
  },
  'potassium': {
    key: 'potassium', label: 'Potássio', category: 'urine', unit: 'mmol/L', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 40
  },
  'na_k_ratio': {
    key: 'na_k_ratio', label: 'Rácio Na/K', category: 'urine', unit: '', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 50
  },
  'creatinine': {
    key: 'creatinine', label: 'Creatinina', category: 'urine', unit: 'mg/dL', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 60
  },
  'albumin': {
    key: 'albumin', label: 'Albumina', category: 'urine', unit: 'mg/g creatinina', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 70
  },
  'ngal': {
    key: 'ngal', label: 'NGAL', category: 'urine', unit: 'ng/mL', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: false, visualOrder: 80
  },
  'kim1': {
    key: 'kim1', label: 'KIM-1', category: 'urine', unit: 'ng/mL', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: false, visualOrder: 90
  },
  'cystatin_c': {
    key: 'cystatin_c', label: 'Cistatina C', category: 'urine', unit: 'mg/L', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 100
  },
  'glucose': {
    key: 'glucose', label: 'Glicose', category: 'urine', unit: 'mg/dL', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 110
  },
  'ph': {
    key: 'ph', label: 'pH urinário', category: 'urine', unit: 'pH', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 120
  },
  'nitrites': {
    key: 'nitrites', label: 'Nitritos', category: 'urine', unit: '', valueType: 'binary',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 130
  },

  // --- VITALS ---
  'weight': {
    key: 'weight', label: 'Peso', category: 'vitals', unit: 'kg', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 200
  },
  'temp': {
    key: 'temp', label: 'Temperatura', category: 'vitals', unit: '°C', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 210
  },
  'heart_rate': {
    key: 'heart_rate', label: 'Frequência cardíaca', category: 'vitals', unit: 'bpm', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 220
  },
  'spo2': {
    key: 'spo2', label: 'SpO2', category: 'vitals', unit: '%', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 230
  },

  // --- SIGNALS ---
  'hrv': {
    key: 'hrv', label: 'HRV', category: 'signals', unit: 'ms', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 300
  },
  'ecg': {
    key: 'ecg', label: 'ECG', category: 'signals', unit: '', valueType: 'waveform',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 310
  },
  'ppg': {
    key: 'ppg', label: 'PPG', category: 'signals', unit: '', valueType: 'waveform',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 320
  },
  'impedance': {
    key: 'impedance', label: 'Impedância', category: 'signals', unit: 'Ω', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: false, visualOrder: 330
  },
  'bioimpedance': {
    key: 'bioimpedance', label: 'Bioimpedância', category: 'signals', unit: 'Ω', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 340
  },

  // --- FECAL ---
  'bristol': {
    key: 'bristol', label: 'Bristol', category: 'fecal', unit: '', valueType: 'scale',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 400
  },
  'fecal_freq': {
    key: 'fecal_freq', label: 'Frequência fecal', category: 'fecal', unit: 'n/semana', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 410
  },
  'fecal_area': {
    key: 'fecal_area', label: 'Área fecal', category: 'fecal', unit: 'cm²', valueType: 'number',
    supportedModes: ['demo', 'real'], visibleByDefault: false, visualOrder: 420
  },
  'bowel_regularity': {
    key: 'bowel_regularity', label: 'Regularidade intestinal', category: 'fecal', unit: '', valueType: 'text',
    supportedModes: ['demo', 'real'], visibleByDefault: true, visualOrder: 430
  }
};

// 5. Helpers Essenciais
export function getMetricDefinition(key: string): MetricDefinition | undefined {
  return METRICS_CATALOG[key];
}

export function getAllMetricsDefinitions(): MetricDefinition[] {
  return Object.values(METRICS_CATALOG).sort((a, b) => a.visualOrder - b.visualOrder);
}
