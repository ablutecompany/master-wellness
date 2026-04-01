import { DomainSemanticOutput, CrossDomainCoherence, RecommendationItem } from './types';

/**
 * SERVIÇO TRANVERSAL DE COERÊNCIA (CROSS-DOMAIN COHERENCE)
 * 
 * Regras:
 * - Detecta antagonismos biográficos calculados (e.g. General alto vs Recovery baixo).
 * - Desduplica actioables (Recomendações com o mesmo ID ou bodyShort).
 * - Identifica sinais gritantes de exaustão sobrepostos (Performance + Energy).
 */
export class CrossDomainCoherenceService {
  static harmonize(domains: Record<string, DomainSemanticOutput>): CrossDomainCoherence {
    const flags: string[] = [];
    const signals: string[] = [];
    
    // Default to 100 so it doesn't falsely trigger < 60 exhaustion if empty 
    const generalScore = domains['general']?.score?.value ?? 100;
    const recoveryScore = domains['recovery']?.score?.value ?? 100;
    const perfScore = domains['performance']?.score?.value ?? 100;
    const energyScore = domains['energy']?.score?.value ?? 100;

    // RULE 1: Falso Otimismo Global
    if (generalScore > 80 && (recoveryScore < 60 || perfScore < 60)) {
      flags.push('GENERAL_OVERLY_OPTIMISTIC');
      signals.push('Fadiga periférica em curso condiciona a leitura agregada base.');
    }

    // RULE 2: Exaustão Partilhada
    if (energyScore < 60 && perfScore < 60) {
      flags.push('MULTIPLE_EXHAUSTION_WARNINGS');
      signals.push('Sinalização grave: Múltiplos sistemas corroboram a indicação vital de repouso estruturado.');
    }

    // RULE 3: Deduplicação Limpa de Aconselhamentos Acumulados
    const rawRecs: RecommendationItem[] = [];
    for (const key of Object.keys(domains)) {
      if (domains[key].recommendations && Array.isArray(domains[key].recommendations)) {
        rawRecs.push(...domains[key].recommendations);
      }
    }

    const recMap = new Map<string, RecommendationItem>();
    rawRecs.forEach(r => {
      // Deduplicamos pela directrice (ID cross-domain se existir, senao bodyShort)
      const mergeKey = r.id || r.bodyShort;
      if (!recMap.has(mergeKey)) {
        recMap.set(mergeKey, r);
      } else {
        // Podiamos mesclar prioridades, aqui assumimos first is highest ou retemos a c/ impact maior
        const existing = recMap.get(mergeKey)!;
        if (r.impactLevel === 'high' && existing.impactLevel !== 'high') {
          recMap.set(mergeKey, r); // Override com impacto superior
        }
      }
    });

    const dedupRecs = Array.from(recMap.values()).sort((a, b) => a.priorityRank - b.priorityRank);

    return {
      summary: flags.length > 0 ? 'Conflitos Inter-Domínio Identificados e Harmonizados.' : 'Ecossistema Global Biográfico Estreitamente Alinhado.',
      coherenceFlags: flags,
      prioritySignals: signals,
      deduplicatedRecommendations: dedupRecs
    };
  }
}
