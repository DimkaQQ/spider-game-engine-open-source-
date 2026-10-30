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

async function run() {
  const res = await evalInEngine(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fullBtn = btns.find(b => b.title === 'Fullscreen Mode' || b.getAttribute('title') === 'Fullscreen Mode');
      if (fullBtn) {
        fullBtn.click();
        return 'Clicked Fullscreen Mode!';
      }
      return 'Fullscreen Mode button not found, available: ' + btns.map(b => b.title).filter(Boolean).join(', ');
    })()
  `);
  console.log('Result:', res);
}

run();
