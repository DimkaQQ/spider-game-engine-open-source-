const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      const res = {
        hasSpiderShell: !!window.spiderShell,
        hasTranscribeWithMeta: typeof window.spiderShell?.transcribeWithMeta === 'function',
        platform: window.spiderShell?.platform
      };
      if (window.spiderShell?.transcribeWithMeta) {
        // Test calling transcribeWithMeta with empty audio
        const r = await window.spiderShell.transcribeWithMeta({
          apiKey: '',
          base64Audio: ''
        });
        res.testCallResult = r;
      }
      return JSON.stringify(res);
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
  res.on('end', () => console.log('Result:', d));
});
req.write(payload);
req.end();
