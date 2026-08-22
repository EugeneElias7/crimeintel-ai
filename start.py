#!/usr/bin/env python3
import subprocess
import webbrowser
import time
import sys
import os

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
    print("Backend API: http://localhost:8000")
    print("Backend API Docs: http://localhost:8000/docs")
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
    print("  - Backend:  http://localhost:8000")
    print("  - Frontend: http://localhost:5173 (start separately with: cd frontend && npm run dev)")
    print("  - Press Ctrl+C to stop the backend server\n")
    
    try:
        # Wait for backend process
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping backend server...")
        backend_proc.terminate()
        backend_proc.wait()
        print("Backend server stopped.")

if __name__ == "__main__":
    main()