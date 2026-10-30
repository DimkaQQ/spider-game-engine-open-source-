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
  console.log('1. Walking forward to terminal...');
  await evalInEngine(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      return 'Walking...';
    })()
  `);

  await new Promise(r => setTimeout(r, 2600));

  await evalInEngine(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
      return 'Stopped walking';
    })()
  `);

  await new Promise(r => setTimeout(r, 400));

  console.log('2. Pressing F to interact...');
  const res = await evalInEngine(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      return 'Pressed F';
    })()
  `);
  console.log('Interact result:', res);
}

run();
