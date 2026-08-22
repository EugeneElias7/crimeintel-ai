# Run both backend and frontend from this project's real location
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$backend = Start-Process -FilePath "$root\backend\.venv\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory "$root\backend" -PassThru

$frontend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" `
    -WorkingDirectory "$root\frontend" -PassThru

Write-Host "Backend PID: $($backend.Id)" -ForegroundColor Green
Write-Host "Frontend PID: $($frontend.Id)" -ForegroundColor Green
Write-Host "Open http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both..." -ForegroundColor Yellow

try {
    while ($true) { Start-Sleep 1 }
} finally {
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped both processes" -ForegroundColor Red
}
