@echo off
cd /d "%~dp0"
title ZongCe Calculator

:: === Step 1: Check Node.js ===
echo Checking Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found, trying to install...
    where winget >nul 2>&1
    if %errorlevel% equ 0 (
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    ) else (
        echo Downloading Node.js installer...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.20.0/node-v22.20.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'"
        msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    )
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js install failed. Please install manually.
        start https://nodejs.org/en/download
        pause
        exit /b 1
    )
    echo Node.js installed!
)

:: === Step 2: Check npm ===
echo Checking npm...
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo npm not found, installing...
    where winget >nul 2>&1
    if %errorlevel% equ 0 (
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    )
    npm -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo npm installed!
)

:: === Step 3: Check dependencies ===
echo Checking dependencies...
if not exist "node_modules\package.json" (
    echo Dependencies not found, installing...
    call npm install
    echo Dependencies installed!
) else (
    echo Dependencies OK.
)

:: === Step 4: Start server ===
echo Starting server...
start "ZongCe-Server" cmd /k node node_modules\next\dist\bin\next dev --port 3000 --turbopack

echo Waiting for server...
ping -n 10 127.0.0.1 >nul

start http://localhost:3000
echo.
echo Done! Browser opened. Server running in another window.
pause
