# Run both backend and frontend
$backend = Start-Process -FilePath "rtk" -ArgumentList "python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory "C:\D drive\Datathon\backend" -PassThru
$frontend = Start-Process -FilePath "rtk" -ArgumentList "npm", "run", "dev" -WorkingDirectory "C:\D drive\Datathon\frontend" -PassThru

Write-Host "Backend PID: $($backend.Id)" -ForegroundColor Green
Write-Host "Frontend PID: $($frontend.Id)" -ForegroundColor Green
Write-Host "Open http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both..." -ForegroundColor Yellow

# Wait for Ctrl+C
try {
    while ($true) { Start-Sleep 1 }
} finally {
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped both processes" -ForegroundColor Red
}