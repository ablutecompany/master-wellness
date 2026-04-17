/**
 * create-test-user.js
 * Creates a confirmed test user via Supabase Admin API.
 * Requires SUPABASE_SERVICE_KEY environment variable.
 * Usage: node scripts/create-test-user.js
 */
const SUPABASE_URL = 'https://wyddxokuugxwwigzvoja.supabase.co';
const EMAIL = 'testauth_final@ablute.com';
const PASSWORD = 'TestAblute123!';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY env var is required.');
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

async function createUser() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true, // Automatically confirm the email
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('FAILED:', res.status, JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('SUCCESS: User created and confirmed.');
  console.log('UID:', data.id);
  console.log('Email:', data.email);
  console.log('Email confirmed:', data.email_confirmed_at);
  console.log('');
  console.log('You can now login with:');
  console.log('  Email:', EMAIL);
  console.log('  Password:', PASSWORD);
}

createUser().catch(err => {
  console.error('NETWORK ERROR:', err.message);
  process.exit(1);
});
