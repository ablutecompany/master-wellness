import { Injectable } from '@nestjs/common';
import { DomainScore, DomainStatus, DomainType, ScoringConfig } from './types';

@Injectable()
export class ScoringService {
  private readonly configs: Record<DomainType, ScoringConfig> = {
    energy: {
      weights: { glucose: 0.3, urea: 0.2, sodium: 0.2, potassium: 0.1, hydration: 0.2 },
      thresholds: { optimal: 85, functional: 65 }
    },
    recovery: {
      weights: { urea: 0.4, creatinine: 0.2, sleep_quality: 0.4 },
      thresholds: { optimal: 80, functional: 60 }
    },
    performance: {
      weights: { glucose: 0.3, hydration: 0.2, activity_load: 0.5 },
      thresholds: { optimal: 85, functional: 70 }
    },
    sleep: {
      weights: { sleep_quality: 0.6, hrv: 0.2, resting_heart_rate: 0.2 },
      thresholds: { optimal: 80, functional: 60 }
    },
    nutrition: {
      weights: { glucose: 0.5, fiber_intake: 0.3, hydration: 0.2 },
      thresholds: { optimal: 85, functional: 65 }
    },
    general: {
      weights: { activity_load: 0.3, sleep_quality: 0.3, glucose: 0.4 },
      thresholds: { optimal: 80, functional: 60 }
    }
  };

  calculate(domain: DomainType, measurements: any[]): DomainScore {
    const config = this.configs[domain] || { weights: {}, thresholds: { optimal: 80, functional: 60 } };
    const weightCodes = Object.keys(config.weights);

    let baseScore = 0;
    const capturedCodes: string[] = [];

    for (const code of weightCodes) {
      const weight = config.weights[code];
      const match = measurements.find(m => m.code === code);
      const val = match?.valueNumeric ?? 50; // Neutral fallback
      
      baseScore += (val * weight);
      if (match) capturedCodes.push(code);
    }

    const freshnessPenalty = this.calculateFreshnessPenalty(measurements);
    const completenessPenalty = (weightCodes.length - capturedCodes.length) * 5;
    
    const finalValue = Math.max(0, Math.min(100, Math.round(baseScore - freshnessPenalty - completenessPenalty)));
    const confidence = Math.max(0, 100 - (freshnessPenalty * 2 + completenessPenalty));

    const status: DomainStatus = capturedCodes.length === 0 
      ? 'unavailable' 
      : (capturedCodes.length < weightCodes.length / 2) 
        ? 'insufficient_data' 
        : 'sufficient_data';

    return {
      value: finalValue,
      confidence,
      stateLabel: this.getStateLabel(finalValue, config.thresholds),
      band: this.getBand(finalValue, config.thresholds),
      freshnessPenalty,
      completenessPenalty,
      status
    };
  }

  private calculateFreshnessPenalty(measurements: any[]): number {
    if (measurements.length === 0) return 20;
    const now = new Date();
    const oldest = Math.min(...measurements.map(m => m.capturedAt ? new Date(m.capturedAt).getTime() : now.getTime()));
    const hoursDiff = (now.getTime() - oldest) / (1000 * 60 * 60);
    return Math.min(30, Math.floor(hoursDiff / 12));
  }

  private getStateLabel(score: number, thresholds: any): string {
    if (score >= thresholds.optimal) return 'excelente';
    if (score >= thresholds.functional) return 'bom';
    if (score >= 50) return 'moderado';
    return 'fraco';
  }

  private getBand(score: number, thresholds: any): 'optimal' | 'functional' | 'critical' {
    if (score >= thresholds.optimal) return 'optimal';
    if (score >= thresholds.functional) return 'functional';
    return 'critical';
  }
}
