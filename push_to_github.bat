@echo off
title Push MetroVigil to GitHub
color 0A
echo =======================================================================
echo   Pushing MetroVigil to https://github.com/sudobool/metrovigil.git
echo =======================================================================
echo.

:: Ensure MinGit is in PATH
set PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;%PATH%

echo [*] Uploading code to GitHub...
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =======================================================================
    echo   [SUCCESS] Code successfully pushed to GitHub!
    echo   View your repository at: https://github.com/sudobool/metrovigil
    echo =======================================================================
) else (
    echo.
    echo [!] Push did not complete. Please check the message above.
)

echo.
pause
