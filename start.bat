@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
cd /d "%~dp0"
title ZongCe Calculator

echo ========================================
echo   ZongCe Calculator
echo ========================================
echo.

:: === Step 1: Check Node.js ===
echo [1/4] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% equ 0 goto :node_ok

echo Node.js not in PATH, searching...
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;!PATH!"
    goto :node_ok
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "PATH=C:\Program Files (x86)\nodejs;!PATH!"
    goto :node_ok
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;!PATH!"
    goto :node_ok
)

echo.
echo ========================================
echo   Node.js NOT FOUND!
echo   Please install from:
echo   https://nodejs.org/en/download
echo ========================================
start https://nodejs.org/en/download
echo.
pause
exit /b 1

:node_ok
for /f "tokens=*" %%i in ('node -v 2^>nul') do set "NODE_VER=%%i"
echo Node.js OK: !NODE_VER!
echo.

:: === Step 2: Check npm ===
echo [2/4] Checking npm...
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   npm NOT FOUND!
    echo   Please reinstall Node.js from:
    echo   https://nodejs.org/en/download
    echo ========================================
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v 2^>nul') do set "NPM_VER=%%i"
echo npm OK: !NPM_VER!
echo.

:: === Step 3: Check dependencies ===
echo [3/4] Checking dependencies...
if not exist "node_modules" goto :install_deps
if not exist "node_modules\next\package.json" goto :install_deps
echo Dependencies OK.
goto :deps_done

:install_deps
echo Dependencies not found, running npm install...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   npm install FAILED!
    echo ========================================
    pause
    exit /b 1
)
echo Dependencies installed!

:deps_done
echo.

:: === Step 4: Start server ===
echo [4/4] Starting server...
start "ZongCe-Server" cmd /k "cd /d "%~dp0" && node node_modules\next\dist\bin\next dev --port 3000 --turbopack"

echo Waiting for server...
ping -n 8 127.0.0.1 >nul

start http://localhost:3000
echo.
echo ========================================
echo   All Done! Browser opened.
echo   Server running in another window.
echo ========================================
pause
