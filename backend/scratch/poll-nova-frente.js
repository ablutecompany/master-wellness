const fetch = require('node-fetch');
async function poll() {
  let attempts = 0;
  while (attempts < 60) {
    attempts++;
    try {
      const res = await fetch('https://ablute-wellness-backend.onrender.com/health/ready');
      const text = await res.text();
      if (text.includes('NOVA_FRENTE')) {
        console.log('\n\n!!! SWAPPED CONTAINER DETECTED - NOVA FRENTE !!!');
        console.log('BODY:', text);
        process.exit(0);
      } else {
        process.stdout.write('.');
      }
    } catch(err) {
      process.stdout.write('E');
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log('\nTIMEOUT');
  process.exit(1);
}
poll();
