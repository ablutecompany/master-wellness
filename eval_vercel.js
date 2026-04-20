const https = require('https');

https.get('https://ablute-wellness-itayvl88n-ablutecompanys-projects.vercel.app/', (res) => {
  let data = '';
  res.on('data', (d) => { data += d; });
  res.on('end', () => {
    const match = data.match(/<script.*?src="([^"]+\.js[^"]*)"/);
    if (match) {
      const jsUrl = match[1].startsWith('http') ? match[1] : 'https://ablute-wellness-itayvl88n-ablutecompanys-projects.vercel.app' + match[1];
      console.log('Fetching JS:', jsUrl);
      https.get(jsUrl, (jsRes) => {
        let jsData = '';
        jsRes.on('data', (d) => { jsData += d; });
        jsRes.on('end', () => {
          const idx = jsData.indexOf('SynthesisActionCard');
          if (idx !== -1) {
            console.log(jsData.substring(idx - 150, idx + 500));
          } else {
            console.log('SynthesisActionCard not found in JS bundle');
          }
        });
      });
    } else {
      console.log('No script tag found');
    }
  });
});
