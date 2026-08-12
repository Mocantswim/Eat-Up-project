New-Item -ItemType Directory -Force -Path assets\covers | Out-Null
$i = 1
Get-ChildItem -Path . -Filter *.png |
  Where-Object { $_.Length -gt 1000000 } |
  Sort-Object Name |
  ForEach-Object {
    Copy-Item $_.FullName -Destination ("assets\covers\cover" + $i + ".png") -Force
    $i++
  }
Get-ChildItem assets\covers | ForEach-Object { Write-Output ("$($_.Name)  $([math]::Round($_.Length/1024)) KB") }
