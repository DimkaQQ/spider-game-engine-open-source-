const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          // Check if there is any error in compileJsxComponent
          const code = localStorage.getItem('spider-active-jsx-code');
          if (!code) return 'no code';
          // Use sucrase from window
          const sucrase = window.sucrase || window.Sucrase;
          return {
            hasSucrase: !!sucrase,
            hasReact: !!window.React
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
  res.on('end', () => console.log('Compile detail:', d));
});
req.write(payload);
req.end();
