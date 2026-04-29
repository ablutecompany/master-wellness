import { Analysis, AnalysisMeasurement, AnalysisEvent } from '../store/types';

export interface DemoPersona {
  id: string;
  label: string;
  shortDescription: string;
  aiMeanScore: number;
  glowBand: string;
  daysSinceLastExamDefault?: number;
  biomarkers: Record<string, { value: number | string; unit: string; name: string }>;
  contextual: Record<string, { value: number | string; unit: string; name: string }>;
  fecal: Record<string, { value: number | string; unit: string; name: string }>;
  physiological: Record<string, { value: number | string; unit: string; name: string }>;
  notesForAI?: string;
}

export const DEMO_BIOMARKER_PERSONAS: DemoPersona[] = [
  {
    id: 'balanced_recovered',
    label: "Equilíbrio geral",
    shortDescription: "Simulação de estado geral estável, boa recuperação e sinais urinários sem alerta forte.",
    aiMeanScore: 86,
    glowBand: 'excellent',
    biomarkers: {
      pH_urinario: { value: 6.4, unit: 'pH', name: 'pH Urinário' },
      nitritos: { value: "Negativo", unit: '', name: 'Nitritos' },
      glicose: { value: "Negativo", unit: '', name: 'Glicose' },
      albumina_uacr: { value: 8, unit: 'mg/g', name: 'Albumina / uACR' },
      creatinina_urinaria: { value: 120, unit: 'mg/dL', name: 'Creatinina Urinária' },
      sodio_urinario: { value: 85, unit: 'mmol/L', name: 'Sódio Urinário' },
      potassio_urinario: { value: 48, unit: 'mmol/L', name: 'Potássio Urinário' },
      ratio_na_k: { value: 1.8, unit: '', name: 'Rácio Na/K' },
      densidade_urinaria: { value: 1.018, unit: 'SG', name: 'Densidade Urinária' },
      ngal: { value: 14, unit: 'ng/mL', name: 'NGAL' },
      kim1: { value: 0.7, unit: 'ng/mL', name: 'KIM-1' },
      cistatina_c_urinaria: { value: 0.07, unit: 'mg/L', name: 'Cistatina C Urinária' },
      f2_isoprostanos: { value: 1.1, unit: 'ng/mg Cr', name: 'F2-isoprostanos' },
      ntprobnp_urinario: { value: 22, unit: 'pg/mL', name: 'NT-proBNP Urinário' }
    },
    contextual: {
      sono: { value: '7h30', unit: '', name: 'Sono' },
      passos: { value: 8200, unit: 'passos', name: 'Passos' },
      hidratacao: { value: 'regular', unit: '', name: 'Hidratação' },
      stress: { value: 'baixo', unit: '', name: 'Stress' },
      recuperacao: { value: 86, unit: '%', name: 'Recuperação' }
    },
    fecal: {
      bristol: { value: 4, unit: 'tipo', name: 'Bristol' },
      regularidade: { value: 'elevada', unit: '', name: 'Regularidade' },
      consistencia: { value: 'formada', unit: '', name: 'Consistência' }
    },
    physiological: {
      hr: { value: 62, unit: 'bpm', name: 'HR' },
      spo2: { value: 98, unit: '%', name: 'SpO2' },
      temperatura: { value: 36.6, unit: 'ºC', name: 'Temperatura' },
      peso: { value: 74, unit: 'kg', name: 'Peso' },
      impedancia: { value: 'normal_simulada', unit: '', name: 'Impedância' }
    }
  },
  {
    id: 'concentrated_dehydration',
    label: "Urina concentrada",
    shortDescription: "Simulação de hidratação irregular, com urina mais concentrada e necessidade de acompanhar contexto.",
    aiMeanScore: 64,
    glowBand: 'caution_light',
    biomarkers: {
      pH_urinario: { value: 5.6, unit: 'pH', name: 'pH Urinário' },
      nitritos: { value: "Negativo", unit: '', name: 'Nitritos' },
      glicose: { value: "Negativo", unit: '', name: 'Glicose' },
      albumina_uacr: { value: 18, unit: 'mg/g', name: 'Albumina / uACR' },
      creatinina_urinaria: { value: 210, unit: 'mg/dL', name: 'Creatinina Urinária' },
      sodio_urinario: { value: 135, unit: 'mmol/L', name: 'Sódio Urinário' },
      potassio_urinario: { value: 72, unit: 'mmol/L', name: 'Potássio Urinário' },
      ratio_na_k: { value: 1.9, unit: '', name: 'Rácio Na/K' },
      densidade_urinaria: { value: 1.030, unit: 'SG', name: 'Densidade Urinária' },
      ngal: { value: 24, unit: 'ng/mL', name: 'NGAL' },
      kim1: { value: 0.9, unit: 'ng/mL', name: 'KIM-1' },
      cistatina_c_urinaria: { value: 0.09, unit: 'mg/L', name: 'Cistatina C Urinária' },
      f2_isoprostanos: { value: 1.6, unit: 'ng/mg Cr', name: 'F2-isoprostanos' },
      ntprobnp_urinario: { value: 28, unit: 'pg/mL', name: 'NT-proBNP Urinário' }
    },
    contextual: {
      sono: { value: '6h20', unit: '', name: 'Sono' },
      passos: { value: 11800, unit: 'passos', name: 'Passos' },
      hidratacao: { value: 'irregular', unit: '', name: 'Hidratação' },
      stress: { value: 'médio', unit: '', name: 'Stress' },
      recuperacao: { value: 68, unit: '%', name: 'Recuperação' }
    },
    fecal: {
      bristol: { value: 3, unit: 'tipo', name: 'Bristol' },
      regularidade: { value: 'média', unit: '', name: 'Regularidade' },
      consistencia: { value: 'ligeiramente seca', unit: '', name: 'Consistência' }
    },
    physiological: {
      hr: { value: 72, unit: 'bpm', name: 'HR' },
      spo2: { value: 98, unit: '%', name: 'SpO2' },
      temperatura: { value: 36.7, unit: 'ºC', name: 'Temperatura' },
      peso: { value: 74.5, unit: 'kg', name: 'Peso' },
      impedancia: { value: 'compatível_com_menor_hidratação_simulada', unit: '', name: 'Impedância' }
    }
  },
  {
    id: 'urinary_attention',
    label: "Atenção urinária",
    shortDescription: "Simulação com nitritos positivos e pH mais alcalino, sem gerar diagnóstico.",
    aiMeanScore: 48,
    glowBand: 'caution',
    biomarkers: {
      pH_urinario: { value: 7.6, unit: 'pH', name: 'pH Urinário' },
      nitritos: { value: "Positivo", unit: '', name: 'Nitritos' },
      glicose: { value: "Negativo", unit: '', name: 'Glicose' },
      albumina_uacr: { value: 34, unit: 'mg/g', name: 'Albumina / uACR' },
      creatinina_urinaria: { value: 105, unit: 'mg/dL', name: 'Creatinina Urinária' },
      sodio_urinario: { value: 78, unit: 'mmol/L', name: 'Sódio Urinário' },
      potassio_urinario: { value: 42, unit: 'mmol/L', name: 'Potássio Urinário' },
      ratio_na_k: { value: 1.9, unit: '', name: 'Rácio Na/K' },
      densidade_urinaria: { value: 1.021, unit: 'SG', name: 'Densidade Urinária' },
      ngal: { value: 45, unit: 'ng/mL', name: 'NGAL' },
      kim1: { value: 1.2, unit: 'ng/mL', name: 'KIM-1' },
      cistatina_c_urinaria: { value: 0.12, unit: 'mg/L', name: 'Cistatina C Urinária' },
      f2_isoprostanos: { value: 1.8, unit: 'ng/mg Cr', name: 'F2-isoprostanos' },
      ntprobnp_urinario: { value: 35, unit: 'pg/mL', name: 'NT-proBNP Urinário' }
    },
    contextual: {
      sono: { value: '6h50', unit: '', name: 'Sono' },
      passos: { value: 6500, unit: 'passos', name: 'Passos' },
      hidratacao: { value: 'média', unit: '', name: 'Hidratação' },
      stress: { value: 'médio', unit: '', name: 'Stress' },
      recuperacao: { value: 61, unit: '%', name: 'Recuperação' }
    },
    fecal: {
      bristol: { value: 4, unit: 'tipo', name: 'Bristol' },
      regularidade: { value: 'média', unit: '', name: 'Regularidade' },
      consistencia: { value: 'formada', unit: '', name: 'Consistência' }
    },
    physiological: {
      hr: { value: 76, unit: 'bpm', name: 'HR' },
      spo2: { value: 97, unit: '%', name: 'SpO2' },
      temperatura: { value: 37.0, unit: 'ºC', name: 'Temperatura' },
      peso: { value: 74.2, unit: 'kg', name: 'Peso' },
      impedancia: { value: 'normal_simulada', unit: '', name: 'Impedância' }
    }
  },
  {
    id: 'glycaemic_attention',
    label: "Atenção glicose",
    shortDescription: "Simulação com glicose em traços e sinais de carga recente, sem diagnóstico metabólico.",
    aiMeanScore: 52,
    glowBand: 'caution',
    biomarkers: {
      pH_urinario: { value: 5.8, unit: 'pH', name: 'pH Urinário' },
      nitritos: { value: "Negativo", unit: '', name: 'Nitritos' },
      glicose: { value: "Traços", unit: '', name: 'Glicose' },
      albumina_uacr: { value: 24, unit: 'mg/g', name: 'Albumina / uACR' },
      creatinina_urinaria: { value: 150, unit: 'mg/dL', name: 'Creatinina Urinária' },
      sodio_urinario: { value: 126, unit: 'mmol/L', name: 'Sódio Urinário' },
      potassio_urinario: { value: 44, unit: 'mmol/L', name: 'Potássio Urinário' },
      ratio_na_k: { value: 2.9, unit: '', name: 'Rácio Na/K' },
      densidade_urinaria: { value: 1.024, unit: 'SG', name: 'Densidade Urinária' },
      ngal: { value: 22, unit: 'ng/mL', name: 'NGAL' },
      kim1: { value: 0.8, unit: 'ng/mL', name: 'KIM-1' },
      cistatina_c_urinaria: { value: 0.08, unit: 'mg/L', name: 'Cistatina C Urinária' },
      f2_isoprostanos: { value: 2.2, unit: 'ng/mg Cr', name: 'F2-isoprostanos' },
      ntprobnp_urinario: { value: 26, unit: 'pg/mL', name: 'NT-proBNP Urinário' }
    },
    contextual: {
      sono: { value: '6h10', unit: '', name: 'Sono' },
      passos: { value: 7200, unit: 'passos', name: 'Passos' },
      hidratacao: { value: 'média', unit: '', name: 'Hidratação' },
      stress: { value: 'médio', unit: '', name: 'Stress' },
      recuperacao: { value: 58, unit: '%', name: 'Recuperação' },
      contexto_alimentar: { value: 'refeição rica em hidratos nas últimas horas', unit: '', name: 'Contexto alimentar' }
    },
    fecal: {
      bristol: { value: 4, unit: 'tipo', name: 'Bristol' },
      regularidade: { value: 'média', unit: '', name: 'Regularidade' },
      consistencia: { value: 'formada', unit: '', name: 'Consistência' }
    },
    physiological: {
      hr: { value: 74, unit: 'bpm', name: 'HR' },
      spo2: { value: 98, unit: '%', name: 'SpO2' },
      temperatura: { value: 36.8, unit: 'ºC', name: 'Temperatura' },
      peso: { value: 75, unit: 'kg', name: 'Peso' },
      impedancia: { value: 'normal_simulada', unit: '', name: 'Impedância' }
    }
  },
  {
    id: 'renal_stress_mild',
    label: "Stress renal ligeiro",
    shortDescription: "Simulação com albumina e biomarcadores renais discretamente elevados, sem diagnóstico.",
    aiMeanScore: 42,
    glowBand: 'attention',
    biomarkers: {
      pH_urinario: { value: 6.1, unit: 'pH', name: 'pH Urinário' },
      nitritos: { value: "Negativo", unit: '', name: 'Nitritos' },
      glicose: { value: "Negativo", unit: '', name: 'Glicose' },
      albumina_uacr: { value: 72, unit: 'mg/g', name: 'Albumina / uACR' },
      creatinina_urinaria: { value: 95, unit: 'mg/dL', name: 'Creatinina Urinária' },
      sodio_urinario: { value: 110, unit: 'mmol/L', name: 'Sódio Urinário' },
      potassio_urinario: { value: 52, unit: 'mmol/L', name: 'Potássio Urinário' },
      ratio_na_k: { value: 2.1, unit: '', name: 'Rácio Na/K' },
      densidade_urinaria: { value: 1.022, unit: 'SG', name: 'Densidade Urinária' },
      ngal: { value: 88, unit: 'ng/mL', name: 'NGAL' },
      kim1: { value: 2.1, unit: 'ng/mL', name: 'KIM-1' },
      cistatina_c_urinaria: { value: 0.24, unit: 'mg/L', name: 'Cistatina C Urinária' },
      f2_isoprostanos: { value: 2.6, unit: 'ng/mg Cr', name: 'F2-isoprostanos' },
      ntprobnp_urinario: { value: 42, unit: 'pg/mL', name: 'NT-proBNP Urinário' }
    },
    contextual: {
      sono: { value: '5h50', unit: '', name: 'Sono' },
      passos: { value: 9400, unit: 'passos', name: 'Passos' },
      hidratacao: { value: 'irregular', unit: '', name: 'Hidratação' },
      stress: { value: 'elevado', unit: '', name: 'Stress' },
      recuperacao: { value: 49, unit: '%', name: 'Recuperação' }
    },
    fecal: {
      bristol: { value: 3, unit: 'tipo', name: 'Bristol' },
      regularidade: { value: 'média', unit: '', name: 'Regularidade' },
      consistencia: { value: 'mais seca', unit: '', name: 'Consistência' }
    },
    physiological: {
      hr: { value: 78, unit: 'bpm', name: 'HR' },
      spo2: { value: 97, unit: '%', name: 'SpO2' },
      temperatura: { value: 36.9, unit: 'ºC', name: 'Temperatura' },
      peso: { value: 75.4, unit: 'kg', name: 'Peso' },
      impedancia: { value: 'ligeira_variação_simulada', unit: '', name: 'Impedância' }
    }
  },
  {
    id: 'recovery_low_stress_high',
    label: "Recuperação baixa",
    shortDescription: "Simulação com stress contextual elevado, menor recuperação e sinais fisiológicos menos favoráveis.",
    aiMeanScore: 38,
    glowBand: 'poor',
    biomarkers: {
      pH_urinario: { value: 5.5, unit: 'pH', name: 'pH Urinário' },
      nitritos: { value: "Negativo", unit: '', name: 'Nitritos' },
      glicose: { value: "Negativo", unit: '', name: 'Glicose' },
      albumina_uacr: { value: 28, unit: 'mg/g', name: 'Albumina / uACR' },
      creatinina_urinaria: { value: 180, unit: 'mg/dL', name: 'Creatinina Urinária' },
      sodio_urinario: { value: 145, unit: 'mmol/L', name: 'Sódio Urinário' },
      potassio_urinario: { value: 46, unit: 'mmol/L', name: 'Potássio Urinário' },
      ratio_na_k: { value: 3.2, unit: '', name: 'Rácio Na/K' },
      densidade_urinaria: { value: 1.028, unit: 'SG', name: 'Densidade Urinária' },
      ngal: { value: 36, unit: 'ng/mL', name: 'NGAL' },
      kim1: { value: 1.1, unit: 'ng/mL', name: 'KIM-1' },
      cistatina_c_urinaria: { value: 0.11, unit: 'mg/L', name: 'Cistatina C Urinária' },
      f2_isoprostanos: { value: 2.9, unit: 'ng/mg Cr', name: 'F2-isoprostanos' },
      ntprobnp_urinario: { value: 58, unit: 'pg/mL', name: 'NT-proBNP Urinário' }
    },
    contextual: {
      sono: { value: '4h55', unit: '', name: 'Sono' },
      passos: { value: 13200, unit: 'passos', name: 'Passos' },
      hidratacao: { value: 'irregular', unit: '', name: 'Hidratação' },
      stress: { value: 'elevado', unit: '', name: 'Stress' },
      recuperacao: { value: 37, unit: '%', name: 'Recuperação' }
    },
    fecal: {
      bristol: { value: 2, unit: 'tipo', name: 'Bristol' },
      regularidade: { value: 'baixa', unit: '', name: 'Regularidade' },
      consistencia: { value: 'seca', unit: '', name: 'Consistência' }
    },
    physiological: {
      hr: { value: 84, unit: 'bpm', name: 'HR' },
      spo2: { value: 96, unit: '%', name: 'SpO2' },
      temperatura: { value: 37.1, unit: 'ºC', name: 'Temperatura' },
      peso: { value: 74.8, unit: 'kg', name: 'Peso' },
      impedancia: { value: 'compatível_com_fadiga_hidratação_simulada', unit: '', name: 'Impedância' }
    }
  }
];

