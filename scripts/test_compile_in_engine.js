const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          // Find if DynamicJsxRenderer or compileJsxComponent is on window or test with sucrase
          const code = localStorage.getItem('spider-active-jsx-code');
          const res = window.spiderEngine.tool('check3DView', {});
          return res;
        } catch(e) {
          return { err: e.message, stack: e.stack };
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
  res.on('end', () => console.log('check3DView result:', d));
});
req.write(payload);
req.end();
