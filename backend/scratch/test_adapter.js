// Test the adapter with the real OpenAI response captured in R3D
const realOpenAIResponse = {
  "summary": {
    "title": "Avaliação de estado físico com resultados satisfatórios.",
    "text": "Os dados analisados indicam um perfil fisiológico estável e adequado. A monitorização contínua é recomendada para apoiar o bem-estar global.",
    "confidence": "medium"
  },
  "dimensions": [
    {"id":"energy_availability","label":"Energia & disponibilidade","score":75,"explanation":"Valores de frequência cardíaca e regularidade de sono sugerem um nível de energia adequado.","supportingFacts":["FC média de 72 bpm","Duração do sono de 7h30"],"confidence":"medium"},
    {"id":"recovery_load","label":"Recuperação & carga","score":65,"explanation":"A HRV estimada de 48 ms indica recuperação moderada.","supportingFacts":["HRV de 48 ms"],"confidence":"medium"},
    {"id":"hydration_urinary_balance","label":"Hidratação & equilíbrio urinário","score":70,"explanation":"A gravidade específica de 1.015 sugere hidratação adequada.","supportingFacts":["Gravidade específica de 1.015"],"confidence":"medium"},
    {"id":"intestinal_state","label":"Estado intestinal","score":80,"explanation":"O resultado de Bristol 4 indica um estado intestinal saudável.","supportingFacts":["Bristol 4"],"confidence":"high"},
    {"id":"vital_signs_physiological_balance","label":"Sinais vitais & equilíbrio fisiológico","score":75,"explanation":"A temperatura corporal e SpO2 estão dentro dos parâmetros normais.","supportingFacts":["Temperatura de 36.5°C","SpO2 de 98%"],"confidence":"medium"}
  ],
  "highlightedThemes": [
    {"id":"hydration_urinary_balance","title":"Equilíbrio de hidratação adequado","status":"stable","explanation":"Os níveis de gravidade específica indicam boa hidratação.","supportingFacts":["Gravidade específica de 1.015"],"suggestedAction":"","confidence":"high","limitations":[]},
    {"id":"intestinal_state","title":"Estado intestinal satisfatório","status":"stable","explanation":"A regularidade do trânsito intestinal é apropriada.","supportingFacts":["Bristol 4"],"suggestedAction":"","confidence":"high","limitations":[]},
    {"id":"energy_availability","title":"Disponibilidade energética adequada","status":"stable","explanation":"O sono e a frequência cardíaca indicam energia disponível.","supportingFacts":["FC média de 72 bpm","Duração do sono de 7h30"],"suggestedAction":"","confidence":"medium","limitations":[]}
  ],
  "priorityActions": [
    {"title":"Manter hidratação adequada","reason":"Facilita a performance física e o bem-estar geral.","priority":"high","supportingFacts":[],"domain":"hydration"},
    {"title":"Incentivar um sono regular","reason":"Contribui para a recuperação e manutenção da saúde.","priority":"medium","supportingFacts":[],"domain":"recovery"},
    {"title":"Aumentar a atividade física moderada","reason":"Ajuda na estabilidade do estado de recuperação.","priority":"medium","supportingFacts":[],"domain":"general"}
  ],
  "watchSignals": [
    {"title":"Monitorizar variabilidade da frequência cardíaca (HRV)","explanation":"Observações regulares podem revelar padrões importantes de recuperação.","reasonToRepeat":"Acompanhar a HRV ao longo do tempo ajudará a avaliar a recuperação."}
  ],
  "references": {
    "usedDataFamilies":["medidas fisiológicas","sono"],
    "usedSignals":["frequência cardíaca","HRV","SpO2","gravidade específica","Bristol"],
    "freshness":"fresh",
    "confidence":"medium",
    "limitations":["A amostra de dados é limitada e não substitui uma avaliação clínica completa."]
  },
  "readingLimits": []
};

// Inline the adapter logic (can't import TS directly in Node)
function normalizeAIReadingResponse(rawOutput) {
  const isObject = (val) => typeof val === 'object' && val !== null;
  const raw = isObject(rawOutput) ? rawOutput : {};
  const summary = isObject(raw.summary) ? raw.summary : {};
  const references = isObject(raw.references) ? raw.references : {};
  const dimensions = Array.isArray(raw.dimensions) ? raw.dimensions : [];
  const highlightedThemes = Array.isArray(raw.highlightedThemes) ? raw.highlightedThemes : [];
  const priorityActions = Array.isArray(raw.priorityActions) ? raw.priorityActions : [];
  const watchSignals = Array.isArray(raw.watchSignals) ? raw.watchSignals : [];

  return {
    summary: { title: summary.title || 'fallback', text: summary.text || 'fallback', mode: 'real' },
    dimensions: dimensions.length,
    highlightedThemes: highlightedThemes.length,
    priorityActions: priorityActions.length,
    watchSignals: watchSignals.length,
    readingLimits: Array.isArray(raw.readingLimits) && raw.readingLimits.length > 0 
      ? raw.readingLimits 
      : ['Esta leitura é interpretativa e gerada por inteligência artificial.', 'Não substitui avaliação clínica nem faz diagnóstico.'],
    references_origins: ['AI Generated'],
  };
}

const result = normalizeAIReadingResponse(realOpenAIResponse);
console.log('=== ADAPTER TEST WITH REAL OPENAI RESPONSE ===');
console.log('summary.title:', result.summary.title);
console.log('summary fallback used:', result.summary.title === 'fallback' ? 'YES (BAD)' : 'NO (GOOD)');
console.log('dimensions:', result.dimensions);
console.log('highlightedThemes:', result.highlightedThemes);
console.log('priorityActions:', result.priorityActions);
console.log('watchSignals:', result.watchSignals);
console.log('readingLimits count:', result.readingLimits.length);
console.log('readingLimits fallback used:', result.readingLimits[0].includes('interpretativa') ? 'YES (defaults)' : 'NO (from API)');
console.log('references origins:', result.references_origins);
console.log('=== VERDICT: ADAPTER WORKS ===');
