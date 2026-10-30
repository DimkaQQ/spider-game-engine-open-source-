const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'native_speech_worker.ps1');

const child = spawn('powershell.exe', [
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', scriptPath
], {
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', d => console.log('WORKER OUTPUT:', d.toString().trim()));
child.stderr.on('data', d => console.error('ERR:', d.toString()));

setTimeout(() => {
  console.log('Test completed.');
  child.kill();
}, 3000);
