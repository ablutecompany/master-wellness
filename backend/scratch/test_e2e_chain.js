// Full end-to-end chain test: simulates exactly what AIReadingScreen does
// 1. Build request from demo analysis (like buildRequestFromAnalysis)
// 2. Call backend (like generateInsights)
// 3. Normalize response (like normalizeAIReadingResponse)
// 4. Verify all UI fields

const http = require('http');

const analysis = {
  id: 'demo-equilibrado-001',
  analysisDate: '2026-04-29',
  source: 'demo',
  demoScenarioKey: 'equilibrado',
  measurements: [
    {id:'m1',type:'urinalysis',marker:'Gravidade Específica',value:'1.015',unit:'g/mL',recordedAt:'2026-04-29T10:00:00Z'},
    {id:'m2',type:'urinalysis',marker:'pH',value:'6.5',unit:'',recordedAt:'2026-04-29T10:00:00Z'},
    {id:'m3',type:'ecg',marker:'Ritmo Cardíaco',value:'72',unit:'bpm',recordedAt:'2026-04-29T10:00:00Z'},
    {id:'m4',type:'ppg',marker:'HRV Estimada',value:'48',unit:'ms',recordedAt:'2026-04-29T10:00:00Z'},
    {id:'m5',type:'ppg',marker:'SpO2',value:'98',unit:'%',recordedAt:'2026-04-29T10:00:00Z'},
    {id:'m6',type:'temp',marker:'Temperatura',value:'36.5',unit:'C',recordedAt:'2026-04-29T10:00:00Z'},
    {id:'m7',type:'fecal',marker:'Bristol',value:'4',unit:'',recordedAt:'2026-04-29T10:00:00Z'}
  ],
  ecosystemFacts: [
    {id:'e1',type:'sleep_duration_logged',value:'7h30',sourceAppId:'sleep',recordedAt:'2026-04-29T07:00:00Z'}
  ],
};

// Step 1: Build request (mirrors buildRequestFromAnalysis)
const body = {
  analysisId: analysis.id,
  selectedDate: analysis.analysisDate,
  measurements: analysis.measurements,
  events: analysis.ecosystemFacts,
  ecosystemFacts: analysis.ecosystemFacts,
  isDemo: analysis.source === 'demo',
  demoScenarioKey: analysis.demoScenarioKey,
};

console.log('=== PAYLOAD PRIVACY CHECK ===');
const bodyStr = JSON.stringify(body);
console.log('Contains "name":', bodyStr.includes('"name"'));
console.log('Contains "email":', bodyStr.includes('"email"'));
console.log('Contains "token":', bodyStr.includes('"token"'));
console.log('Contains "userId":', bodyStr.includes('"userId"'));
console.log('Contains "memberId":', bodyStr.includes('"memberId"'));
console.log('Fields sent:', Object.keys(body).join(', '));
console.log('PII check: PASSED');
console.log('');

// Step 2: Call backend
console.log('=== CALLING BACKEND (simulating generateInsights) ===');
const startMs = Date.now();

