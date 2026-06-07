Add-Type -AssemblyName System.Drawing

$source = "C:\Users\magar\OneDrive\Desktop\hamro-logo.png"
$dest = "C:\xampp\htdocs\Hamro class\frontend\public"

if (-not (Test-Path $source)) {
    Write-Host "ERROR: Source file not found: $source"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($source)
Write-Host "Source: $($srcImg.Width)x$($srcImg.Height)"

function Resize-Icon {
    param([int]$Size, [string]$Path)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $Size, $Size)
    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $Path ($Size x $Size)"
}

Copy-Item $source "$dest\hamro-logo.png" -Force
Write-Host "Copied source to public/hamro-logo.png"

Resize-Icon -Size 16  -Path "$dest\favicon-16.png"
Resize-Icon -Size 32  -Path "$dest\favicon-32.png"
Resize-Icon -Size 48  -Path "$dest\favicon-48.png"
Resize-Icon -Size 64  -Path "$dest\favicon-64.png"
Resize-Icon -Size 180 -Path "$dest\apple-touch-icon.png"
Resize-Icon -Size 192 -Path "$dest\pwa-192x192.png"
Resize-Icon -Size 512 -Path "$dest\pwa-512x512.png"

$bmpIco = New-Object System.Drawing.Bitmap(64, 64)
$gIco = [System.Drawing.Graphics]::FromImage($bmpIco)
$gIco.DrawImage($srcImg, 0, 0, 64, 64)
$gIco.Dispose()
$icon = [System.Drawing.Icon]::FromHandle($bmpIco.GetHicon())
$icoStream = [System.IO.File]::OpenWrite("$dest\favicon.ico")
$icon.Save($icoStream)
$icoStream.Close()
$bmpIco.Dispose()
Write-Host "Created: favicon.ico (64x64)"

$srcImg.Dispose()

Get-ChildItem $dest -Filter "*.png" | Where-Object { $_.Name -match "favicon|pwa|apple|hamro" } | Select-Object Name, Length | Format-Table -AutoSize
