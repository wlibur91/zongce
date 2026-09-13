@echo off
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 未检测到 pnpm，正在自动安装...
    call npm install -g pnpm
)

if not exist "node_modules" (
    echo [提示] 正在安装依赖...
    call pnpm install
)

echo [提示] 正在启动开发服务器，请稍候...
start "SmartQY" cmd /k "cd /d %~dp0 && node node_modules\next\dist\bin\next dev --port 5000 --turbopack"
echo [提示] 等待服务器启动...
ping -n 10 127.0.0.1 >nul
explorer "http://localhost:5000"
