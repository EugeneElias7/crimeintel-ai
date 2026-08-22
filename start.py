#!/usr/bin/env python3
"""
CrimeIntel AI - Startup Script

Starts BOTH servers with one command:
    python start.py

1. FastAPI backend  -> http://localhost:8000
2. Vite frontend    -> http://localhost:5173 (browser opens automatically)
3. Press Ctrl+C to stop both.

Always uses the project virtual environment (backend\\.venv),
even if you forget to activate it first.
"""

import subprocess
import webbrowser
import time
import sys
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = os.path.join(ROOT, "backend", ".venv", "Scripts", "python.exe")


def get_python() -> str:
    """Prefer the project venv so dependencies are always found."""
    if os.path.exists(VENV_PYTHON):
        return VENV_PYTHON
    print("WARNING: backend\\.venv not found - falling back to system Python.")
    return sys.executable


def start_backend() -> subprocess.Popen:
    print("=" * 60)
    print("Starting CrimeIntel AI Backend Server...")
    print("=" * 60)
    backend_cmd = [
        get_python(), "-m", "uvicorn", "main:app",
        "--host", "0.0.0.0", "--port", "8000",
    ]
    proc = subprocess.Popen(backend_cmd, cwd=os.path.join(ROOT, "backend"))
    print(f"Backend PID: {proc.pid}")
    print("Backend API:  http://localhost:8000")
    return proc


def start_frontend() -> subprocess.Popen:
    print("=" * 60)
    print("Starting CrimeIntel AI Frontend Server...")
    print("=" * 60)
    proc = subprocess.Popen(
        "npm run dev",
        cwd=os.path.join(ROOT, "frontend"),
        shell=True,
    )
    print(f"Frontend PID: {proc.pid}")
    print("Dashboard:    http://localhost:5173")
    return proc


def stop(proc: subprocess.Popen) -> None:
    try:
        proc.terminate()
        proc.wait(timeout=5)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def main():
    print("\nCrimeIntel AI Application Starting...\n")

    backend_proc = start_backend()
    time.sleep(3)
    frontend_proc = start_frontend()
    time.sleep(3)

    print("\n" + "=" * 60)
    print("Opening dashboard in browser...")
    print("=" * 60)
    webbrowser.open("http://localhost:5173")

    print("\nCrimeIntel AI is running!")
    print("  - Backend API: http://localhost:8000")
    print("  - Dashboard:   http://localhost:5173")
    print("  - Press Ctrl+C to stop both servers\n")

    try:
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        stop(frontend_proc)
        stop(backend_proc)
        print("All servers stopped.\n")


if __name__ == "__main__":
    main()
