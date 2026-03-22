@echo off
REM ═══════════════════════════════════════════════════════════
REM  The Maze Man Comics — Capacitor Setup Script
REM  Run this ONCE from inside the "maze man comics" folder
REM  Requirements: Node.js 18+, Android Studio (for Android)
REM ═══════════════════════════════════════════════════════════

echo.
echo  ██████████████████████████████████████████████
echo   THE MAZE MAN COMICS — PWA + Capacitor Setup
echo  ██████████████████████████████████████████████
echo.

REM Check Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js found:
node --version

REM Install dependencies
echo.
echo [1/4] Installing Capacitor dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed. Check your internet connection.
    pause & exit /b 1
)
echo [OK] Dependencies installed.

REM Initialize Capacitor
echo.
echo [2/4] Initializing Capacitor...
call npx cap init "The Maze Man Comics" "io.kawkaba.mazeman" --web-dir "." --no-telemetry
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] cap init reported an issue — this may be OK if already initialized.
)

REM Add Android platform
echo.
echo [3/4] Adding Android platform...
call npx cap add android
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] Android platform may already be added, or Android SDK missing.
    echo        Install Android Studio from https://developer.android.com/studio
)

REM Sync web files to native
echo.
echo [4/4] Syncing web assets to native platforms...
call npx cap sync

echo.
echo  ══════════════════════════════════════════════
echo   SETUP COMPLETE!
echo  ══════════════════════════════════════════════
echo.
echo  Next steps:
echo    • Run Android app: npx cap open android
echo    • Test in browser: open index.html
echo    • Add iOS:         npx cap add ios  (Mac only)
echo.
pause
