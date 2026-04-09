const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log("=== VALID MINIMAL ===");
  const valid = await post('http://localhost:3000/ai-gateway/generate-insights', {
    analysisId:"123",selectedDate:"2023-10-01",measurements:[],events:[],ecosystemFacts:[],isDemo:false
  });
  console.log(valid.body);

  console.log("=== DEMO VALID ===");
  const demo = await post('http://localhost:3000/ai-gateway/generate-insights', {
    analysisId:"demo-123",selectedDate:"2023-10-01",measurements:[],events:[],ecosystemFacts:[],isDemo:true
  });
  console.log(demo.body);

  console.log("=== INVALID DTO ===");
  const invalid = await post('http://localhost:3000/ai-gateway/generate-insights', {
    userId: "test" 
  });
  console.log(invalid.body);
}

run().catch(console.error);
