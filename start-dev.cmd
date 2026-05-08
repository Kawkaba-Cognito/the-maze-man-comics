@echo off
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies (first run only^)...
  call npm install --legacy-peer-deps
  if errorlevel 1 exit /b 1
)

echo.
echo  ============================================================
echo   Leave this window OPEN while you test the app.
echo   Try: http://localhost:5173/the-maze-man-comics/
echo   Or:  http://127.0.0.1:5173/the-maze-man-comics/
echo  ============================================================
echo   Use Chrome or Edge — Cursor preview may not reach your PC.
echo  ============================================================
echo   If dev fails (port in use^): npm run dev:8080
echo   Then: http://localhost:8080/the-maze-man-comics/
echo  ============================================================
echo.

call npm run dev
echo.
pause
