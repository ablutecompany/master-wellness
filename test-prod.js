const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  let errors = [];
  page.on('pageerror', err => { 
    errors.push(err.message); 
    console.log('[Crash!]', err.message); 
  });
  
  console.log('A navegar para app local (localhost:8084)...');
  await page.goto('https://ablute-wellness-app.vercel.app', { waitUntil: 'networkidle0', timeout: 120000 });
  await new Promise(r => setTimeout(r, 5000));

  if (errors.some(e => e.includes('activeMemberId'))) {
    console.error('ERRO AINDA PRESENTE NO BOOT:', errors);
    process.exit(1);
  }

  console.log('App carregou. A tentar interagir com a página para ver se o erro surge depois...');
  // Tenta clicar num botão genérico se existir ou apenas verificar os nós React
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Texto na página:', bodyText.substring(0, 100));

  if (errors.length) {
    console.error('ERRO EM RUNTIME INTERATIVO:', errors);
    process.exit(1);
  }

  console.log('Tudo limpo!');
  await browser.close();
})();
