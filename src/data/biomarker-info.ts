export interface BiomarkerMetadata {
  id: string;
  label: string;
  family: 'urine' | 'fecal' | 'physiological' | 'contextual';
  unit: string;
  generalReference: string;
  educationalMeaning: string;
  limitation?: string;
  isExperimental?: boolean;
}

export const BIOMARKER_INFO: Record<string, BiomarkerMetadata> = {
  'pH Urinário': {
    id: 'ph_urinario',
    label: 'pH urinário',
    family: 'urine',
    unit: 'pH',
    generalReference: 'Geralmente entre 5.0 e 8.0, consoante o laboratório',
    educationalMeaning: 'Reflete a acidez ou alcalinidade da urina. Pode variar com hidratação, alimentação, horário da recolha e outros fatores. Isoladamente não permite concluir uma condição clínica.'
  },
  'Nitritos': {
    id: 'nitritos',
    label: 'Nitritos',
    family: 'urine',
    unit: '',
    generalReference: 'Negativo',
    educationalMeaning: 'A presença de nitritos é frequentemente usada na literatura como sinal de apoio na avaliação urinária, podendo estar associada à presença de bactérias que convertem nitratos em nitritos. Deve ser interpretada com sintomas, repetição e outros dados.'
  },
  'Glicose': {
    id: 'glicose',
    label: 'Glicose',
    family: 'urine',
    unit: '',
    generalReference: 'Negativo ou ausente na urina',
    educationalMeaning: 'A glicose na urina é habitualmente observada como sinal a contextualizar com alimentação recente, metabolismo e repetição do resultado. Isoladamente não permite concluir uma condição metabólica.'
  },
  'Albumina / uACR': {
    id: 'albumina_uacr',
    label: 'Albumina/uACR',
    family: 'urine',
    unit: 'mg/g',
    generalReference: '< 30 mg/g (idealmente inferior)',
    educationalMeaning: 'A albumina ajustada à creatinina é usada para observar perda urinária de proteína de forma mais comparável. O valor ganha importância sobretudo quando repetido e comparado com histórico.'
  },
  'Creatinina Urinária': {
    id: 'creatinina_urinaria',
    label: 'Creatinina urinária',
    family: 'urine',
    unit: 'mg/dL',
    generalReference: 'Varia largamente com a diluição da urina',
    educationalMeaning: 'A creatinina urinária ajuda a contextualizar a concentração da amostra e a normalizar outros marcadores. Deve ser lida com hidratação, densidade urinária e contexto da recolha.'
  },
  'Sódio Urinário': {
    id: 'sodio_urinario',
    label: 'Sódio urinário',
    family: 'urine',
    unit: 'mmol/L',
    generalReference: 'Variável com a ingestão',
    educationalMeaning: 'O sódio urinário pode refletir ingestão recente, hidratação e equilíbrio eletrolítico. Em amostra isolada, a interpretação deve ser prudente.'
  },
  'Potássio Urinário': {
    id: 'potassio_urinario',
    label: 'Potássio urinário',
    family: 'urine',
    unit: 'mmol/L',
    generalReference: 'Variável com a ingestão alimentar',
    educationalMeaning: 'O potássio urinário pode contribuir para observar equilíbrio eletrolítico e relação com ingestão, hidratação e contexto fisiológico. Deve ser lido com outros sinais.'
  },
  'Rácio Na/K': {
    id: 'ratio_na_k',
    label: 'Rácio Na/K',
    family: 'urine',
    unit: '',
    generalReference: 'A analisar em relação à literatura',
    educationalMeaning: 'O rácio entre sódio e potássio ajuda a observar padrões relativos entre estes eletrólitos. Tem mais valor quando acompanhado ao longo do tempo.'
  },
  'Densidade Urinária': {
    id: 'densidade_urinaria',
    label: 'Densidade urinária / gravidade específica',
    family: 'urine',
    unit: 'SG',
    generalReference: 'Normalmente 1.002 a 1.030',
    educationalMeaning: 'Indica quão concentrada ou diluída está a urina. É útil para contextualizar hidratação e concentração da amostra, mas varia com horário e ingestão de líquidos.'
  },
  'NGAL': {
    id: 'ngal',
    label: 'NGAL',
    family: 'urine',
    unit: 'ng/mL',
    generalReference: 'A definir de forma validada (uso experimental)',
    educationalMeaning: 'NGAL é descrito na literatura como biomarcador associado a stress tubular/renal em contextos específicos. Na app, deve ser tratado como sinal experimental/interpretativo e nunca como diagnóstico isolado.',
    isExperimental: true
  },
  'KIM-1': {
    id: 'kim1',
    label: 'KIM-1',
    family: 'urine',
    unit: 'ng/mL',
    generalReference: 'A definir de forma validada (uso experimental)',
    educationalMeaning: 'KIM-1 é referido na literatura em contextos de observação de stress tubular/renal. Deve ser interpretado com extrema prudência, histórico e outros marcadores.',
    isExperimental: true
  },
  'Cistatina C Urinária': {
    id: 'cistatina_c_urinaria',
    label: 'Cistatina C urinária',
    family: 'urine',
    unit: 'mg/L',
    generalReference: 'A definir de forma validada (uso experimental)',
    educationalMeaning: 'A cistatina C urinária pode ser explorada em contextos de função/filtração e stress renal, dependendo do contexto analítico. Na app, deve ser apenas sinal de acompanhamento.',
    isExperimental: true
  },
  'F2-isoprostanos': {
    id: 'f2_isoprostanos',
    label: 'F2-isoprostanos',
    family: 'urine',
    unit: 'ng/mg Cr',
    generalReference: 'A definir de forma validada (uso experimental)',
    educationalMeaning: 'F2-isoprostanos são frequentemente usados em investigação como marcadores associados a stress oxidativo. O valor deve ser lido como sinal contextual e não como conclusão clínica.',
    isExperimental: true
  },
  'NT-proBNP Urinário': {
    id: 'ntprobnp_urinario',
    label: 'NT-proBNP urinário',
    family: 'urine',
    unit: 'pg/mL',
    generalReference: 'A definir de forma validada (uso experimental)',
    educationalMeaning: 'NT-proBNP urinário é tratado nesta versão como marcador experimental/de investigação. Não deve ser usado para inferência clínica direta no utilizador.',
    isExperimental: true
  }
};