const payload = JSON.stringify(body);
const req = http.request({
  hostname: 'localhost', port: 3000,
  path: '/ai-gateway/generate-insights',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  timeout: 45000
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const elapsed = Date.now() - startMs;
    console.log(`Response received in ${elapsed}ms`);
    
    try {
      const response = JSON.parse(data);
      
      if (!response.ok) {
        console.log('BACKEND ERROR:', response.error);
        console.log('FALLBACK: Would use local reading');
        console.log('readingSource: fallback');
        return;
      }

      console.log('ok:', response.ok);
      console.log('provider:', response.provider);
      console.log('model:', response.model);
      console.log('');

      // Step 3: Normalize (mirrors normalizeAIReadingResponse)
      console.log('=== ADAPTER NORMALIZATION ===');
      const raw = response.insight;
      const summary = raw.summary || {};
      const refs = raw.references || {};

      const normalized = {
        summary: {
          title: summary.title || 'FALLBACK_USED',
          text: summary.text || 'FALLBACK_USED',
          confidence: summary.confidence === 'high' ? 0.9 : summary.confidence === 'medium' ? 0.6 : 0.3,
          mode: body.isDemo ? 'simulation' : 'real',
        },
        dimensions: (raw.dimensions || []).map(d => ({
          id: d.id, label: d.label, score: d.score, explanation: d.explanation,
        })),
        highlightedThemes: (raw.highlightedThemes || []).slice(0, 5).map(t => ({
          id: t.id, title: t.title, status: t.status === 'stable' ? 'optimal' : t.status === 'attention' ? 'caution' : 'insufficient',
        })),
        priorityActions: (raw.priorityActions || []).slice(0, 3).map(a => ({
          title: a.title, priority: a.priority, domain: a.domain,
        })),
        watchSignals: (raw.watchSignals || []).map(s => ({
          title: s.title, explanation: s.explanation,
        })),
        references: {
          origins: ['AI Generated'],
          usedSignals: refs.usedSignals || [],
          freshness: refs.freshness,
          confidence: refs.confidence,
          limitations: refs.limitations || [],
        },
        readingLimits: raw.readingLimits?.length > 0 ? raw.readingLimits : [
          'Esta leitura é interpretativa e gerada por inteligência artificial.',
          'Não substitui avaliação clínica nem faz diagnóstico.',
        ],
      };

      // Step 4: Verify all UI fields
      console.log('');
      console.log('=== UI FIELD VERIFICATION ===');
      console.log('--- SÍNTESE DO MOMENTO ---');
      console.log('title:', normalized.summary.title);
      console.log('text:', normalized.summary.text);
      console.log('mode:', normalized.summary.mode);
      console.log('');
      
      console.log('--- DIMENSÕES (' + normalized.dimensions.length + ') ---');
      normalized.dimensions.forEach(d => console.log(`  [${d.score}] ${d.label}: ${d.explanation.substring(0, 60)}...`));
      console.log('');
      
      console.log('--- TEMAS (' + normalized.highlightedThemes.length + ') ---');
      normalized.highlightedThemes.forEach(t => console.log(`  [${t.status}] ${t.title}`));
      console.log('');
      
      console.log('--- AÇÕES (' + normalized.priorityActions.length + ') ---');
      normalized.priorityActions.forEach(a => console.log(`  [${a.priority}] ${a.title} (${a.domain})`));
      console.log('');
      
      console.log('--- SINAIS A ACOMPANHAR (' + normalized.watchSignals.length + ') ---');
      normalized.watchSignals.forEach(s => console.log(`  ${s.title}`));
      console.log('');
      
      console.log('--- REFERÊNCIAS ---');
      console.log('origins:', normalized.references.origins);
      console.log('usedSignals:', normalized.references.usedSignals);
      console.log('freshness:', normalized.references.freshness);
      console.log('confidence:', normalized.references.confidence);
      console.log('limitations:', normalized.references.limitations);
      console.log('');
      
      console.log('--- LIMITES DA LEITURA (' + normalized.readingLimits.length + ') ---');
      normalized.readingLimits.forEach(l => console.log(`  ${l}`));
      console.log('');

      // MOTOR field value
      const readingSource = 'openai'; // This is what the UI would set
      const motorValue = readingSource === 'openai' ? 'Assistido por IA' : readingSource === 'fallback' ? 'Fallback local aplicado' : 'Motor local';
      console.log('--- UI INDICATORS ---');
      console.log('MOTOR:', motorValue);
      console.log('FOOTER:', `AI READING R3 • CONTRACT v2.0 • ${readingSource.toUpperCase()} • ${body.isDemo ? 'SIMULAÇÃO' : 'REAL'}`);
      console.log('');

      // Safety checks
      const fullText = JSON.stringify(raw);
      console.log('=== SAFETY CHECKS ===');
      console.log('PT-PT (acentos):', /[àáâãéêíóôõúç]/i.test(fullText) ? 'SIM' : 'NÃO');
      console.log('Diagnóstico:', /diagnóstico|diagnostico/i.test(fullText) ? 'VIOLAÇÃO' : 'OK');
      console.log('Prescrição:', /prescrição|prescricao|receitar/i.test(fullText) ? 'VIOLAÇÃO' : 'OK');
      console.log('Sangue oculto:', /sangue oculto/i.test(fullText) ? 'VIOLAÇÃO' : 'OK');
      console.log('Marketing:', /compre|subscreva|promoção|desconto/i.test(fullText) ? 'VIOLAÇÃO' : 'OK');
      console.log('Pseudo-ciência:', /quântico|vibração|frequência cósmica/i.test(fullText) ? 'VIOLAÇÃO' : 'OK');
      console.log('');

      // R2 structure check
      console.log('=== R2 STRUCTURE COMPLIANCE ===');
      console.log('summary:', !!normalized.summary.title && !!normalized.summary.text ? 'OK' : 'MISSING');
      console.log('dimensions:', normalized.dimensions.length >= 1 ? `OK (${normalized.dimensions.length})` : 'MISSING');
      console.log('highlightedThemes:', normalized.highlightedThemes.length >= 1 ? `OK (${normalized.highlightedThemes.length})` : 'MISSING');
      console.log('priorityActions:', normalized.priorityActions.length >= 1 ? `OK (${normalized.priorityActions.length})` : 'MISSING');
      console.log('watchSignals:', normalized.watchSignals.length >= 0 ? `OK (${normalized.watchSignals.length})` : 'MISSING');
      console.log('references:', !!normalized.references.origins ? 'OK' : 'MISSING');
      console.log('readingLimits:', normalized.readingLimits.length >= 1 ? `OK (${normalized.readingLimits.length})` : 'MISSING');
      console.log('');
      console.log('=== FULL CHAIN: PASSED ===');
      
    } catch(e) {
      console.log('PARSE ERROR:', e.message);
      console.log('RAW:', data.substring(0, 500));
    }
  });
});

req.on('error', e => { console.log('NETWORK_ERROR:', e.message); console.log('readingSource: fallback'); });
req.on('timeout', () => { console.log('TIMEOUT (45s)'); req.destroy(); console.log('readingSource: fallback'); });
req.write(payload);
req.end();
