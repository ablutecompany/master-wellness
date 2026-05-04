import { AIReading, HolisticDimension, DimensionRecommendation, DimensionReference } from './ai-reading-engine';

function cleanForbiddenPlaceholders(text: string): string {
  if (!text) return '';
  const forbidden = [
    'Sem ações específicas. Manter consistência.',
    'Refs incorporadas no resumo holístico.',
    'Resumo holístico.',
    'Dados estáveis.'
  ];
  let clean = text;
  forbidden.forEach(f => {
    if (clean.includes(f)) {
      clean = clean.replace(f, '').trim();
    }
  });
  return clean;
}

function normalizeReferenceText(text: string, dimensionId?: string): string {
  if (!text) return '';
  let clean = text;

  // Remover prefixos "entre outras"
  clean = clean.replace(/^entre outras[.,]?\s*/i, '');
  clean = clean.replace(/^entre outros[.,]?\s*/i, '');

  // Capitalizar primeira letra
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);

  // Dicionário de tradução
  const dictionary: Record<string, string> = {
    'fC': 'Frequência cardíaca',
    'HRV': 'Variabilidade da frequência cardíaca',
    'SpO2': 'Saturação de oxigénio',
    'DOB': 'Data de nascimento',
    'urineDensity': 'Densidade urinária',
    'naKRatio': 'Rácio sódio/potássio',
    'bristol': 'Escala de Bristol',
    'fecalOptical': 'Caracterização óptica das fezes',
    'internal_balance': 'Equilíbrio interno',
    'recovery': 'Recuperação',
    'physiological_load': 'Carga fisiológica'
  };

  // Humanização de impactos
  clean = clean.replace(/impacta negativamente na avaliação/gi, 'reduziu a pontuação por apresentar sinais que merecem atenção');
  clean = clean.replace(/contribui negativamente/gi, 'reduziu a pontuação por apresentar sinais que merecem atenção');
  clean = clean.replace(/contribui positivamente/gi, 'ajudou a sustentar uma leitura mais favorável nesta dimensão');
  clean = clean.replace(/aumento na avaliação/gi, 'contribuiu positivamente para a leitura');

  // Traduzir termos do dicionário
  Object.keys(dictionary).forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    clean = clean.replace(regex, dictionary[key]);
  });

  return clean;
}

function ensureDimensionTabsContent(dim: HolisticDimension, nutrientPriorities: any[] = []) {
  dim.summary = cleanForbiddenPlaceholders(dim.summary || '');
  if (!dim.summary) {
    dim.summary = `Os indicadores para ${dim.title} encontram-se num estado ${dim.status === 'stable' ? 'estável' : dim.status === 'priority' ? 'prioritário' : 'de atenção'}. Recomenda-se manter a observação.`;
  }

  // Ensure actions
  let actions = (dim.recommendations || []).map(r => ({ ...r, text: cleanForbiddenPlaceholders(r.text) })).filter(r => r.text);
  
  if ((dim.id === 'signal_oriented_nutrition' || dim.id === 'food_adjustments') && nutrientPriorities && nutrientPriorities.length > 0) {
    // Inject nutrientPriorities as actions for Ajustes Alimentares
    actions = nutrientPriorities.map(np => ({
      text: `${np.nutrient}: ${np.foodExamples?.join(', ') || 'Sem exemplos'}`,
      reason: np.reason,
      priority: np.priority === 'high' ? 'high' : 'medium',
      type: 'context'
    }));
  }

  if (actions.length === 0) {
    if (dim.status === 'stable') {
      actions.push({ text: 'Manter a consistência actual da rotina.', reason: 'A dimensão encontra-se num estado favorável.', priority: 'low', type: 'context' });
    } else {
      actions.push({ text: 'Observar a evolução nas próximas leituras.', reason: 'Aguardar por mais pontos de dados para sugerir uma acção concreta.', priority: 'medium', type: 'context' });
    }
  }
  dim.recommendations = actions;

  // Ensure refs
  let refs = (dim.references || []).map(r => ({ ...r, factor: cleanForbiddenPlaceholders(r.factor) })).filter(r => r.factor);
  
  if (refs.length === 0) {
    if (dim.topDrivers && dim.topDrivers.length > 0) {
      refs = dim.topDrivers.map(td => ({
        factor: td.label,
        whyItMatters: `Sinal identificado no cálculo de ${dim.title}.`,
        influenceOnScore: td.direction === 'positive' ? 'Positivo' : 'Atenção necessária',
      }));
    } else {
      refs.push({ factor: 'Dados insuficientes', whyItMatters: 'Não existem drivers específicos destacados nesta dimensão para a presente leitura.', influenceOnScore: '' });
    }
  }
  dim.references = refs;
}

