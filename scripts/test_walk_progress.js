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
  console.log('Holding W to walk forward 3 seconds...');
  await evalInEngine(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      return 'Walking forward...';
    })()
  `);

  await new Promise(r => setTimeout(r, 3000));

  const status = await evalInEngine(`
    (() => {
      const zText = document.querySelector('.text-amber-400')?.textContent;
      const distBadge = document.querySelector('.text-cyan-300')?.textContent;
      return { zText, distBadge };
    })()
  `);
  console.log('Status after walking 3s:', status);

  await evalInEngine(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
      return 'Released W';
    })()
  `);
}

testWalk();
