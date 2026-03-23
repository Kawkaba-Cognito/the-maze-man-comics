@echo off
echo Starting Maze Man local server...
echo.
echo Open your browser and go to: http://localhost:8080
echo Press Ctrl+C in this window to stop the server.
echo.
start "" "http://localhost:8080"
python -m http.server 8080 --directory "%~dp0"
pause
