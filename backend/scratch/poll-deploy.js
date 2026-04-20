const fetch = require('node-fetch');

async function poll() {
  const creds = { email: 'agenttest@wellness.com', password: 'Password123!' };
  const authUrl = 'https://wyddxokuugxwwigzvoja.supabase.co/auth/v1/token?grant_type=password';
  const headers = {
    'apikey': process.env.SUPABASE_ANON_KEY || 'sb_publishable_iDR3vnWa3HY7AV0KlCJVOQ_aE9WcEUe',
    'Content-Type': 'application/json'
  };

  const res = await fetch(authUrl, { method: 'POST', headers, body: JSON.stringify(creds) });
  const data = await res.json();
  const token = data.access_token;

  for (let i = 0; i < 6; i++) {
    const initRes = await fetch('https://ablute-wellness-backend.onrender.com/auth/initialize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ displayName: 'Teste Persist Real FINAL' })
    });
    
    const text = await initRes.text();
    
    if (!text.includes('statusCode":500')) {
      console.log('SWAPPED CONTAINER DETECTED!');
      console.log(text);
      return;
    }
    
    console.log('. ');
    await new Promise(r => setTimeout(r, 10000));
  }
  
  console.log('Timeout.');
}

poll();
