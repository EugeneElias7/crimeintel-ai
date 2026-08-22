@echo off
title CrimeIntel AI Launcher
echo Starting CrimeIntel AI...

REM Start backend (FastAPI + uvicorn) from the venv in this project folder
start "Backend" /D "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 3 >nul

REM Start frontend (Vite dev server)
start "Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Backend : http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Close the "Backend" and "Frontend" windows to stop the app.
pause >nul
