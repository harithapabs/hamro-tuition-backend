@echo off
cd /d "%~dp0"
echo ================================
echo   Hamro Class - Server Starter
echo ================================
echo.

echo [1/3] Starting Backend (port 5000)...
start "Hamro Backend" cmd /c "cd /d "%~dp0backend" && node server.js"
if %errorlevel% neq 0 (
  echo Backend might have failed to start
)

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend (port 3000)...
start "Hamro Frontend" cmd /c "cd /d "%~dp0frontend" && npx vite --port 3000 --host"
if %errorlevel% neq 0 (
  echo Frontend might have failed to start
)

echo.
echo [3/3] Optional: Enable HTTPS (port 3001)?
set /p https_choice=Type 'y' for HTTPS dev server, anything else to skip:
if /i "%https_choice%"=="y" (
  echo Starting HTTPS dev server on port 3001 with self-signed cert...
  start "Hamro Frontend HTTPS" cmd /c "cd /d "%~dp0frontend" && npx vite --port 3001 --host --https"
)

echo.
echo ================================
echo   Servers starting up!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
if /i "%https_choice%"=="y" echo   Frontend: https://localhost:3001 (self-signed)
echo ================================
echo.
echo Close the server windows to stop.
timeout /t 5 /nobreak >nul
