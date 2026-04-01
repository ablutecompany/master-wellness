import { buildContextPayload, getLastAuditLog } from '../index';
import { AppState } from '../../../store/types';

// O index internamente chama os selectors, 
// então mockamos o * que importam de lá
jest.mock('../../../store/selectors', () => ({
  selectAppPermissions: jest.fn().mockImplementation((state, appId) => ['HEALTH_DATA_READ', 'SLEEP_DATA_READ', 'NUTRITION_DATA_READ']),
  selectUser: jest.fn(),
  selectMeasurements: jest.fn().mockReturnValue([]),
  selectActiveDerivedContextFacts: jest.fn().mockReturnValue([]),
  selectSleepDomainPackage: jest.fn().mockReturnValue({ domain: 'sleep', packageVersion: '1.2.0', exposurePolicy: 'allowed', generatedAt: Date.now() }),
  selectNutritionDomainPackage: jest.fn().mockReturnValue({ domain: 'nutrition', packageVersion: '1.2.0', exposurePolicy: 'allowed', generatedAt: Date.now() }),
  selectGeneralWellnessPackage: jest.fn().mockReturnValue({ domain: 'general', packageVersion: '1.2.0', exposurePolicy: 'allowed', generatedAt: Date.now() - 90000000 }), // ~25 hours old (STALE)
}));

jest.mock('../../semantic-output', () => ({
  semanticOutputService: {
    getCrossDomainSummary: jest.fn().mockReturnValue({
      summary: 'Mocked Transversal',
      coherenceFlags: ['test_flag']
    })
  }
}));

