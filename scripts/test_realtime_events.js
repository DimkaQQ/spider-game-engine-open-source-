const { spawn } = require('child_process');

const psCode = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$engine.SetInputToDefaultAudioDevice()
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$engine.LoadGrammar($grammar)

$engine.add_SpeechHypothesized({
    param($s, $e)
    if ($e.Result.Text) {
        [Console]::WriteLine("INTERIM:" + $e.Result.Text)
        [Console]::Out.Flush()
    }
})

$engine.add_SpeechRecognized({
    param($s, $e)
    if ($e.Result.Text) {
        [Console]::WriteLine("FINAL:" + $e.Result.Text)
        [Console]::Out.Flush()
    }
})

$engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
[Console]::WriteLine("LISTENING_STARTED")
[Console]::Out.Flush()

while ($true) {
    Start-Sleep -Milliseconds 50
    if ([Console]::In.Peek() -ge 0) {
        $line = [Console]::ReadLine()
        if ($line -eq "STOP" -or $line -eq $null) { break }
    }
}

try { $engine.RecognizeAsyncStop() } catch {}
[Console]::WriteLine("LISTENING_STOPPED")
[Console]::Out.Flush()
`;

const child = spawn('powershell.exe', [
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command', psCode
], {
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', d => {
  console.log(`[${new Date().toISOString()}] STDOUT:`, d.toString().trim());
});
child.stderr.on('data', d => console.error('STDERR:', d.toString()));
child.on('close', code => console.log('Exited with code:', code));

console.log('Waiting 5 seconds before sending STOP...');
setTimeout(() => {
  console.log('NOW sending STOP');
  child.stdin.write("STOP\n");
}, 5000);
