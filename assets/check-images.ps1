Add-Type -AssemblyName System.Drawing
Get-ChildItem -Path . -Filter *.png | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $len = [math]::Round($_.Length / 1024)
  $t = $_.LastWriteTime.ToString('HH:mm')
  Write-Output ("$t  $($img.Width)x$($img.Height)  $len KB")
  $img.Dispose()
}
