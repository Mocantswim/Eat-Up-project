# Generate placeholder app icons (ASCII only, use unicode escape for "食" U+98DF)
Add-Type -AssemblyName System.Drawing

$food = [string][char]0x98DF
$rect = [System.Drawing.RectangleF]::new(0, 0, 1024, 1024)
$font = New-Object System.Drawing.Font('Microsoft YaHei', 500, [System.Drawing.FontStyle]::Bold)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = 'Center'
$format.LineAlignment = 'Center'

# icon.png (gradient bg + white text)
$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255, 93, 173, 226), [System.Drawing.Color]::FromArgb(255, 74, 144, 226), 60)
$g.FillRectangle($brush, $rect)
$g.DrawString($food, $font, [System.Drawing.Brushes]::White, $rect, $format)
$g.Dispose()
$bmp.Save('assets\icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# adaptive-icon.png (transparent bg + white circle + blue text)
$bmp2 = New-Object System.Drawing.Bitmap(1024, 1024)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g2.Clear([System.Drawing.Color]::Transparent)
$g2.FillEllipse([System.Drawing.Brushes]::White, 112, 112, 800, 800)
$blue = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 74, 144, 226))
$g2.DrawString($food, $font, $blue, $rect, $format)
$g2.Dispose()
$bmp2.Save('assets\adaptive-icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp2.Dispose()

Write-Output 'ICONS_OK'
