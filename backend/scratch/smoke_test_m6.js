/**
 * SMOKE TEST: Milestone M6 Fatia 2
 * Validação ponta-a-ponta básica do ecossistema.
 * Uso: node smoke_test.js --url http://localhost:3000 --token <JWT_SUPABASE>
 */

const args = process.argv.slice(2);
const baseUrl = args.find(a => a.startsWith('--url'))?.split('=')[1] || 'http://localhost:3000';
const token = args.find(a => a.startsWith('--token'))?.split('=')[1];

async function runSmokeTests() {
  console.log('--- ABLUTE WELLNESS SMOKE TEST ---');
  console.log(`Target URL: ${baseUrl}`);
  console.log(`Auth Token provided: ${token ? 'Yes' : 'No'}`);

  const testResults = [];

  // 1. Health Ping
  testResults.push(await runTest('GET /health', `${baseUrl}/health`));

  // 2. Readiness Check
  testResults.push(await runTest('GET /ready', `${baseUrl}/health/ready`));

  // 3. Auth Me (Sem token -> deve dar 401)
  testResults.push(await runTest('GET /auth/me (unauthorized)', `${baseUrl}/auth/me`, null, 401));

  // 4. Fluxos Protegidos (Apenas se houver token)
  if (token) {
    testResults.push(await runTest('GET /auth/me (authorized)', `${baseUrl}/auth/me`, token));
    testResults.push(await runTest('GET /analyses (authorized)', `${baseUrl}/analyses`, token));
    
    // 5. Teste AI Gateway (Real/Dummy payload)
    testResults.push(await runTest('POST /ai-gateway/generate-insights', `${baseUrl}/ai-gateway/generate-insights`, token, 200, {
      method: 'POST',
      body: JSON.stringify({
        analysisId: 'demo-smoke-test',
        selectedDate: '2026-04-10',
        measurements: [{ type: 'urina', marker: 'ph', value: '7.0' }],
        events: [],
        isDemo: true // Importante: isDemo para não sujar BD
      })
    }));
  } else {
    console.warn('\n[Pulei os testes de Auth e AI por falta de token]');
  }

  console.log('\n--- SUMMARY ---');
  testResults.forEach(r => {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}: ${r.status}`);
  });
}

async function runTest(name, url, authToken = null, expectedStatus = 200, options = {}) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(url, { ...options, headers });
    const isOk = res.status === expectedStatus;
    
    return { name, ok: isOk, status: res.status };
  } catch (err) {
    return { name, ok: false, status: `ERROR: ${err.message}` };
  }
}

runSmokeTests();
