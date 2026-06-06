Write-Host "=== Hamro Class - Server Restart ===" -ForegroundColor Cyan

# Kill only node processes on our ports
$ports = @(3000, 5000)
foreach ($p in $ports) {
  $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
  if ($conn) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'node') {
      Stop-Process -Id $proc.Id -Force
      Write-Host "Killed node process on port $p (PID: $($proc.Id))" -ForegroundColor Yellow
    }
  }
}

Start-Sleep -Seconds 2

Write-Host "Starting backend (port 5000)..." -ForegroundColor Green
$bePath = Join-Path $PSScriptRoot "backend"
$be = Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $bePath -PassThru
Write-Host "Backend PID: $($be.Id)" -ForegroundColor Cyan

Start-Sleep -Seconds 3

Write-Host "Starting frontend (port 3000)..." -ForegroundColor Green
$fePath = Join-Path $PSScriptRoot "frontend"
$fe = Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "vite --port 3000 --host" -WorkingDirectory $fePath -PassThru
Write-Host "Frontend PID: $($fe.Id)" -ForegroundColor Cyan

Write-Host ""
Write-Host "Servers started!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to stop both servers..."
pause

Stop-Process -Id $be.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $fe.Id -Force -ErrorAction SilentlyContinue
Write-Host "Servers stopped." -ForegroundColor Yellow
