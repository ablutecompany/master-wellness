import { SemanticGuardrails } from '../guardrails';
import { SemanticOutputState } from '../types';

describe('SemanticGuardrails (Unit Tests)', () => {

  const _originalDev = __DEV__;

  beforeEach(() => {
    (global as any).__DEV__ = true;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (global as any).__DEV__ = _originalDev;
    jest.restoreAllMocks();
  });

  it('deve intercetar (throw) se __DEV__ for true e o bundle for inválido', () => {
    expect(() => SemanticGuardrails.assertValidBundleConsumption(null)).toThrow('[Anti-Regression]');
  });

  it('deve usar graceful fallback via boolean e log se não for __DEV__', () => {
    (global as any).__DEV__ = false;
    const isValid = SemanticGuardrails.assertValidBundleConsumption(null);
    expect(isValid).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('reconhece devidamente os estados suportados formales', () => {
    expect(SemanticGuardrails.assertValidBundleConsumption({ status: 'ready' } as SemanticOutputState)).toBe(true);
    expect(SemanticGuardrails.assertValidBundleConsumption({ status: 'stale' } as SemanticOutputState)).toBe(true);
    expect(SemanticGuardrails.assertValidBundleConsumption({ status: 'insufficient_data' } as SemanticOutputState)).toBe(true);
    expect(SemanticGuardrails.assertValidBundleConsumption({ status: 'error' } as SemanticOutputState)).toBe(true);
  });

  it('rejeita um payload que traga antigas variaveis ressuscitadas', () => {
    const dirtyBundle = { status: 'ready', globalScore: 90, themeScores: [] } as any;
    expect(() => SemanticGuardrails.assertValidBundleConsumption(dirtyBundle)).toThrow('rasto legado proibido');
  });

  it('assegura que um dominio "ready" traz conteúdo para a factual fidelity', () => {
    expect(() => SemanticGuardrails.assertFactualFidelity({ status: 'ready' }, 'ProfileScreen')).toThrow('sem fornecer mainInsight');
    
    // Sucesso quando é ready e Traz o insight
    expect(SemanticGuardrails.assertFactualFidelity({ status: 'ready', mainInsight: { summary: 'OK' } }, 'ProfileScreen')).toBe(true);
  });

});
