@echo off
title Stop MetroVigil Server
color 0C
echo =======================================================================
echo   Stopping MetroVigil Server (Port 8000)...
echo =======================================================================
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    set FOUND=1
    echo Terminating process PID %%a listening on port 8000...
    taskkill /F /T /PID %%a >nul 2>&1
)

:: Also terminate any dangling python run.py processes
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'backend.main:app|run.py' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

if %FOUND%==1 (
    echo.
    echo [OK] MetroVigil server has been stopped.
) else (
    echo.
    echo [*] No running server found on port 8000.
)

echo.
ping 127.0.0.1 -n 3 >nul
