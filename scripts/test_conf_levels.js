const { spawn } = require('child_process');

const psCode = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$engine.SetInputToDefaultAudioDevice()
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$engine.LoadGrammar($grammar)

Register-ObjectEvent -InputObject $engine -EventName SpeechHypothesized -Action {
    $r = $Event.SourceEventArgs.Result
    [Console]::WriteLine("HYPO: " + $r.Text + " (Conf: " + $r.Confidence + ")")
    [Console]::Out.Flush()
} | Out-Null

Register-ObjectEvent -InputObject $engine -EventName SpeechRecognized -Action {
    $r = $Event.SourceEventArgs.Result
    [Console]::WriteLine("RECOGNIZED: " + $r.Text + " (Conf: " + $r.Confidence + ")")
    [Console]::Out.Flush()
} | Out-Null

$engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
[Console]::WriteLine("LISTENING")
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

child.stdout.on('data', d => console.log(d.toString().trim()));
child.stderr.on('data', d => console.error('ERR:', d.toString()));

setTimeout(() => child.kill(), 6000);
