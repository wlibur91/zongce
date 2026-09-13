@echo off
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] pnpm not found, installing...
    call npm install -g pnpm
)

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call pnpm install
)

echo [INFO] Starting dev server...
start "SmartQY" cmd /k "cd /d %~dp0 && node node_modules\next\dist\bin\next dev --port 5000 --turbopack"
echo [INFO] Waiting for server to start...
ping -n 10 127.0.0.1 >nul
explorer "http://localhost:5000"
