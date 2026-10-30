const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const micBtn = buttons.find(b => b.title?.includes('Muse Transcriber'));
      if (micBtn) {
        micBtn.click();
        await new Promise(r => setTimeout(r, 600));
        return JSON.stringify({
          clicked: true,
          isListening: !!document.querySelector('.muse-wave-bar'),
          statusText: document.querySelector('span.text-red-500')?.innerText
        });
      }
      return JSON.stringify({ clicked: false });
    })()`
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
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => console.log('Async Click result:', d));
});
req.write(payload);
req.end();
