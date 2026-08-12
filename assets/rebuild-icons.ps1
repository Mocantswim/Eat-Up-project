# Rebuild app icons from user-provided PNG (ASCII only)
Add-Type -AssemblyName System.Drawing

# Pick the newest PNG in project root (the user's icon)
$src = Get-ChildItem -Path . -Filter *.png | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Output "SRC: $($src.Name)"
$img = [System.Drawing.Image]::FromFile($src.FullName)
Write-Output "ORIG_SIZE: $($img.Width)x$($img.Height)"

# icon.png : scale to 1024x1024
$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 1024, 1024)
$g.Dispose()
$bmp.Save((Join-Path $PWD 'assets\icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# adaptive-icon.png : icon scaled to 800x800 centered on transparent 1024 canvas (safe zone)
$img2 = [System.Drawing.Image]::FromFile($src.FullName)
$bmp2 = New-Object System.Drawing.Bitmap(1024, 1024)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.Clear([System.Drawing.Color]::Transparent)
$g2.DrawImage($img2, 112, 112, 800, 800)
$g2.Dispose()
$bmp2.Save((Join-Path $PWD 'assets\adaptive-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp2.Dispose()

Write-Output 'ICONS_REBUILT'
