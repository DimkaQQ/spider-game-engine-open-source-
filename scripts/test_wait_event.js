const { spawn } = require('child_process');

const psCode = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$engine.SetInputToDefaultAudioDevice()
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$engine.LoadGrammar($grammar)

Register-ObjectEvent -InputObject $engine -EventName SpeechHypothesized -Action {
    [Console]::WriteLine("INTERIM:" + $Event.SourceEventArgs.Result.Text)
    [Console]::Out.Flush()
} | Out-Null

Register-ObjectEvent -InputObject $engine -EventName SpeechRecognized -Action {
    [Console]::WriteLine("FINAL:" + $Event.SourceEventArgs.Result.Text)
    [Console]::Out.Flush()
} | Out-Null

$engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
[Console]::WriteLine("LISTENING_STARTED")
[Console]::Out.Flush()

# Background thread to watch for STOP or process termination
$script:running = $true
$thread = [System.Threading.Thread]::new([System.Threading.ThreadStart]{
    try {
        $line = [Console]::In.ReadLine()
        $script:running = $false
    } catch {}
})
$thread.IsBackground = $true
$thread.Start()

while ($script:running) {
    Wait-Event -Timeout 1 | Out-Null
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

child.stdout.on('data', d => console.log(`[${new Date().toISOString()}] STDOUT:`, d.toString().trim()));
child.stderr.on('data', d => console.error('STDERR:', d.toString()));
child.on('close', code => console.log('Exited with code:', code));

setTimeout(() => {
  console.log('Sending STOP after 6 seconds...');
  child.stdin.write("STOP\n");
}, 6000);
