const { spawn } = require('child_process');

const psCode = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$engine.SetInputToDefaultAudioDevice()
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$engine.LoadGrammar($grammar)

Register-ObjectEvent -InputObject $engine -EventName SpeechHypothesized -Action {
    $t = $Event.SourceEventArgs.Result.Text
    if ($t) {
        [Console]::WriteLine("INTERIM:" + $t)
        [Console]::Out.Flush()
    }
} | Out-Null

Register-ObjectEvent -InputObject $engine -EventName SpeechRecognized -Action {
    $t = $Event.SourceEventArgs.Result.Text
    if ($t) {
        [Console]::WriteLine("FINAL:" + $t)
        [Console]::Out.Flush()
    }
} | Out-Null

$engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
[Console]::WriteLine("LISTENING_STARTED")
[Console]::Out.Flush()

while ($true) {
    Wait-Event -Timeout 1 | Out-Null
}
`;

const child = spawn('powershell.exe', [
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command', psCode
], {
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', d => console.log(`[${new Date().toISOString()}] LIVE:`, d.toString().trim()));
child.stderr.on('data', d => console.error('STDERR:', d.toString()));
child.on('close', code => console.log('Clean exit:', code));

setTimeout(() => {
  console.log('Killing child now after 4 seconds...');
  child.kill();
}, 4000);
