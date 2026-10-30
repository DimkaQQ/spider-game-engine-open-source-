[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
try {
    $engine.SetInputToDefaultAudioDevice()
} catch {
    [Console]::WriteLine("ERROR:No default audio input device found")
    [Console]::Out.Flush()
    exit 1
}

$grammar = New-Object System.Speech.Recognition.DictationGrammar
$engine.LoadGrammar($grammar)

Register-ObjectEvent -InputObject $engine -EventName SpeechHypothesized -Action {
    $text = $Event.SourceEventArgs.Result.Text
    if ($text) {
        [Console]::WriteLine("INTERIM:" + $text)
        [Console]::Out.Flush()
    }
} | Out-Null

Register-ObjectEvent -InputObject $engine -EventName SpeechRecognized -Action {
    $text = $Event.SourceEventArgs.Result.Text
    if ($text) {
        [Console]::WriteLine("FINAL:" + $text)
        [Console]::Out.Flush()
    }
} | Out-Null

$engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
[Console]::WriteLine("LISTENING_STARTED")
[Console]::Out.Flush()

# Run until stdin receives 'STOP' or EOF
while ($true) {
    $line = [Console]::ReadLine()
    if ($line -eq "STOP" -or $line -eq $null) { break }
}

try {
    $engine.RecognizeAsyncStop()
} catch {}
[Console]::WriteLine("LISTENING_STOPPED")
[Console]::Out.Flush()
