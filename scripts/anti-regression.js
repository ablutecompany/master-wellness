const fs = require('fs');
const path = require('path');

console.log('🛡️  A verificar Política Anti-Regressão na codebase...');

const FORBIDDEN_TOKENS = [
  'LanguageEngine',
  'DecisionEngine',
  'OrbitalCarousel',
  'ThemesCarousel',
  'store/slices/insights',
  'derivedContext'
];

function checkDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDirectory(fullPath);
    } else {
      // Analisar apenas source files, ignorar fixtures Json, markdowns, e testes nativos estendidos
      if ((fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) 
          && !fullPath.endsWith('.test.ts') 
          && !fullPath.endsWith('.test.tsx')
          && !fullPath.includes('anti-regression.js')
          && !fullPath.includes('schema-validators.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const token of FORBIDDEN_TOKENS) {
          if (content.includes(token)) {
            console.error(`❌ REGRESSÃO DETETADA: O ficheiro de runtime ${fullPath} importou ou invocou o componente banido '${token}'.`);
            process.exit(1);
          }
        }
      }
    }
  }
}

checkDirectory('./src');
console.log('✅ Pipeline Clear: Nenhuma regressão legacy detetada via imports ressuscitados.');
process.exit(0);
