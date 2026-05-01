import { AIReading, HolisticDimension } from './ai-reading-engine';

export function normalizeAIReadingResponse(rawOutput: any): AIReading {
  const isObject = (val: any) => typeof val === 'object' && val !== null;
  const raw = isObject(rawOutput) ? rawOutput : {};
  const summary = isObject(raw.summary) ? raw.summary : {};
  const dimensions = Array.isArray(raw.dimensions) ? raw.dimensions : [];

  return {
    summary: {
      title: summary.title || 'Análise concluída',
      text: summary.text || 'Resumo',
      confidence: typeof summary.confidence === 'number' ? summary.confidence : 0.8,
      mode: 'real',
    },
    dimensions: dimensions.map((d: any): HolisticDimension => ({
      id: d.id || 'unknown',
      title: d.title || 'Sem título',
      color: d.color || '#AAA',
      score: typeof d.score === 'number' ? d.score : null,
      confidence: d.confidence || 'insufficient',
      status: d.status || 'insufficient',
      summary: d.summary || '',
      topDrivers: Array.isArray(d.topDrivers) ? d.topDrivers : [],
      recommendations: Array.isArray(d.recommendations) ? d.recommendations : [],
      references: Array.isArray(d.references) ? d.references : [],
      limitations: Array.isArray(d.limitations) ? d.limitations : [],
    }))
  };
}
