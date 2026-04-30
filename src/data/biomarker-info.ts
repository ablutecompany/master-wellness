export interface BiomarkerMetadata {
  id: string;
  label: string;
  family: 'urine' | 'fecal' | 'physiological' | 'contextual';
  unit: string;
  referenceStatus?: 'defined' | 'contextual' | 'not_defined';
  generalReferenceLabel?: string;
  educationalMeaning: string;
  utility?: string;
  limitation?: string;
  isExperimental?: boolean;
}

export const BIOMARKER_INFO: Record<string, BiomarkerMetadata> = {
  'pH Urinário': {
    id: 'ph_urinario',
    label: 'pH urinário',
    family: 'urine',
    unit: '',
    referenceStatus: 'defined',
    generalReferenceLabel: '4,6–8,0',
    educationalMeaning: 'Reflete a acidez ou alcalinidade da urina. Pode variar com hidratação, alimentação, horário da recolha e outros fatores.',
    utility: 'Ajuda a contextualizar o ambiente urinário e a evolução ao longo do tempo.',
    limitation: 'Isoladamente não permite concluir uma condição clínica.'
  },
  'Densidade Urinária': {
    id: 'densidade_urinaria',
    label: 'Densidade urinária / gravidade específica',
    family: 'urine',
    unit: 'SG',
    referenceStatus: 'defined',
    generalReferenceLabel: '1,005–1,030 SG',
    educationalMeaning: 'Indica quão concentrada ou diluída está a urina.',
    utility: 'Ajuda a contextualizar hidratação e concentração da amostra.',
    limitation: 'Varia com ingestão de líquidos, hora da recolha e contexto.'
  },
  'Nitritos': {
    id: 'nitritos',
    label: 'Nitritos',
    family: 'urine',
    unit: '',
    referenceStatus: 'defined',
    generalReferenceLabel: 'Negativo',
    educationalMeaning: 'A presença de nitritos é frequentemente usada na literatura como sinal de apoio na avaliação urinária, podendo estar associada à presença de bactérias que convertem nitratos em nitritos.',
    utility: 'Ajuda a sinalizar quando pode fazer sentido repetir ou contextualizar a análise urinária.',
    limitation: 'Não permite concluir infeção isoladamente. Deve ser interpretado com sintomas, repetição e outros dados.'
  },
  'Glicose': {
    id: 'glicose',
    label: 'Glicose',
    family: 'urine',
    unit: '',
    referenceStatus: 'defined',
    generalReferenceLabel: 'Negativo / não detetável',
    educationalMeaning: 'A glicose na urina é habitualmente observada como sinal a contextualizar com alimentação recente, metabolismo e repetição do resultado.',
    utility: 'Ajuda a identificar sinais que merecem observação quando aparecem de forma repetida.',
    limitation: 'Não permite concluir uma condição metabólica isoladamente.'
  },
  'Albumina / uACR': {
    id: 'albumina_uacr',
    label: 'Albumina/uACR',
    family: 'urine',
    unit: 'mg/g creatinina',
    referenceStatus: 'defined',
    generalReferenceLabel: '<30 mg/g; 30–299 mg/g moderadamente aumentado; ≥300 mg/g aumentado',
    educationalMeaning: 'A albumina ajustada à creatinina é usada para observar perda urinária de proteína de forma mais comparável.',
    utility: 'É útil para acompanhar repetição, tendência e comparação com histórico.',
    limitation: 'Um valor isolado deve ser confirmado e interpretado com contexto clínico.'
  },
  'Creatinina Urinária': {
    id: 'creatinina_urinaria',
    label: 'Creatinina urinária',
    family: 'urine',
    unit: 'mg/dL',
    referenceStatus: 'contextual',
    generalReferenceLabel: 'Adultos: 16–326 mg/dL em amostra aleatória',
    educationalMeaning: 'A creatinina urinária ajuda a contextualizar a concentração da amostra e a normalizar outros marcadores.',
    utility: 'Ajuda a perceber se outros valores podem estar influenciados pela concentração da urina.',
    limitation: 'Varia com hidratação, massa muscular, idade, sexo e tipo de amostra.'
  },
  'Sódio Urinário': {
    id: 'sodio_urinario',
    label: 'Sódio urinário',
    family: 'urine',
    unit: 'mmol/L',
    referenceStatus: 'contextual',
    generalReferenceLabel: 'Amostra aleatória: sem referência geral robusta; 24h: 40–220 mmol/24h',
    educationalMeaning: 'O sódio urinário pode refletir ingestão recente, hidratação e equilíbrio eletrolítico.',
    utility: 'Tem mais utilidade quando comparado com histórico, hidratação e potássio.',
    limitation: 'Em amostra isolada, a interpretação deve ser prudente.'
  },
  'Potássio Urinário': {
    id: 'potassio_urinario',
    label: 'Potássio urinário',
    family: 'urine',
    unit: 'mmol/L',
    referenceStatus: 'contextual',
    generalReferenceLabel: 'Amostra aleatória: sem referência geral robusta; 24h: 25–125 mmol/24h',
    educationalMeaning: 'O potássio urinário pode contribuir para observar equilíbrio eletrolítico e relação com ingestão, hidratação e contexto fisiológico.',
    utility: 'É útil em conjunto com sódio, rácio Na/K e histórico pessoal.',
    limitation: 'Em amostra isolada, não deve ser sobre-interpretado.'
  },
  'Rácio Na/K': {
    id: 'ratio_na_k',
    label: 'Rácio Na/K',
    family: 'urine',
    unit: '',
    referenceStatus: 'contextual',
    generalReferenceLabel: 'Sem referência geral universal para amostra aleatória',
    educationalMeaning: 'O rácio entre sódio e potássio ajuda a observar padrões relativos entre estes eletrólitos.',
    utility: 'Tem maior valor quando acompanhado ao longo do tempo no mesmo utilizador.',
    limitation: 'Não deve ser usado isoladamente como conclusão clínica.'
  },
  'NGAL': {
    id: 'ngal',
    label: 'NGAL',
    family: 'urine',
    unit: 'ng/mL',
    referenceStatus: 'not_defined',
    generalReferenceLabel: 'Referência geral não definida nesta versão',
    isExperimental: true,
    educationalMeaning: 'NGAL é descrito na literatura como biomarcador associado a stress tubular/renal em contextos específicos.',
    utility: 'Pode funcionar como sinal de acompanhamento experimental, sobretudo quando comparado com histórico.',
    limitation: 'Não deve ser lido isoladamente nem usado como diagnóstico.'
  },
  'KIM-1': {
    id: 'kim1',
    label: 'KIM-1',
    family: 'urine',
    unit: 'ng/mL',
    referenceStatus: 'not_defined',
    generalReferenceLabel: 'Referência geral não definida nesta versão',
    isExperimental: true,
    educationalMeaning: 'KIM-1 é referido na literatura em contextos de observação de stress tubular/renal.',
    utility: 'Pode ajudar a compor um painel experimental de acompanhamento, quando existe histórico.',
    limitation: 'Deve ser interpretado com extrema prudência, método laboratorial e outros marcadores.'
  },
  'Cistatina C Urinária': {
    id: 'cistatina_c_urinaria',
    label: 'Cistatina C urinária',
    family: 'urine',
    unit: 'mg/L',
    referenceStatus: 'contextual',
    generalReferenceLabel: 'Dependente do método; literatura reporta intervalos como 0,06–0,16 mg/L ou <0,414 mg/L',
    isExperimental: true,
    educationalMeaning: 'A cistatina C urinária pode ser explorada em contextos de função/filtração e stress renal, dependendo do contexto analítico.',
    utility: 'Pode ser útil como sinal de acompanhamento quando medido de forma consistente.',
    limitation: 'Não há referência universal simples nesta versão. Usar baseline pessoal e método laboratorial.'
  },
  'F2-isoprostanos': {
    id: 'f2_isoprostanos',
    label: 'F2-isoprostanos',
    family: 'urine',
    unit: 'ng/mg Cr',
    referenceStatus: 'contextual',
    generalReferenceLabel: '≤1,0 ng/mg creatinina quando o método/unidade coincidem',
    isExperimental: true,
    educationalMeaning: 'F2-isoprostanos são frequentemente usados em investigação como marcadores associados a stress oxidativo.',
    utility: 'Pode ajudar a acompanhar sinais relacionados com stress oxidativo em contexto longitudinal.',
    limitation: 'Valores dependem do método. Não deve ser usado como conclusão clínica isolada.'
  },
  'NT-proBNP Urinário': {
    id: 'ntprobnp_urinario',
    label: 'NT-proBNP urinário',
    family: 'urine',
    unit: 'pg/mL',
    referenceStatus: 'not_defined',
    generalReferenceLabel: 'Experimental; sem referência geral definida nesta versão',
    isExperimental: true,
    educationalMeaning: 'NT-proBNP urinário é tratado nesta versão como marcador experimental/de investigação.',
    utility: 'Pode ser estudado como sinal exploratório em investigação, mas não deve orientar inferências clínicas diretas.',
    limitation: 'Não deve ser usado para inferência clínica direta no utilizador.'
  },
  'Bristol': {
    id: 'bristol',
    label: 'Escala de Bristol',
    family: 'fecal',
    unit: 'escala visual',
    generalReference: 'Tipos 3 e 4 são tipicamente reportados como formados/normais',
    educationalMeaning: 'A escala apresentada traduz a qualificação das fezes quando estas possuem as características descritas na Caracterização Óptica. A Escala de Bristol é uma classificação visual usada para descrever a forma e consistência aparente das fezes. Não constitui diagnóstico e deve ser interpretada com contexto, repetição e outros sinais.',
    limitation: 'Esta leitura é observacional e não substitui avaliação clínica quando existirem sintomas, persistência ou preocupação.'
  },
  'Caracterização Óptica': {
    id: 'caracterizacao_optica',
    label: 'Caracterização Óptica',
    family: 'fecal',
    unit: '',
    generalReference: 'Depende de contexto individual e dieta',
    educationalMeaning: 'Reflete a avaliação visual da consistência e forma. É um complemento observacional que ajuda a traçar o perfil de trânsito e hidratação sem constituir interpretação gastrointestinal clínica.',
    limitation: 'Leitura puramente observacional.'
  },
  'Regularidade': {
    id: 'regularidade',
    label: 'Regularidade',
    family: 'fecal',
    unit: '',
    generalReference: 'Altamente variável consoante o indivíduo e dieta',
    educationalMeaning: 'A frequência e o padrão reportado de dejeções. É útil para contextualizar trânsito, sem configurar diagnóstico de patologia.',
    limitation: 'Registo observacional contextual.'
  },
  'Frequência cardíaca': {
    id: 'hr',
    label: 'Frequência cardíaca',
    family: 'physiological',
    unit: 'bpm',
    generalReference: 'Varia consoante idade, atividade e condição de base',
    educationalMeaning: 'A frequência cardíaca indica o número de batimentos por minuto. Pode variar com atividade, stress, sono, hidratação e contexto da medição.',
    limitation: 'Valor de observação num dado momento. Não constitui interpretação clínica.'
  },
  'Saturação de oxigénio': {
    id: 'spo2',
    label: 'Saturação de oxigénio',
    family: 'physiological',
    unit: '%',
    generalReference: 'Tipicamente > 95%',
    educationalMeaning: 'A saturação de oxigénio indica a percentagem aproximada de oxigénio transportado no sangue no momento da medição. Deve ser lida com contexto e repetição.',
    limitation: 'Leitura dependente das condições da pele e do sensor.'
  },
  'Temperatura': {
    id: 'temperatura',
    label: 'Temperatura',
    family: 'physiological',
    unit: 'ºC',
    generalReference: 'Geralmente entre 36.1ºC e 37.2ºC',
    educationalMeaning: 'A temperatura corporal pode variar ligeiramente ao longo do dia e com contexto, atividade ou ambiente.',
    limitation: 'Medição sujeita a fatores externos.'
  },
  'Peso': {
    id: 'peso',
    label: 'Peso',
    family: 'physiological',
    unit: 'kg',
    generalReference: 'Dependente do indivíduo',
    educationalMeaning: 'Registo corporal para contexto de composição e tendências ao longo do tempo.',
    limitation: 'Valor observacional.'
  },
  'Impedância': {
    id: 'impedancia',
    label: 'Impedância',
    family: 'physiological',
    unit: '',
    generalReference: 'Relativa ao utilizador',
    educationalMeaning: 'A impedância é uma medição elétrica indireta que pode ajudar a contextualizar composição corporal e hidratação, mas deve ser interpretada com prudência.',
    limitation: 'Leitura estimada, não serve de diagnóstico.'
  },
  'ECG': {
    id: 'ecg',
    label: 'Eletrocardiograma (ECG)',
    family: 'physiological',
    unit: '',
    generalReference: 'Visualização de traçado',
    educationalMeaning: 'O ECG é um registo gráfico da atividade elétrica cardíaca. Nesta fase, a imagem é apresentada como apoio visual e não como interpretação clínica.',
    limitation: 'Imagem de apoio visual. Não constitui interpretação clínica.'
  }
};
