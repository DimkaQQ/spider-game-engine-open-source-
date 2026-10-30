const http = require('http');

function evalInEngine(expr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      tool: 'eval',
      args: { expr }
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 9287,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function toggleFull() {
  const res = await evalInEngine(`
    (() => {
      // Find fullscreen button or trigger
      const fullBtn = document.querySelector('button[title*="fullscreen" i]') || 
                      document.querySelector('button[title*="Fullscreen" i]');
      if (fullBtn) {
        fullBtn.click();
        return 'Clicked button: ' + fullBtn.title;
      }
      return 'No fullscreen button found';
    })()
  `);
  console.log('Result:', res);
}

toggleFull();
