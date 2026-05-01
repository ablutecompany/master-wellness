import { computeAIReadingFromData } from './src/services/semantic-output/ai-reading-engine';
import { DEMO_BIOMARKER_PERSONAS, generateDemoAnalysisFromPersona } from './src/data/demo-scenarios';

const personasToTest = [
  'balanced_recovered',
  'recovery_low_stress_high',
  'concentrated_dehydration'
];

function runTests() {
  console.log('--- TESTE MOTOR DE SCORING V2 ---');

  for (const key of personasToTest) {
    const persona = DEMO_BIOMARKER_PERSONAS.find(p => p.id === key);
    if (!persona) {
      console.log(`Persona ${key} não encontrada. Saltando.`);
      continue;
    }

    const analysis = generateDemoAnalysisFromPersona(persona);
    const reading = computeAIReadingFromData(analysis.measurements, analysis.ecosystemFacts, true);
    
    console.log(`\n\n=== RESULTADOS: ${key.toUpperCase()} ===`);
    console.log(`Resumo: ${reading.summary.title}`);
    
    let default50count = 0;
    
    reading.dimensions.forEach(d => {
      console.log(`  - ${d.title} (ID: ${d.id}):`);
      console.log(`      Score: ${d.score} | Confiança: ${d.confidence}`);
      console.log(`      Resumo: ${d.summary}`);
      console.log(`      Drivers: ${d.topDrivers.length}`);
      console.log(`      Recomendações: ${d.recommendations?.length}`);
      console.log(`      Referências: ${d.references?.length}`);
      if (d.score === 50) default50count++;
    });

    const nextFocus = reading.dimensions.find(d => d.id === 'next_focus');
    console.log(`\n  >> AURA COLOR: ${nextFocus?.color}`);
    console.log(`  >> FALLBACK 50 DETETADOS: ${default50count}`);
  }
}

runTests();