export function normalizeAIReadingResponse(rawOutput: any, localReading: AIReading): AIReading {
  const isObject = (val: any) => typeof val === 'object' && val !== null;
  const raw = isObject(rawOutput) ? rawOutput : {};
  
  // Clone localReading to avoid mutating the original
  const merged: AIReading = JSON.parse(JSON.stringify(localReading));
  
  // R6.1 Mapping
  if (raw.summary && typeof raw.summary === 'object') {
    if (raw.summary.title) merged.summary.title = raw.summary.title;
    if (raw.summary.body) merged.summary.text = raw.summary.body;
  } else {
    // Legacy mapping
    if (raw.overallNarrative) merged.summary.text = raw.overallNarrative;
    if (raw.shortSummary) merged.summary.title = raw.shortSummary;
  }
  
  if (Array.isArray(raw.dimensions)) {
    raw.dimensions.forEach((v2Dim: any) => {
      const localDim = merged.dimensions.find(d => d.id === v2Dim.id);
      if (localDim) {
        // R6.1 Mapping
        if (v2Dim.summary) localDim.summary = v2Dim.summary;
        if (v2Dim.score !== undefined) localDim.score = v2Dim.score;
        if (v2Dim.state) localDim.status = v2Dim.state;
        
        if (Array.isArray(v2Dim.actions)) {
          localDim.recommendations = v2Dim.actions.map((act: string) => ({
            text: act,
            reason: '',
            priority: 'medium',
            type: 'context'
          }));
        }

        if (Array.isArray(v2Dim.references)) {
          localDim.references = v2Dim.references.map((ref: string) => {
            return {
              factor: normalizeReferenceText(ref, v2Dim.id),
              observedValue: '',
              whyItMatters: '',
              influenceOnScore: ''
            };
          });
        }

        // Apply R6.1 limitations if defined
        if (v2Dim.limits) {
           localDim.limitations = [v2Dim.limits];
        }

        // R6.2 Intro
        if (v2Dim.referencesIntro) {
           localDim.referencesIntro = v2Dim.referencesIntro;
        }

        // Legacy V2 Fallbacks
        if (v2Dim.refinedSummary) localDim.summary = v2Dim.refinedSummary;
        if (Array.isArray(v2Dim.refinedRecommendations)) {
           localDim.recommendations = v2Dim.refinedRecommendations.map((r: any) => ({
             text: r.text || '',
             reason: r.reason || '',
             priority: r.priority || 'medium',
             type: 'context'
           }));
        }
        if (Array.isArray(v2Dim.refinedReferences)) {
           localDim.references = v2Dim.refinedReferences.map((r: any) => ({
             factor: r.factor || '',
             observedValue: r.observedValue,
             whyItMatters: r.whyItMatters || '',
             influenceOnScore: r.explanation || '',
             caution: r.caution
           }));
        }
      }
    });
  }

  // Update Próximo Foco summary
  const focusDim = merged.dimensions.find(d => d.id === 'next_focus');
  if (focusDim) {
    if (raw.summary?.focusReason) focusDim.summary = raw.summary.focusReason;
    else if (raw.nextFocusText) focusDim.summary = raw.nextFocusText;
  }

  // Apply ensureDimensionTabsContent to all dimensions
  const nutrientPriorities = raw?.nutrientSuggestions || merged.nutrientPriorities || [];
  merged.dimensions.forEach(dim => {
    ensureDimensionTabsContent(dim, nutrientPriorities);
  });

  return merged;
}
