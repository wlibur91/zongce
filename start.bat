@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title ZongCe Calculator

echo ========================================
echo   ZongCe Calculator - Starting...
echo ========================================
echo.

:: === Step 1: Check Node.js ===
echo [1/4] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not in PATH, searching...
    set "FOUND=0"
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
        set "FOUND=1"
    )
    if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
        set "FOUND=1"
    )
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
        set "FOUND=1"
    )
    if "!FOUND!"=="0" (
        echo.
        echo [ERROR] Node.js not found!
        echo Please download and install from: https://nodejs.org/en/download
        start https://nodejs.org/en/download
        echo.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%i in ('node -v') do set "NODE_VER=%%i"
echo Node.js OK: %NODE_VER%
echo.

:: === Step 2: Check npm ===
echo [2/4] Checking npm...
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    echo Please reinstall Node.js from: https://nodejs.org/en/download
    start https://nodejs.org/en/download
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set "NPM_VER=%%i"
echo npm OK: %NPM_VER%
echo.

:: === Step 3: Check dependencies ===
echo [3/4] Checking dependencies...
if not exist "node_modules" (
    echo Dependencies not found, running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo Dependencies installed!
) else if not exist "node_modules\next\package.json" (
    echo Dependencies incomplete, running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo Dependencies installed!
) else (
    echo Dependencies OK.
)
echo.

:: === Step 4: Start server ===
echo [4/4] Starting server...
start "ZongCe-Server" cmd /k "cd /d "%~dp0" && node node_modules\next\dist\bin\next dev --port 3000 --turbopack"

echo Waiting for server to start...
ping -n 8 127.0.0.1 >nul

start http://localhost:3000
echo.
echo ========================================
echo   All Done! Browser opened.
echo   Server running in another window.
echo ========================================
pause
