import { computeAIReadingFromData } from './src/services/semantic-output/ai-reading-engine';

const measurements: any[] = [
  { type: 'urinalysis', marker: 'Sódio Urinário', value: 126 },
  { type: 'urinalysis', marker: 'Rácio Na/K', value: 3.8 },
  { type: 'urinalysis', marker: 'Densidade Urinária', value: 1.030 },
  { type: 'ecg', marker: 'Frequência cardíaca', value: 60 }
];

const reading = computeAIReadingFromData(measurements, [], false);

console.log('--- TEST: SODIUM URINARY = 126 ---');
console.log('Next Focus:', reading.nextFocus);
const eq = reading.dimensions.find(d => d.id === 'internal_balance');
console.log('Equilíbrio Interno Score:', eq?.score, eq?.status);
console.log('Eq Refs:', eq?.references);

const nut = reading.dimensions.find(d => d.id === 'food_adjustments');
console.log('Ajustes Alimentares Score:', nut?.score, nut?.status);
console.log('Nut Refs:', nut?.references);

const measurements2: any[] = [
  { type: 'ecg', marker: 'Frequência cardíaca', value: 95 },
  { type: 'ppg', marker: 'SpO2', value: 98 },
  { type: 'urinalysis', marker: 'Densidade Urinária', value: 1.015 }
];
const facts: any[] = [
  { type: 'Sono', value: '4:55' },
  { type: 'Stress', value: 85 },
  { type: 'Recuperação', value: 37 }
];

const reading2 = computeAIReadingFromData(measurements2, facts, false);
console.log('\n--- TEST: LOW SLEEP / LOAD ---');
console.log('Next Focus:', reading2.nextFocus);
const rec = reading2.dimensions.find(d => d.id === 'recovery');
console.log('Recovery Refs:', rec?.references);
