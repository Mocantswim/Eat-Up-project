# Generate a short beep.wav (ASCII only)
$rate = 44100
$samples = [int]($rate * 0.25)
$fs = [System.IO.File]::Create('assets\beep.wav')
$bw = New-Object System.IO.BinaryWriter($fs)
$ascii = [System.Text.Encoding]::ASCII

$bw.Write($ascii.GetBytes('RIFF'))
$bw.Write([int]($samples * 2 + 36))
$bw.Write($ascii.GetBytes('WAVE'))
$bw.Write($ascii.GetBytes('fmt '))
$bw.Write([int]16)
$bw.Write([int16]1)
$bw.Write([int16]1)
$bw.Write([int]$rate)
$bw.Write([int]($rate * 2))
$bw.Write([int16]2)
$bw.Write([int16]16)
$bw.Write($ascii.GetBytes('data'))
$bw.Write([int]($samples * 2))

for ($i = 0; $i -lt $samples; $i++) {
  $t = $i / $rate
  $env = 1.0
  if ($t -gt 0.18) { $env = 1.0 - ($t - 0.18) / 0.07 }
  $sample = [int]([math]::Sin(2 * [math]::PI * 880 * $t) * 12000 * $env)
  $bw.Write([int16]$sample)
}
$bw.Close()
Write-Output 'BEEP_OK'
