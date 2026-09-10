@echo off
title MetroVigil - AI-Powered Legal Metrology Compliance Engine
color 0B
echo =======================================================================
echo   MetroVigil - AI-Powered Legal Metrology Compliance Engine
echo   Smart India Hackathon 2026
echo =======================================================================
echo.

:: Detect Python 3.11 where all project dependencies are installed
set PYTHON_CMD=
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set PYTHON_CMD="%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
) else (
    py -3.11 --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py -3.11
    ) else (
        set PYTHON_CMD=python
    )
)

echo [*] Starting MetroVigil Web Server...
echo [*] Web Dashboard will open automatically at: http://localhost:8000
echo.

%PYTHON_CMD% run.py
if %errorlevel% neq 0 (
    echo.
    echo [!] Server exited with an error.
    pause
)
