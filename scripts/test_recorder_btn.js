const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const gameRec = btns.find(b => b.textContent.includes('Record Game'));
        const topRec = btns.find(b => b.textContent.includes('Record') && !b.textContent.includes('Record Game'));
        return {
          gameRecFound: Boolean(gameRec),
          gameRecText: gameRec ? gameRec.textContent.trim() : null,
          topRecFound: Boolean(topRec),
          topRecText: topRec ? topRec.textContent.trim() : null
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
  res.on('end', () => console.log('Button status:', d));
});
req.write(payload);
req.end();
