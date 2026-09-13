@echo off
cd /d "%~dp0"
title ZongCe Calculator

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo   Node.js is NOT installed!
    echo   Please install Node.js first.
    echo   Download: https://nodejs.org/en/download
    echo   Choose LTS version, then click Next
    echo   to install everything with defaults.
    echo ============================================
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)

echo Node.js detected: 
node -v

npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo npm not found, something is wrong with Node.js installation.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo.
    echo Installing pnpm...
    call npm install -g pnpm
    echo.
    echo Installing dependencies...
    call pnpm install
)

echo.
echo Starting server, browser will open shortly...
start "" /D "%~dp0" node node_modules\next\dist\bin\next dev --port 3000 --turbopack
ping -n 12 127.0.0.1 >nul
start http://localhost:3000
echo Done!
