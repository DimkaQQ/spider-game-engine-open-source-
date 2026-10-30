const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const code = \`
            import React from 'react';
            import { Html } from '@react-three/drei';
            export default function Test() {
              return <Html><div>HELLO DREI HTML</div></Html>;
            }
          \`;
          // Run render_jsx with Test
          return window.spiderEngine.tool('render_jsx', { name: 'Test.jsx', code });
        } catch(e) {
          return { error: e.message };
        }
      })()
    `
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
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('Test Drei Html:', d));
});
req.write(payload);
req.end();
