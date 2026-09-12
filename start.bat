@echo off
cd /d "%~dp0"
if not exist "node_modules" call pnpm install
start "SmartQY" cmd /k "cd /d "%~dp0" && node node_modules\next\dist\bin\next dev --port 5000 --turbopack"
echo Waiting for server...
ping -n 8 127.0.0.1 >nul
explorer "http://localhost:5000"