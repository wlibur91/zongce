@echo off
cd /d "%~dp0"
title ZongCe Calculator

:: Step 1: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Node.js not found!
        echo Please install Node.js LTS from:
        echo https://nodejs.org/en/download
        echo.
        echo After install, REBOOT your computer, then run start.bat again.
        echo.
        start https://nodejs.org/en/download
        pause
        exit /b 1
    )
)

:: Step 2: Kill old server on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Killing old server on port 3000...
    taskkill /f /pid %%a >nul 2>&1
)

:: Step 3: Check pnpm
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing pnpm...
    call npm install -g pnpm
)

:: Step 4: Install dependencies
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call pnpm install
)

:: Step 5: Start server and keep window open
echo.
echo ========================================
echo   Server starting, browser will open...
echo   Press Ctrl+C to stop the server.
echo ========================================
echo.
start "" http://localhost:3000
node node_modules\next\dist\bin\next dev --port 3000 --turbopack
