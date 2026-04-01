/**
 * Exemplos de Payload de Domain Packages (Harden)
 * Estes exemplos mostram como o contrato deve ser entregue às mini-apps.
 */

export const EXAMPLES = {
  // ── SLEEP ─────────────────────────────────────────────────────────────
  'sleep@1.0': {
    allowed: {
      domain: 'sleep',
      packageVersion: 'sleep@1.0',
      generatedAt: Date.now(),
      exposurePolicy: 'allowed',
      signals: { score: 85, statusLabel: 'Recuperação Ótima' },
      facts: [{ id: 'fact_1', type: 'sleep_debt_detected', value: '2.5h' }],
      provenanceSummary: { sourceAppIds: ['neuro-rest'], lastUpdated: Date.now() }
    },
    denied: {
      domain: 'sleep',
      packageVersion: 'sleep@1.0',
      generatedAt: Date.now(),
      exposurePolicy: 'denied',
      signals: {},
      facts: [],
      provenanceSummary: { sourceAppIds: [], lastUpdated: Date.now() }
    },
    unavailable: {
      domain: 'sleep',
      packageVersion: 'sleep@1.0',
      generatedAt: Date.now(),
      exposurePolicy: 'unavailable',
      signals: {},
      facts: [],
      provenanceSummary: { sourceAppIds: [], lastUpdated: Date.now() }
    }
  },

  // ── NUTRITION ─────────────────────────────────────────────────────────
  'nutrition@1.0': {
    allowed: {
      domain: 'nutrition',
      packageVersion: 'nutrition@1.0',
      generatedAt: Date.now(),
      exposurePolicy: 'allowed',
      signals: { score: 72, statusLabel: 'Estável' },
      facts: [{ id: 'fact_2', type: 'ingredient_disliked', value: 'Cilantro' }],
      provenanceSummary: { sourceAppIds: ['meal-planner'], lastUpdated: Date.now() }
    },
    unavailable: {
      domain: 'nutrition',
      packageVersion: 'nutrition@1.0',
      generatedAt: Date.now(),
      exposurePolicy: 'unavailable',
      signals: {},
      facts: [],
      provenanceSummary: { sourceAppIds: [], lastUpdated: Date.now() }
    }
  }
};
