import { validateDomainPackageShape } from '../../schema-validators';
import allowedSleep from '../__fixtures__/domain-packages.sleep.allowed.json';
import unavailableNutrition from '../__fixtures__/domain-packages.nutrition.unavailable.json';
import deniedGeneral from '../__fixtures__/domain-packages.general.denied.json';
import { buildContextPayload } from '../index';
import { AppState } from '../../../store/types';
import { resolvePackageState, getPackageSignals, getPackageFacts } from '../../../miniapps/contracts/domain-packages';

jest.mock('../../../store/selectors', () => ({
  selectAppPermissions: jest.fn().mockReturnValue(['SLEEP_DATA_READ']),
  selectUser: jest.fn(),
  selectMeasurements: jest.fn().mockReturnValue([]),
  selectSleepDomainPackage: jest.fn().mockReturnValue(require('../__fixtures__/domain-packages.sleep.allowed.json')),
  selectNutritionDomainPackage: jest.fn().mockReturnValue(require('../__fixtures__/domain-packages.nutrition.unavailable.json')),
  selectGeneralWellnessPackage: jest.fn().mockReturnValue(require('../__fixtures__/domain-packages.general.denied.json'))
}));

describe('Contrato Bridge: Mini-App SDK & Payload Runtime', () => {

  it('os fixtures canónicos cumprem o exposurePolicy schema mínimo do SDK', () => {
    expect(validateDomainPackageShape(allowedSleep)).toBe(true);
    expect(validateDomainPackageShape(unavailableNutrition)).toBe(true);
    expect(validateDomainPackageShape(deniedGeneral)).toBe(true);

    expect(allowedSleep.packageVersion).toBe('1.2.0');
  });

  it('o adapter compila um contexto inteiramente desprovido de chaves ghost derivatedContext', () => {
    const payload = buildContextPayload('test', {} as AppState);
    
    // Prova fundamental de contrato ativo
    expect(payload.domainPackages).toBeDefined();
    expect(Object.keys(payload)).not.toContain('derivedContext');
    expect('derivedContext' in payload).toBe(false);
  });

  it('o adapter expulsa pacotes com exposurePolicy "denied", partilhando o mínimo obrigatório', () => {
    const payload = buildContextPayload('test', {} as AppState);
    
    // Devolvemos 3 do SDK base, 1 deles tem exposurePolicy: denied
    const pkgs = payload.domainPackages!;
    
    // Nutrition: unavailable; Sleep: allowed
    expect(pkgs.length).toBe(2);
    
    expect(pkgs.find(p => p.domain === 'general')).toBeUndefined(); // denegado foi cortado!
    
    const sleep = pkgs.find(p => p.domain === 'sleep');
    expect(sleep?.exposurePolicy).toBe('allowed');
    expect(sleep?.facts).toHaveLength(1);
  });

  it('recusa shapes falhadas ou legadas com derivedContext solto dentro do SDK array', () => {
    const corruptDraft = {
      domain: 'sleep',
      packageVersion: '1.2.0',
      exposurePolicy: 'allowed',
      derivedContext: [] // ERRO!
    };
    
    expect(validateDomainPackageShape(corruptDraft)).toBe(false);
  });

  describe('SDK Client-Side Helpers (Camada Polimórfica V1.3.0)', () => {
    it('resolvePackageState devolve estado Missing em contratos vazios', () => {
      const mockCtx: any = { domainPackages: [] };
      const { status, pkg } = resolvePackageState(mockCtx, 'nutrition');
      expect(status).toBe('missing');
      expect(pkg).toBeNull();
    });

    it('resolvePackageState devolve status e bloqueia signals se for unavailable', () => {
      // Simula context real c/ payload da store (unavailableNutrition)
      const mockCtx: any = { domainPackages: [unavailableNutrition] };
      const { status, pkg } = resolvePackageState(mockCtx, 'nutrition');
      
      expect(status).toBe('unavailable');
      expect(pkg).toBeDefined();

      const signals = getPackageSignals(mockCtx, 'nutrition');
      expect(signals).toBeNull(); // Não lê signals pq policy !== allowed
    });

    it('getPackageSignals & getPackageFacts abrem corretamente payloads allowed', () => {
      const mockCtx: any = { domainPackages: [allowedSleep] };
      const { status } = resolvePackageState(mockCtx, 'sleep');
      expect(status).toBe('allowed');

      const signals = getPackageSignals(mockCtx, 'sleep');
      const facts = getPackageFacts(mockCtx, 'sleep');

      expect(signals.score).toBe(90);
      expect(facts.length).toBeGreaterThan(0);
    });
  });
});
