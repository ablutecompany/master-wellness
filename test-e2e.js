const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Captura erros de javascript/consola (incluindo React crash overlays)
  let runtimeErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      runtimeErrors.push(msg.text());
      console.log('[Browser Error Console]:', msg.text());
    }
  });
  page.on('pageerror', error => {
    runtimeErrors.push(error.message);
    console.log('[Browser PageError]:', error.message);
  });

  console.log('Navigating to local React Native App...');
  await page.goto('http://localhost:8084', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForTimeout(5000); // Give React Native Web 5s extra to hydrate and render fully

  // Verifica se o erro crashou
  if (runtimeErrors.some(e => e.includes('activeMemberId'))) {
    console.error('CRASH ENCONTRADO: activeMemberId');
    await browser.close();
    process.exit(1);
  }

  // Verifica se o body contém mensagens de erro de react nativo overlay
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  if (bodyHTML.includes('ReferenceError: activeMemberId is not defined') || bodyHTML.includes('activeMemberId')) {
    console.error('CRASH ENCONTRADO (OVERLAY): activeMemberId');
    await browser.close();
    process.exit(1);
  }

  console.log('App successfully loaded without activeMemberId crash!');
  await browser.close();
  process.exit(0);
})();