export const generateDemoAnalysisFromPersona = (persona: DemoPersona, referenceTimestamp: number = Date.now()): Analysis => {
  const measurements: AnalysisMeasurement[] = [];
  
  // Urina (14 biomarcadores)
  Object.entries(persona.biomarkers).forEach(([key, data]) => {
    measurements.push({
      id: `demo_${key}`,
      type: 'urinalysis',
      marker: data.name,
      value: String(data.value),
      unit: data.unit,
      recordedAt: new Date(referenceTimestamp).toISOString()
    });
  });

  // Fezes
  Object.entries(persona.fecal).forEach(([key, data]) => {
    measurements.push({
      id: `demo_fecal_${key}`,
      type: 'fecal',
      marker: data.name,
      value: String(data.value),
      unit: data.unit,
      recordedAt: new Date(referenceTimestamp).toISOString()
    });
  });

  // Fisiológico
  Object.entries(persona.physiological).forEach(([key, data]) => {
    measurements.push({
      id: `demo_physio_${key}`,
      type: key === 'peso' ? 'weight' : key === 'temperatura' ? 'temp' : key === 'hr' ? 'ecg' : key === 'spo2' ? 'ppg' : 'urinalysis',
      marker: data.name,
      value: String(data.value),
      unit: data.unit,
      recordedAt: new Date(referenceTimestamp).toISOString()
    });
  });

  // Ecosystem (Contextual)
  const ecosystemFacts: any[] = [];
  Object.entries(persona.contextual).forEach(([key, data]) => {
    ecosystemFacts.push({
      id: `demo_ctx_${key}`,
      type: data.name,
      value: String(data.value) + (data.unit ? ` ${data.unit}` : ''),
      sourceAppId: 'demo',
      recordedAt: new Date(referenceTimestamp).toISOString(),
      domain: 'contextual',
      timestamp: referenceTimestamp
    });
  });

  return {
    id: `demo_analysis_${persona.id}`,
    memberId: 'demo-member',
    label: persona.label,
    analysisDate: new Date(referenceTimestamp).toISOString(),
    source: 'demo',
    demoScenarioKey: persona.id,
    measurements,
    ecosystemFacts,
    createdAt: new Date(referenceTimestamp).toISOString()
  };
};
