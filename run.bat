@echo off
title CleanPlay - Ad-Free Universal Video Player
cd /d "%~dp0"

echo ========================================================
echo   CleanPlay - Ad-Free Universal Video Player
echo   Starting server at http://localhost:8000 ...
echo ========================================================

REM Launch browser in 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000"

REM Run FastAPI server with Uvicorn
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
