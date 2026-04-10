/**
 * TEST SCRATCH SCRIPT: M5 Slice 1 Persistence
 * Validates the PATCH /user/profile/active-analysis endpoint.
 */

async function testPersistence() {
  const BACKEND_URL = 'http://localhost:3000';
  
  // 1. LOGIN (simulando credenciais que existem no seed)
  console.log('--- 1. Login ---');
  const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user1@example.com',
      passwordHash: 'hashed_password_1' // Mudar se o seed usar outro
    })
  });

  const { token, user } = await loginRes.json();
  console.log('Login Succeeded. Token prefix:', token.substring(0, 10));
  console.log('Initial Active Analysis ID:', user.profile?.activeAnalysisId);

  // 2. UPDATE ACTIVE ANALYSIS
  const newId = '90f0d2c0-0000-0000-0000-000000000001'; // Mock UUID
  console.log(`\n--- 2. Update Active Analysis to ${newId} ---`);
  const patchRes = await fetch(`${BACKEND_URL}/user/profile/active-analysis`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ analysisId: newId })
  });

  console.log('PATCH Status:', patchRes.status);

  // 3. VERIFY VIA /auth/me
  console.log('\n--- 3. Verify via /auth/me ---');
  const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const meData = await meRes.json();
  console.log('Persisted Active Analysis ID:', meData.profile?.activeAnalysisId);

  if (meData.profile?.activeAnalysisId === newId) {
    console.log('\nSUCCESS: Persistence work verified!');
  } else {
    console.error('\nFAILURE: Persistence did not work as expected.');
  }
}

testPersistence();
