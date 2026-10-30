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
      
      // Generate a 1-second 16kHz mono WAV buffer
      const sampleRate = 16000;
      const numSamples = sampleRate * 1;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);
      const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      // Convert ArrayBuffer to Base64
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      const res = await window.spiderShell.transcribeWithMeta({
        apiKey: key,
        base64Audio,
        mimeType: 'audio/wav',
        audioEncoding: 'WAV'
      });

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
  res.on('end', () => console.log('End-to-End Test Result:', d));
});
req.write(payload);
req.end();
