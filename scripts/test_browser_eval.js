const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const code = localStorage.getItem('spider-active-jsx-code');
          if (!code) return 'No code in localStorage';
          // Try sucrase transform
          return {
            hasCode: true,
            codeLen: code.length,
            first100: code.slice(0, 100)
          };
        } catch(e) {
          return { err: e.message };
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
  res.on('end', () => console.log('Local storage test:', d));
});
req.write(payload);
req.end();
