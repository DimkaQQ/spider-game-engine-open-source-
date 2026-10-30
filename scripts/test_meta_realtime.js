const http = require('http');
const crypto = require('crypto');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      let key = localStorage.getItem('spider-meta-key-raw');
      if (!key && window.spiderShell?.decryptString) {
        const c = localStorage.getItem('spider-meta-key');
        if (c) {
          const r = await window.spiderShell.decryptString(c);
          key = r?.plain?.result || r?.plain;
        }
      }
      return key || '';
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
  res.on('end', () => {
    try {
      const resp = JSON.parse(d);
      const key = resp.result;
      console.log('Testing Realtime WebSocket with key length:', key ? key.length : 0);

      const sessionId = 'stream-' + crypto.randomUUID();
      const wsUrl = `wss://api.meta.ai/v1/asr/realtime?sessionId=${sessionId}`;
      console.log('Connecting to:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WS OPENED! Sending handshake frame...');
        const handshake = {
          authorization: {
            accessToken: `Bearer ${key.trim()}`
          },
          audioEncoding: 'PCM_16KHZ',
          model: 'muse-voice-transcribe-1.0',
          mode: 'PUSH_TO_TALK'
        };
        ws.send(JSON.stringify(handshake));
      };

      ws.onmessage = (event) => {
        console.log('WS MSG RECEIVED:', event.data);
      };

      ws.onerror = (err) => {
        console.error('WS ERROR:', err.message || err);
      };

      ws.onclose = (event) => {
        console.log('WS CLOSED:', event.code, event.reason);
      };

      setTimeout(() => {
        console.log('Closing WS test after 5s...');
        ws.close();
      }, 5000);

    } catch (e) {
      console.error('Script error:', e);
    }
  });
});
req.write(payload);
req.end();