describe('Mini-App Bridge Context', () => {

  it('não deve enviar globalScore: 0 e sim undefined com status de legado unsupported', () => {
    
    // Passamos um AppState mockado vazio pq a lógica usa os Selectors mockados em cima
    const payload = buildContextPayload('test-app', {} as AppState);
    
    expect(payload.healthSummaryContext).toBeTruthy();
    expect(payload.healthSummaryContext?.globalScore).toBeUndefined();
    expect(payload.healthSummaryContext?.themeScores).toBeUndefined();
    expect(payload.healthSummaryContext?.status).toBe('legacy_metrics_unsupported');
    
  });

  it('não deve enviar fallbacks de sleepScore e nutritionScore como nulos enganadores', () => {
    
    const payload = buildContextPayload('test-app', {} as AppState);
    
    expect(payload.sleepContextPackage).toBeTruthy();
    expect(payload.sleepContextPackage?.sleepScore).toBeUndefined();
    
    expect(payload.nutritionContextPackage).toBeTruthy();
    expect(payload.nutritionContextPackage?.nutritionScore).toBeUndefined();
  });

  it('deve assegurar que a chave "derivedContext" NÃO EXISTE no payload, forçando o uso de domainPackages', () => {
    const payload = buildContextPayload('test-app', {} as AppState);
    
    // Prova de sunset: chave foi removida do shape, nem undefined tem.
    expect(Object.keys(payload)).not.toContain('derivedContext');
    expect('derivedContext' in payload).toBe(false);
    
    // Prova de contrato ativo
    expect(payload.domainPackages).toBeDefined();
    expect(Array.isArray(payload.domainPackages)).toBe(true);
  });

  describe('DomainPackages Contract (Active Standard)', () => {
    it('o payload deve obrigatoriamente possuir um array de domainPackages compatível', () => {
      const payload = buildContextPayload('test-app', {} as AppState);
      
      const pkgs = payload.domainPackages;
      expect(pkgs).toBeDefined();
      expect(pkgs!.length).toBeGreaterThan(0); // Mocked returns 3 packages
      
      const sleepPkg = pkgs?.find(p => p.domain === 'sleep');
      expect(sleepPkg).toMatchObject({
        exposurePolicy: 'allowed'
      });
      // Verifica campos expectados pelas mini-apps no SDK
      // Neste mock retorna apenas allowed, mas a shape contratual mínima está assegurada
    });

    it('v1.4: filtra pacotes ativamente não declarados no manifesto da app conhecida', () => {
      // "sleep-deep" no catalog tem consumedDomains: ['sleep', 'energy']
      const payload = buildContextPayload('sleep-deep', {} as AppState);
      
      const pkgs = payload.domainPackages;
      expect(pkgs).toBeDefined();
      
      // Nutrition e General devem ser ocultados, mas Sleep deve passar
      const hasSleep = pkgs?.some(p => p.domain === 'sleep');
      const hasNutrition = pkgs?.some(p => p.domain === 'nutrition');
      const hasGeneral = pkgs?.some(p => p.domain === 'general');
      
      expect(hasSleep).toBe(true);
      expect(hasNutrition).toBe(false); // Retido silenciosamente pela bridge
      expect(hasGeneral).toBe(false);   // Retido silenciosamente pela bridge
    });

    it('v1.4: devolve falha segura (unavailable) se a versão do package for incompatível com o manifest', () => {
      // Mockamos um snapshot onde a bridge gerou um package 2.0.0
      const mockedSelector = require('../../../store/selectors');
      mockedSelector.selectSleepDomainPackage.mockReturnValueOnce({ 
        domain: 'sleep', 
        packageVersion: '2.0.0', // Incompatível com '1.2.0' pedido pelo sleep-deep
        exposurePolicy: 'allowed'
      });

      const payload = buildContextPayload('sleep-deep', {} as AppState);
      const sleepPkg = payload.domainPackages?.find(p => p.domain === 'sleep');

      expect(sleepPkg).toBeDefined();
      expect(sleepPkg?.exposurePolicy).toBe('unavailable'); // Despromovido de 'allowed' para 'unavailable'
    });

    it('v1.5: não injeta crossDomainSummary se a app não suporta', () => {
      // "sleep-deep" NÃO tem supportsCrossDomainSummary: true ou tem false/undefined
      const payload = buildContextPayload('sleep-deep', {} as AppState);
      expect((payload as any).crossDomainSummary).toBeUndefined();
    });

    it('v1.5: bloqueia pacotes stale (stale_blocked) se requiresFreshData for true', () => {
      // General package mockado no top foi criado há > 24 horas (stale)
      const mockedCatalog = require('../../../miniapps/catalog');
      
      // Criamos um manifesto fake na lista
      mockedCatalog.MINI_APP_CATALOG.push({
        id: 'test-fresh',
        consumedDomains: ['general'],
        supportedPackageVersions: ['1.2.0'],
        requiresFreshData: true
      });

      const payload = buildContextPayload('test-fresh', {} as AppState);
      const generalPkg = payload.domainPackages?.find(p => p.domain === 'general');
      
      expect(generalPkg).toBeDefined();
      expect(generalPkg?.exposurePolicy).toBe('stale_blocked'); // Intercetado pela Bridge
      expect(generalPkg?.signals).toBeNull(); // Dados apagados
    });

    it('v1.5: permite stale se a app não requerer fresh data', () => {
      // NutriMenu não tem requiresFreshData (mas deixemos usar o general)
      const mockedCatalog = require('../../../miniapps/catalog');
      
      // Criamos um manifesto fake na lista
      mockedCatalog.MINI_APP_CATALOG.push({
        id: 'test-stale-allowed',
        consumedDomains: ['general'],
        supportedPackageVersions: ['1.2.0'],
        requiresFreshData: false
      });

      const payload = buildContextPayload('test-stale-allowed', {} as AppState);
      const generalPkg = payload.domainPackages?.find(p => p.domain === 'general');
      
      expect(generalPkg).toBeDefined();
      expect(generalPkg?.exposurePolicy).toBe('allowed'); // STALE tolerado
    });
  });

  describe('Auditoria de Governação (V1.6.0)', () => {
    it('regista no log omissão de domínios por catálogo e restrição temporal sem poluir UI principal', () => {
      buildContextPayload('test-fresh', {} as AppState);
      
      const log = getLastAuditLog('test-fresh');
      expect(log).toBeDefined();
      
      // Nutrição e Sono ignorados pq test-fresh só consumia general
      const nutritionLog = log!.packageDecisions.find(p => p.domain === 'nutrition');
      expect(nutritionLog?.reasonCode).toBe('DOMAIN_NOT_DECLARED');
      expect(nutritionLog?.policyApplied).toBeNull();
      
      // O General foi processado, mas por culpa das regras Freshness, tem de estar stale_blocked
      const generalLog = log!.packageDecisions.find(p => p.domain === 'general');
      expect(generalLog?.reasonCode).toBe('STALE_BLOCKED_BY_POLICY');
      expect(generalLog?.policyApplied).toBe('stale_blocked');

      // O test-fresh falso no teste acima não tem supportsCrossDomainSummary
      expect(log!.crossDomain.included).toBe(false);
      expect(log!.crossDomain.reasonCode).toBe('CROSS_DOMAIN_NOT_SUPPORTED');
    });

    it('identifica e preenche com precisão incompatibilidades de versão e sucesso em allowed', () => {
      // Mockamos a selectSleepDomainPackage temporalmente
      const mockedSelector = require('../../../store/selectors');
      mockedSelector.selectSleepDomainPackage.mockReturnValueOnce({ 
        domain: 'sleep', 
        packageVersion: '2.0.0', 
        exposurePolicy: 'allowed'
      });

      buildContextPayload('sleep-deep', {} as AppState);
      const log = getLastAuditLog('sleep-deep');

      const sleepLog = log!.packageDecisions.find(p => p.domain === 'sleep');
      expect(sleepLog?.reasonCode).toBe('PACKAGE_VERSION_UNSUPPORTED');
      expect(sleepLog?.policyApplied).toBe('unavailable');
    });
  });

});
