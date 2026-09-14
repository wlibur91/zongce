@echo off
cd /d "%~dp0"
title ZongCe Calculator

echo ========================================
echo   ZongCe Calculator
echo ========================================
echo.

echo [1/3] Checking Node.js...
node -v
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo Node.js NOT FOUND! Please install:
        echo https://nodejs.org/en/download
        start https://nodejs.org/en/download
        pause
        exit /b 1
    )
)
echo Node.js OK!
echo.

echo [2/3] Installing dependencies...
if not exist "node_modules" call npm install
if not exist "node_modules\next\package.json" call npm install
echo Dependencies OK!
echo.

echo [3/3] Starting server...
start "ZongCe-Server" cmd /k "cd /d "%~dp0" && node node_modules\next\dist\bin\next dev --port 3000 --turbopack"

ping -n 8 127.0.0.1 >nul
start http://localhost:3000

echo.
echo ========================================
echo   All Done! Browser opened.
echo ========================================
pause
