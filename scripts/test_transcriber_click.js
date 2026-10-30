const http = require('http');
const fs = require('fs');

function evalInEngine(expr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ tool: 'eval', args: { expr } });
    const req = http.request({
      hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}

async function run() {
  const clickRes = await evalInEngine(`
    (() => {
      const micBtn = document.querySelector('button[title*="Muse Voice Transcriber"]');
      if (micBtn) {
        micBtn.click();
        return { ok: true, clicked: true };
      }
      return { ok: false };
    })()
  `);
  console.log("Mic click:", clickRes);

  await new Promise(r => setTimeout(r, 600));

  // Check if listening banner is visible
  const statusRes = await evalInEngine(`
    (() => {
      const banner = document.querySelector('.muse-wave-bar');
      return { hasWaveBar: !!banner };
    })()
  `);
  console.log("Wave bar status:", statusRes);

  // Capture screenshot showing wave animation and blender card
  const payload = JSON.stringify({ tool: 'captureWindow', args: {} });
  const req = http.request({
    hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  }, res => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => {
      try {
        const json = JSON.parse(d);
        if (json.ok && json.result?.dataUrl) {
          const b64 = json.result.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
          const outPath = 'C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg';
          fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
          console.log('Saved screenshot with wave banner to:', outPath);
        }
      } catch(e) { console.error(e); }
    });
  });
  req.write(payload); req.end();
}

run();
