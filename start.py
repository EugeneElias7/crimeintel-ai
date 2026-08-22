#!/usr/bin/env python3
"""
CrimeIntel AI - Startup Script

Starts the backend API server and opens the dashboard in your browser.

Usage (PowerShell):
    & "python" "start.py"

    OR

    python start.py

The script will:
1. Start the FastAPI backend server
2. Open your default browser to the dashboard URL
3. Keep running until you press Ctrl+C
4. Gracefully stop the backend server when done

Note: The frontend Vite dev server (npm run dev) must be running separately
for the dashboard to show full UI. If the dashboard shows a loading state,
run: cd frontend && npm run dev

For full functionality, ensure both:
  - Backend:  python -m uvicorn app.main:app --port 8000
  - Frontend: npm run dev (in the frontend directory)
"""

import subprocess
import webbrowser
import time
import sys
import os
import signal


def start_backend():
    """Start the FastAPI backend server"""
    print("=" * 60)
    print("Starting CrimeIntel AI Backend Server...")
    print("=" * 60)
    backend_cmd = [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "0.0.0.0", "--port", "8000"
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=os.path.join(os.path.dirname(__file__), "backend"),
    )
    print(f"Backend PID: {backend_proc.pid}")
    print("Backend API:  http://localhost:8000")
    print("API Docs:     http://localhost:8000/docs")
    print("Dashboard:    http://localhost:5173")
    return backend_proc


def main():
    print("\nCrimeIntel AI Application Starting...\n")

    # Start backend server
    backend_proc = start_backend()

    # Wait for backend to start
    time.sleep(3)

    # Open dashboard in browser
    print("\n" + "=" * 60)
    print("Opening dashboard in browser...")
    print("=" * 60)
    webbrowser.open("http://localhost:5173")

    print("\nCrimeIntel AI is running!")
    print("  - Backend:  http://localhost:8000  (started above)")
    print("  - Frontend: http://localhost:5173  (opened in browser)")
    print("  - If dashboard shows loading, start frontend separately:")
    print("    cd frontend && npm run dev")
    print("  - Press Ctrl+C to stop the backend server\n")

    # Handle Ctrl+C gracefully
    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping backend server...")
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
        print("Backend server stopped.\n")


if __name__ == "__main__":
    main()