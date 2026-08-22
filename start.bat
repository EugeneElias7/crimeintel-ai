@echo off
echo Starting CrimeIntel AI...

start "Backend" cmd /k "cd /d C:\D\drive\Datathon\backend && rtk python -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 3 >nul

start "Frontend" cmd /k "cd /d C:\D\drive\Datathon\frontend && rtk npm run dev"

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul