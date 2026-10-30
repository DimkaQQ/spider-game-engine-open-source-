const http = require('http');

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
  res.on('end', async () => {
    try {
      const resp = JSON.parse(d);
      const key = resp.result;
      console.log('Testing Meta API with key length:', key ? key.length : 0);

      // Create a tiny 1-second 16kHz mono WAV buffer (silence)
      const sampleRate = 16000;
      const numSamples = sampleRate * 1;
      const buffer = Buffer.alloc(44 + numSamples * 2);
      // RIFF identifier
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + numSamples * 2, 4);
      buffer.write('WAVE', 8);
      // format chunk
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20); // PCM
      buffer.writeUInt16LE(1, 22); // 1 channel
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28);
      buffer.writeUInt16LE(2, 32);
      buffer.writeUInt16LE(16, 34);
      // data chunk
      buffer.write('data', 36);
      buffer.writeUInt32LE(numSamples * 2, 40);

      // Now test fetch to https://api.meta.ai/v1/asr/transcribe
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('request', JSON.stringify({
        model: 'muse-voice-transcribe-1.0',
        audioEncoding: 'WAV',
        mode: 'PUSH_TO_TALK'
      }));
      formData.append('audio', blob, 'test.wav');

      const metaRes = await fetch('https://api.meta.ai/v1/asr/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.trim()}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      console.log('Status:', metaRes.status, metaRes.statusText);
      const text = await metaRes.text();
      console.log('Response body:', text);
    } catch (e) {
      console.error('Test error:', e);
    }
  });
});
req.write(payload);
req.end();
