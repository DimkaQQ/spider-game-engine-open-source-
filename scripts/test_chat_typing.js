const http = require('http');

function evalInEngine(expr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      tool: 'eval',
      args: { expr }
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
  const res = await evalInEngine(`
    (() => {
      const tas = Array.from(document.querySelectorAll('textarea'));
      const chatTa = tas.find(t => t.placeholder.includes('Type a message'));
      if (!chatTa) return { error: 'Chat textarea not found' };

      chatTa.focus();

      // Test Space key event dispatch
      const spaceDown = new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true
      });
      const spaceDefaultAllowed = chatTa.dispatchEvent(spaceDown);

      // Set sample message with spaces to test visual rendering
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(chatTa, 'Can you create a cyberpunk sports car in Knowledge Park?');
      chatTa.dispatchEvent(new Event('input', { bubbles: true }));

      return {
        ok: true,
        spaceDefaultAllowed,
        val: chatTa.value,
        hasSpaces: chatTa.value.includes(' ')
      };
    })()
  `);
  console.log('Chat typing result:', res);
}

run();
