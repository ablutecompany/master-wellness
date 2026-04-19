const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  // Sign in or sign up
  const email = 'audit_render_1@ablute.com';
  const password = 'TestPassword123!';
  
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes('Invalid login')) {
      const res = await supabase.auth.signUp({ email, password });
      data = res.data;
      error = res.error;
    } else {
      console.error('Auth Error:', error.message);
      return;
    }
  }

  if (error || !data.session) {
    console.error('Failed to get session:', error?.message);
    return;
  }

  const token = data.session.access_token;
  console.log('JWT Retrieved! length:', token.length);

  try {
    const res = await fetch('https://ablute-wellness-backend.onrender.com/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: 'Audit Render', goals: ['testing'] })
    });

    const status = res.status;
    const body = await res.text();
    console.log('\n--- PATCH RESULT ---');
    console.log('Status Code:', status);
    console.log('Body Exato:', body);
  } catch (e) {
    console.error('Request failed:', e.message);
  }
}

run();
