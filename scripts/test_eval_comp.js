const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const code = localStorage.getItem('spider-active-jsx-code');
          const transformed = window.sucrase.transform(code, {
            transforms: ['jsx', 'imports', 'typescript'],
            jsxRuntime: 'classic'
          }).code;

          const module = { exports: {} };
          const customRequire = (name) => {
            if (name === 'react') return window.React;
            if (name === 'lucide-react') return window.lucide || {};
            return {};
          };

          const fn = new Function('require', 'module', 'exports', 'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', transformed);
          fn(customRequire, module, module.exports, window.React, window.React.useState, window.React.useEffect, window.React.useRef, window.React.useMemo, window.React.useCallback);

          const Comp = module.exports.default || Object.values(module.exports)[0];
          return {
            hasComp: !!Comp,
            type: typeof Comp,
            name: Comp?.name
          };
        } catch(e) {
          return { error: e.message, stack: e.stack };
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
  res.on('end', () => console.log('Comp test:', d));
});
req.write(payload);
req.end();
