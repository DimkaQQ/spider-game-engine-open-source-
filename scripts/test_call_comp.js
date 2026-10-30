const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          // Let's test calling GameComponent as a function
          const code = localStorage.getItem('spider-active-jsx-code');
          // Read window.__lastDynamicJsxError
          return {
            lastErr: window.__lastDynamicJsxError
          };
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
  res.on('end', () => console.log('Err check:', d));
});
req.write(payload);
req.end();
