const { execSync } = require('child_process');

const psCode = `
try {
  $type = [Windows.Media.SpeechRecognition.SpeechRecognizer, Windows.Media.SpeechRecognition, ContentType = WindowsRuntime]
  $rec = [Windows.Media.SpeechRecognition.SpeechRecognizer]::new()
  $asyncOp = $rec.CompileConstraintsAsync()
  
  $timeout = 0
  while ($asyncOp.Status -eq [Windows.Foundation.AsyncStatus]::Started -and $timeout -lt 50) {
    Start-Sleep -Milliseconds 100
    $timeout++
  }
  
  $res = $asyncOp.GetResults()
  Write-Host "Constraint compilation status: $($res.Status)"
  Write-Host "Session ready: $([bool]$rec.ContinuousRecognitionSession)"
} catch {
  Write-Host "ERR: $_"
}
`;

try {
  const out = execSync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psCode.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
  console.log('Result:', out);
} catch (e) {
  console.error(e.message);
}
