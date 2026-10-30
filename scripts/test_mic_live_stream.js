const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      // Find the mic button in the chat input
      const buttons = Array.from(document.querySelectorAll('button'));
      const micBtn = buttons.find(b => b.querySelector('svg.lucide-mic') || b.querySelector('svg.lucide-mic-off') || b.title?.includes('Microphone') || b.title?.includes('Voice'));
      
      const beforeClick = {
        foundMicBtn: !!micBtn,
        title: micBtn ? micBtn.title : null
      };

      // Click the mic button to start listening
      if (micBtn) {
        micBtn.click();
      }

      return JSON.stringify({
        beforeClick,
        isTranscribingAfterClick: !!document.querySelector('.muse-wave-bar')
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
  res.on('end', () => console.log('Test result:', d));
});
req.write(payload);
req.end();
