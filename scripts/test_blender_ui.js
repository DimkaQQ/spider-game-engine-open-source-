const http = require('http');
const fs = require('fs');

function evalInEngine(expr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ tool: 'eval', args: { expr } });
    const req = http.request({
      hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log("Opening Ask AI panel...");
  const clickRes = await evalInEngine(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const askBtn = btns.find(b => (b.innerText || b.textContent || '').trim() === 'Ask AI');
      if (askBtn) {
        askBtn.click();
        return { ok: true, clicked: true };
      }
      return { ok: false, error: 'Ask AI button not found' };
    })()
  `);
  console.log("Click result:", clickRes);

  await new Promise(r => setTimeout(r, 800));

  // Type /blender and submit
  const submitRes = await evalInEngine(`
    (() => {
      const tas = Array.from(document.querySelectorAll('textarea'));
      const chatTa = tas.find(t => (t.placeholder || '').toLowerCase().includes('blender') || (t.placeholder || '').toLowerCase().includes('type'));
      if (!chatTa) return { ok: false, error: 'Chat input not found', tasFound: tas.length };

      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(chatTa, '/blender');
      chatTa.dispatchEvent(new Event('input', { bubbles: true }));

      // Find form and submit
      const form = chatTa.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        return { ok: true, submitted: true };
      }
      return { ok: false, error: 'Form not found' };
    })()
  `);
  console.log("Submit result:", submitRes);

  // Wait 1.5s for MCP connection check
  await new Promise(r => setTimeout(r, 1500));

  // Capture screenshot
  const payload = JSON.stringify({ tool: 'captureWindow', args: {} });
  const req = http.request({
    hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(d);
        if (json.ok && json.result?.dataUrl) {
          const b64 = json.result.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
          const outPath = 'C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg';
          fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
          console.log('Saved screenshot to:', outPath, 'Bytes:', fs.statSync(outPath).size);
        }
      } catch(e) { console.error(e); }
    });
  });
  req.write(payload);
  req.end();
}

run();
