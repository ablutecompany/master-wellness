// @ts-nocheck
import { Analysis } from '../store/types';

/**
 * SNAPSHOT DETERMINÍSTICO PARA MODO DEMO
 * Centralizado para evitar recriação de objetos no render.
 * Timestamp fixo: 1714172400000 (26 Abr 2024)
 */
export const DEMO_ANALYSIS_SNAPSHOT: Analysis = {
  id: 'demo-analysis-v2',
  memberId: 'demo-member-001',
  label: 'Cenário Simulado: Performance Total',
  analysisDate: new Date(1714172400000).toISOString(),
  source: 'demo',
  demoScenarioKey: 'balanced',
  measurements: [
    // --- URINA ---
    { id: 'dm1', type: 'urinalysis', marker: 'Glicose', value: 'Negativo', unit: '', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm2', type: 'urinalysis', marker: 'pH Urinário', value: '6.5', unit: 'pH', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm3', type: 'urinalysis', marker: 'Densidade', value: '1.018', unit: 'g/cm³', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm4', type: 'urinalysis', marker: 'Nitritos', value: 'Negativo', unit: '', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm5', type: 'urinalysis', marker: 'Sódio', value: '138', unit: 'mEq/L', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm6', type: 'urinalysis', marker: 'Potássio', value: '4.2', unit: 'mEq/L', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm7', type: 'urinalysis', marker: 'Creatinina', value: '1.2', unit: 'g/L', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm8', type: 'urinalysis', marker: 'Albumina', value: 'Negativo', unit: '', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },

    // --- FEZES ---
    { id: 'dm10', type: 'fecal', marker: 'Bristol', value: 'Tipo 4', unit: 'Ideal', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm11', type: 'fecal', marker: 'Regularidade', value: 'Elevada', unit: '', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm12', type: 'fecal', marker: 'Caracterização Óptica', value: 'ligeiramente seca', unit: '', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm13', type: 'fecal', marker: 'Caracterização Óptica Completa', value: {
        bristol: 'Tipo 4',
        consistencia: 'Normal',
        forma: 'Salsicha',
        superficie: 'Lisa',
        cor: 'Castanho',
        fragmentacao: 'Baixa',
        mucoVisivel: 'Não observado',
        sangueVisivel: 'Não observado',
        aspetoGorduroso: 'Não observado',
        interpretacaoWellness: 'Trânsito intestinal regular, adequada hidratação.',
        confiancaImagem: 'Alta'
      }, unit: '', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },

    // --- FISIOLÓGICOS ---
    { id: 'dm20', type: 'ecg', marker: 'Ritmo Cardíaco', value: '72', unit: 'bpm', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm21', type: 'ppg', marker: 'SpO2', value: '99', unit: '%', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm22', type: 'temp', marker: 'Temperatura', value: '36.6', unit: '°C', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm23', type: 'weight', marker: 'Peso Corporal', value: '74.2', unit: 'kg', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
    { id: 'dm24', type: 'impedance', marker: 'Gordura Corporal', value: '18.4', unit: '%', recordedAt: '2024-04-26T23:00:00Z', timestamp: 1714172400000 },
  ],
  ecosystemFacts: [
    { id: 'df1', type: 'sleep_duration_logged', value: '7h 30m', recordedAt: '2024-04-26T23:00:00Z', domain: 'sleep', sourceAppId: 'sleep_app' },
    { id: 'df2', type: 'recovery_score', value: '88%', recordedAt: '2024-04-26T23:00:00Z', domain: 'recovery', sourceAppId: 'recovery_app' },
    { id: 'df3', type: 'daily_steps', value: '10.240', recordedAt: '2024-04-26T23:00:00Z', domain: 'activity', sourceAppId: 'motion_app' },
    { id: 'df4', type: 'water_intake', value: '2.1L', recordedAt: '2024-04-26T23:00:00Z', domain: 'nutrition', sourceAppId: 'meal_planner' },
    { id: 'df5', type: 'stress_pattern', value: 'Baixo', recordedAt: '2024-04-26T23:00:00Z', domain: 'mind', sourceAppId: 'introspect' },
  ],
  createdAt: new Date(1714172400000).toISOString(),
};
