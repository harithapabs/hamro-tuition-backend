Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    $scale = $Size / 256.0

    $bgRect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = [int](48 * $scale)
    $bgPath.AddArc($bgRect.X, $bgRect.Y, $radius, $radius, 180, 90)
    $bgPath.AddArc($bgRect.Right - $radius, $bgRect.Y, $radius, $radius, 270, 90)
    $bgPath.AddArc($bgRect.Right - $radius, $bgRect.Bottom - $radius, $radius, $radius, 0, 90)
    $bgPath.AddArc($bgRect.X, $bgRect.Bottom - $radius, $radius, $radius, 90, 90)
    $bgPath.CloseFigure()
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0, 0)),
        (New-Object System.Drawing.PointF(0, $Size)),
        [System.Drawing.Color]::FromArgb(255, 30, 64, 175),
        [System.Drawing.Color]::FromArgb(255, 30, 58, 138)
    )
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose()
    $bgPath.Dispose()

    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    $hX = [int](64 * $scale)
    $hY = [int](72 * $scale)
    $barW = [int](22 * $scale)
    $barH = [int](112 * $scale)
    $g.FillRectangle($white, $hX, $hY, $barW, $barH)
    $g.FillRectangle($white, $hX + [int](106 * $scale), $hY, $barW, $barH)
    $crossY = $hY + [int](50 * $scale)
    $crossH = [int](22 * $scale)
    $crossW = [int](128 * $scale)
    $g.FillRectangle($white, $hX, $crossY, $crossW, $crossH)

    $bookY = [int](170 * $scale)
    $bookH = [int](60 * $scale)
    $bookLeftW = [int](90 * $scale)
    $bookRightW = [int](90 * $scale)
    $centerX = [int](128 * $scale)

    $bookLeftBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
    $bookRightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 226, 232, 240))

    $g.FillRectangle($bookLeftBrush, $centerX - $bookLeftW, $bookY, $bookLeftW, $bookH)
    $g.FillRectangle($bookRightBrush, $centerX, $bookY, $bookRightW, $bookH)

    $bookLeftBrush.Dispose()
    $bookRightBrush.Dispose()

    $penCenterX = [int](188 * $scale)
    $penCenterY = [int](48 * $scale)
    $penAngle = 40
    $g.TranslateTransform($penCenterX, $penCenterY)
    $g.RotateTransform($penAngle)
    $penW = [int](22 * $scale)
    $penH = [int](90 * $scale)
    $g.FillRectangle($white, -$penW/2, -$penH/2, $penW, $penH)
    $g.FillRectangle([System.Drawing.Color]::FromArgb(255, 226, 232, 240), -$penW/2, -$penH/2, $penW, [int](14 * $scale))
    $penTip = @(
        (New-Object System.Drawing.Point(-$penW/2, $penH/2)),
        (New-Object System.Drawing.Point($penW/2, $penH/2)),
        (New-Object System.Drawing.Point(0, $penH/2 + [int](18 * $scale)))
    )
    $g.FillPolygon($white, $penTip)
    $g.ResetTransform()

    $red = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
    $dotR = [int](6 * $scale)
    $g.FillEllipse($red, [int](172 * $scale), [int](194 * $scale), $dotR, $dotR)
    $red.Dispose()

    $white.Dispose()
    $g.Dispose()

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$dist = "C:\xampp\htdocs\Hamro class\frontend\public"
Create-Icon -Size 192 -Path "$dist\pwa-192x192.png"
Create-Icon -Size 512 -Path "$dist\pwa-512x512.png"
Create-Icon -Size 180 -Path "$dist\apple-touch-icon.png"
Create-Icon -Size 32 -Path "$dist\favicon-32.png"
Create-Icon -Size 16 -Path "$dist\favicon-16.png"

Write-Host "Icons created:"
Get-ChildItem "$dist\pwa-*.png", "$dist\apple-touch-icon.png", "$dist\favicon-*.png" | Select-Object Name, Length
