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

async function testWalk() {
  console.log('Simulating W key hold to walk forward...');
  await evalInEngine(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      return 'Dispatched keydown w';
    })()
  `);

  await new Promise(r => setTimeout(r, 3000)); // walk forward for 3s

  const pos = await evalInEngine(`
    (() => {
      const zText = document.querySelector('.text-amber-400')?.textContent || 'unknown';
      const distText = document.querySelector('.text-cyan-300')?.textContent || 'unknown';
      return { zText, distText };
    })()
  `);
  console.log('Player position after walking:', pos);

  await evalInEngine(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
      return 'Dispatched keyup w';
    })()
  `);
}

testWalk();
