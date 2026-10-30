const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const c = document.querySelector('canvas');
          if (!c) return { err: 'No canvas found' };
          const ctx = c.getContext('2d');
          const p = ctx.getImageData(100, 100, 1, 1).data;
          return { pixel: Array.from(p) };
        } catch(e) {
          return { error: e.message, stack: e.stack };
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
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('Sampled result:', d));
});
req.write(payload);
req.end();
