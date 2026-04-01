import { SemanticGuardrails } from './guardrails';
import { SemanticOutputState } from './types';

/**
 * Utilitários testáveis básicos (asserções cirúrgicas locales)
 * Podem ser acionados no startup em ambientes de QA ou portados para Jest.
 */
export const runSemanticGuardrailTests = () => {
  console.log('[Testes] A iniciar validação dos Semantic Guardrails...');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  const expectThrow = (fn: () => void, testName: string) => {
    try {
      fn();
      console.error(`❌ [FAIL] ${testName} - Esperava exceção mas não ocorreu.`);
      failed++;
    } catch (e) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    }
  };

  // Temporariamente ativar o modo dev para testar o throw se possível, ou mockar
  const originalDev = __DEV__;
  (global as any).__DEV__ = true;

  try {
    // Teste 1: Rejeição de bundle vazio
    expectThrow(() => {
      SemanticGuardrails.assertValidBundleConsumption(null);
    }, 'Rejeição de payload null/vazio');

    // Teste 2: Distinção ready / stale / error
    assert(SemanticGuardrails.assertValidBundleConsumption({ status: 'ready' } as SemanticOutputState), 'Aceitar status ready');
    assert(SemanticGuardrails.assertValidBundleConsumption({ status: 'stale' } as SemanticOutputState), 'Aceitar status stale');
    assert(SemanticGuardrails.assertValidBundleConsumption({ status: 'insufficient_data' } as SemanticOutputState), 'Aceitar status insufficient_data');
    assert(SemanticGuardrails.assertValidBundleConsumption({ status: 'error' } as SemanticOutputState), 'Aceitar status error');

    expectThrow(() => {
      SemanticGuardrails.assertValidBundleConsumption({ status: 'xyz_unknown' } as any);
    }, 'Rejeição de status desconhecidos ou legacy');

    // Teste 3: Comportamento seguro perante resíduos (globalScore)
    expectThrow(() => {
      SemanticGuardrails.assertValidBundleConsumption({ status: 'ready', globalScore: 90 } as any);
    }, 'Bloqueio de payload com resíduo legado (globalScore)');

    // Teste 4: Factual fidelity
    expectThrow(() => {
      SemanticGuardrails.assertFactualFidelity({ status: 'ready' }, 'TestComponent');
    }, 'Mascara de ready sem mainInsight falha validação de governança');

    assert(
      SemanticGuardrails.assertFactualFidelity({ status: 'ready', mainInsight: { summary: 'OK' } }, 'TestComponent'),
      'Domínio ready com mainInsight passa.'
    );

  } finally {
    (global as any).__DEV__ = originalDev;
  }

  console.log(`[Testes] Concluídos: ${passed} passaram, ${failed} falharam.`);
  return { passed, failed };
};
