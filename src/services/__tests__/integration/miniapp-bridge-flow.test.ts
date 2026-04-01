import { buildContextPayload } from '../../miniapp-context/index';
import { AppState } from '../../../store/types';

// Mockamos estritamente a AppStore Native já no ponto em que o Selector
// cospe os dados brutos e as permissões ativas.
jest.mock('../../../store/selectors', () => ({
  selectAppPermissions: jest.fn().mockImplementation((state, appId) => ['SLEEP_DATA_READ']),
  selectUser: jest.fn(),
  selectMeasurements: jest.fn().mockReturnValue([]),
  
  // Sleep: Permitido e populado
  selectSleepDomainPackage: jest.fn().mockReturnValue({ 
    domain: 'sleep',
    packageVersion: '1.2.0',
    exposurePolicy: 'allowed', 
    signals: { score: 90 }, 
    facts: [{ id: 1 }] 
  }),
  
  // Nutrição: Sem dados, mas com permissão teórica (Unavailable)
  selectNutritionDomainPackage: jest.fn().mockReturnValue({ 
    domain: 'nutrition',
    packageVersion: '1.2.0',
    exposurePolicy: 'unavailable', 
    signals: {}, 
    facts: [] 
  }),
  
  // General: Utilizador não permitiu (Denied)
  selectGeneralWellnessPackage: jest.fn().mockReturnValue({ 
    domain: 'general',
    packageVersion: '1.2.0',
    exposurePolicy: 'denied', 
    signals: {}, 
    facts: [] 
  })
}));

describe('Integration Flow: Mini-App Bridge & Contrato', () => {

  it('o adapter de Contexto constrói apenas pacotes permitidos ou ausentes no array, removendo ativamente negados', () => {
    // 1. O container Webview solicita o estado corrente da Native Store
    const fakeStore = {} as AppState;
    const payload = buildContextPayload('test-sleep-app', fakeStore);

    // 2. A Ponte consolida e formata via contracto DomainPackages 
    expect(payload).toHaveProperty('domainPackages');
    const pkgs = payload.domainPackages;

    // A ponte retira pro-activamente pacotes denied para garantir opacidade
    expect(pkgs!.length).toBe(2); 

    const sleep = pkgs!.find(p => p.domain === 'sleep');
    const nutrition = pkgs!.find(p => p.domain === 'nutrition');
    const general = pkgs!.find(p => p.domain === 'general');

    // 3. Validação de Flow Activo no Runtime
    // Sleep foi perfeitamente mapeado
    expect(sleep?.exposurePolicy).toBe('allowed');
    expect(sleep?.signals.score).toBe(90);
    
    // Nutrition exposto mas 'unavailable'
    expect(nutrition?.exposurePolicy).toBe('unavailable');
    
    // General expurgado na nascença
    expect(general).toBeUndefined();
    
    // 4. Segurança Absoluta Anti-Legacy (Asserção Runtime)
    expect('derivedContext' in payload).toBe(false);
  });

});
