const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      // 1. Stop any current speech
      if (window.spiderShell?.stopSpeechRecognition) {
        await window.spiderShell.stopSpeechRecognition();
      }

      // 2. Clear input
      const ta = document.querySelector('textarea');
      if (ta) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, '');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 3. Start speech
      const res = await window.spiderShell.startSpeechRecognition();

      // 4. Record values over the next 3 seconds
      const history = [];
      const startTime = Date.now();
      while (Date.now() - startTime < 3500) {
        await new Promise(r => setTimeout(r, 400));
        history.push({
          timeMs: Date.now() - startTime,
          val: ta ? ta.value : ''
        });
      }

      // 5. Stop
      await window.spiderShell.stopSpeechRecognition();

      return JSON.stringify({ startRes: res, history });
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
  res.on('end', () => console.log('Live stream test result:', d));
});
req.write(payload);
req.end();
