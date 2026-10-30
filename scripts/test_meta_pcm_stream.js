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
      console.log('Testing Realtime Audio streaming...');

      const sessionId = 'stream-' + crypto.randomUUID();
      const wsUrl = `wss://api.meta.ai/v1/asr/realtime?sessionId=${sessionId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WS OPENED. Sending handshake...');
        ws.send(JSON.stringify({
          authorization: { accessToken: `Bearer ${key.trim()}` },
          audioEncoding: 'PCM_16KHZ',
          model: 'muse-voice-transcribe-1.0',
          mode: 'PUSH_TO_TALK'
        }));
      };

      let interval = null;
      ws.onmessage = (event) => {
        console.log('WS MSG:', event.data);
        const data = JSON.parse(event.data);
        // Once handshake is acknowledged (sessionId received), stream 3 seconds of PCM audio
        if (data.sessionId && !interval) {
          console.log('Handshake OK! Starting PCM audio stream (4096 samples per 250ms)...');
          let count = 0;
          interval = setInterval(() => {
            count++;
            // 4096 samples of 16-bit PCM (silence or small noise)
            const pcm = Buffer.alloc(4096 * 2);
            ws.send(pcm);
            console.log(`Streamed chunk ${count}/10`);
            if (count >= 10) {
              clearInterval(interval);
              console.log('Finished streaming. Sending endStream...');
              ws.send(JSON.stringify({ type: 'endStream' }));
              setTimeout(() => {
                ws.close();
              }, 1000);
            }
          }, 250);
        }
      };

      ws.onerror = (err) => console.error('WS ERROR:', err.message || err);
      ws.onclose = (event) => console.log('WS CLOSED:', event.code, event.reason);

    } catch (e) {
      console.error('Error:', e);
    }
  });
});
req.write(payload);
req.end();
