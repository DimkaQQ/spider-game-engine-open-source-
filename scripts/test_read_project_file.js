const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (async () => {
        try {
          if (!window.spiderShell?.readProjectFile) return 'no readProjectFile';
          const res = await window.spiderShell.readProjectFile('src/game', 'GameComponent.jsx');
          return { ok: res.ok, len: res.content?.length };
        } catch(e) {
          return { error: e.message };
        }
      })()
    `
  }
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
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('readProjectFile result:', d));
});
req.write(payload);
req.end();
