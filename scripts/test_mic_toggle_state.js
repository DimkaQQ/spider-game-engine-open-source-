const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      const getBtn = () => Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Muse Transcriber'));
      const isListening = () => !!document.querySelector('.muse-wave-bar') || !!document.querySelector('span.text-red-500');

      const initialListening = isListening();
      const btn = getBtn();
      if (!btn) return 'btn not found';

      // Click to toggle
      btn.click();
      await new Promise(r => setTimeout(r, 600));

      const afterFirstClick = isListening();

      return JSON.stringify({
        initialListening,
        afterFirstClick
      });
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
  res.on('end', () => console.log('Toggle result:', d));
});
req.write(payload);
req.end();
