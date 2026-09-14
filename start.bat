@echo off
cd /d "%~dp0"
title ZongCe Calculator

echo Checking Node.js...
node -v
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js not found!
        echo https://nodejs.org/en/download
        start https://nodejs.org/en/download
        pause
        exit /b 1
    )
)

if not exist "node_modules\next\package.json" (
    echo Installing dependencies...
    call npm install
)

echo Starting server...
start "ZongCe-Server" cmd /k node node_modules\next\dist\bin\next dev --port 3000 --turbopack

echo Waiting for server...
ping -n 10 127.0.0.1 >nul

start http://localhost:3000
echo.
echo Done! Browser opened. Server running in another window.
pause
