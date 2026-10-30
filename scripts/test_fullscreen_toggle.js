const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const fsBtn = btns.find(b => b.title && b.title.includes('Fullscreen'));
        const isDomFs = Boolean(document.fullscreenElement);
        return {
          fsBtnFound: Boolean(fsBtn),
          title: fsBtn?.title,
          isDomFs
        };
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
  res.on('end', () => console.log('Fullscreen test:', d));
});
req.write(payload);
req.end();
