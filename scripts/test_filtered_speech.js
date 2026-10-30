const { spawn } = require('child_process');

const psCode = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$engine.SetInputToDefaultAudioDevice()

$grammar = New-Object System.Speech.Recognition.DictationGrammar
$grammar.Weight = 1.0
$engine.LoadGrammar($grammar)

$engine.EndSilenceTimeout = [TimeSpan]::FromMilliseconds(750)
$engine.EndSilenceTimeoutAmbiguous = [TimeSpan]::FromMilliseconds(1000)

Register-ObjectEvent -InputObject $engine -EventName SpeechHypothesized -Action {
    $r = $Event.SourceEventArgs.Result
    if ($r.Text -and $r.Confidence -ge 0.35) {
        [Console]::WriteLine("INTERIM:" + $r.Text)
        [Console]::Out.Flush()
    }
} | Out-Null

Register-ObjectEvent -InputObject $engine -EventName SpeechRecognized -Action {
    $r = $Event.SourceEventArgs.Result
    if ($r.Text -and $r.Confidence -ge 0.20) {
        [Console]::WriteLine("FINAL:" + $r.Text)
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

child.stdout.on('data', d => console.log('FILTERED OUTPUT:', d.toString().trim()));
child.stderr.on('data', d => console.error('ERR:', d.toString()));

setTimeout(() => {
  console.log('Test completed.');
  child.kill();
}, 4000);
