const { spawn } = require('child_process');

const psCode = `
$ErrorActionPreference = 'Continue'
try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  Add-Type -AssemblyName System.Speech
  $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
  $engine.SetInputToDefaultAudioDevice()
  $grammar = New-Object System.Speech.Recognition.DictationGrammar
  $engine.LoadGrammar($grammar)

  $engine.add_SpeechHypothesized({
      param($s, $e)
      [Console]::WriteLine("INTERIM:" + $e.Result.Text)
      [Console]::Out.Flush()
  })

  $engine.add_SpeechRecognized({
      param($s, $e)
      [Console]::WriteLine("FINAL:" + $e.Result.Text)
      [Console]::Out.Flush()
  })

  $engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  [Console]::WriteLine("LISTENING_STARTED")
  [Console]::Out.Flush()

  while ($true) {
      Start-Sleep -Milliseconds 100
      try {
        if ([Console]::In.Peek() -ge 0) {
            $line = [Console]::ReadLine()
            if ($line -eq "STOP") { break }
        }
      } catch {
        [Console]::WriteLine("PEEK_ERR:" + $_)
        break
      }
  }

  try { $engine.RecognizeAsyncStop() } catch {}
  [Console]::WriteLine("LISTENING_STOPPED")
  [Console]::Out.Flush()
} catch {
  [Console]::WriteLine("GLOBAL_ERR:" + $_)
  [Console]::Out.Flush()
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

child.stdout.on('data', d => console.log('STDOUT:', d.toString()));
child.stderr.on('data', d => console.error('STDERR:', d.toString()));
child.on('close', code => console.log('Exited with code:', code));

setTimeout(() => {
  child.stdin.write("STOP\n");
}, 4000);
