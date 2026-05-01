import { AIReading, HolisticDimension } from './ai-reading-engine';

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

  return merged;
}
