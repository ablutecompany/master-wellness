import { SemanticOutputState } from './types';

/**
 * GUARDA ANTI-REGRESSÃO 🛡️
 * Regra Arquitetural: A shell (UI) está estritamente proibida de usar lógicas 
 * estáticas antigas baseadas em Math.random(), themeScores ou globalScore bruto.
 * 
 * Estas asserções garantem a integridade do pipeline semântico governado
 * e previnem fallbacks textuais na UI.
 */
export const SemanticGuardrails = {
  assertValidBundleConsumption: (bundle?: SemanticOutputState | null) => {
    if (!bundle) {
      const msg = '[Anti-Regression] Tentativa de consumo de bundle vazio ou injetado indevidamente da store legada.';
      if (__DEV__) throw new Error(msg);
      console.error(msg);
      return false;
    }

    const validStatuses = ['ready', 'stale', 'insufficient_data', 'error', 'unavailable'];
    if (!validStatuses.includes(bundle.status)) {
      const msg = `[Anti-Regression] Status semântico legado/inválido detetado: ${bundle.status}`;
      if (__DEV__) throw new Error(msg);
      console.error(msg);
      return false;
    }

    const illegalKeys = ['globalScore', 'themeScores', 'scores'];
    for (const key of illegalKeys) {
      if (key in bundle) {
        const msg = `[Anti-Regression] O bundle governado contém rasto legado proibido: ${key}. Rever serialização.`;
        if (__DEV__) throw new Error(msg);
        console.error(msg);
        return false;
      }
    }

    return true;
  },

  assertFactualFidelity: (domainOutput: any, componentName: string) => {
    // Para ecrãs descritivos e factuais, garantir que a ponte de apresentação
    // não mascara um estado ready sem payload real.
    if (domainOutput?.status === 'ready' && !domainOutput?.mainInsight) {
      const msg = `[Anti-Regression] Fuga de Governance em ${componentName}: Domínio reporta 'ready' sem fornecer mainInsight.`;
      if (__DEV__) throw new Error(msg);
      console.error(msg);
      return false;
    }
    return true;
  }
};
