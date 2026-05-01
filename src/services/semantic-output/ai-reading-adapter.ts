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
  
  if (raw.overallNarrative) {
    merged.summary.text = raw.overallNarrative;
  }
  if (raw.shortSummary) {
    merged.summary.title = raw.shortSummary;
  }
  
  if (Array.isArray(raw.dimensions)) {
    raw.dimensions.forEach((v2Dim: any) => {
      const localDim = merged.dimensions.find(d => d.id === v2Dim.id);
      if (localDim) {
        if (v2Dim.refinedSummary) localDim.summary = v2Dim.refinedSummary;
        
        if (Array.isArray(v2Dim.refinedRecommendations) && v2Dim.refinedRecommendations.length > 0) {
           localDim.recommendations = v2Dim.refinedRecommendations.map((r: any) => ({
             text: r.text || '',
             reason: r.reason || '',
             priority: r.priority || 'medium',
             type: 'context' // Default type since V2 doesn't provide it
           }));
        }
        
        if (Array.isArray(v2Dim.refinedReferences) && v2Dim.refinedReferences.length > 0) {
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

  // Update Próximo Foco summary if nextFocusText is present
  const focusDim = merged.dimensions.find(d => d.id === 'next_focus');
  if (focusDim && raw.nextFocusText) {
    focusDim.summary = raw.nextFocusText;
  }

  // Apply ensureDimensionTabsContent to all dimensions
  const nutrientPriorities = raw?.nutrientSuggestions || [];
  merged.dimensions.forEach(dim => {
    ensureDimensionTabsContent(dim, nutrientPriorities);
  });

  return merged;
}
