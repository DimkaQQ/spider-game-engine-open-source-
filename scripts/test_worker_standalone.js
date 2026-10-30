const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'native_speech_worker.ps1');
console.log('Script path:', scriptPath);

const child = spawn('powershell.exe', [
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', scriptPath
], {
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', d => console.log('STDOUT:', d.toString()));
child.stderr.on('data', d => console.error('STDERR:', d.toString()));
child.on('close', code => console.log('Exited with code:', code));

setTimeout(() => {
  console.log('Sending STOP');
  child.stdin.write("STOP\n");
}, 4000);
