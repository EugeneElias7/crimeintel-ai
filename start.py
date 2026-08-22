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

def start_frontend():
    """Start the frontend React Vite development server"""
    print("\n" + "=" * 60)
    print("Starting CrimeIntel AI Frontend...")
    print("=" * 60)
    frontend_cmd = [sys.executable, "-m", "npm", "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=os.path.join(os.path.dirname(__file__), "frontend"),
    )
    print(f"Frontend PID: {frontend_proc.pid}")
    print("Frontend: http://localhost:5173")
    return frontend_proc

def main():
    print("\nCrimeIntel AI Application Starting...\n")
    
    # Start backend server
    backend_proc = start_backend()
    
    # Wait for backend to start
    time.sleep(3)
    
    # Start frontend server
    frontend_proc = start_frontend()
    
    # Wait a moment for frontend to start
    time.sleep(3)
    
    # Open dashboard in browser
    print("\n" + "=" * 60)
    print("Opening dashboard in browser...")
    print("=" * 60)
    webbrowser.open("http://localhost:5173")
    
    print("\nCrimeIntel AI is running!")
    print("  - Backend:  http://localhost:8000")
    print("  - Frontend: http://localhost:5173")
    print("  - Press Ctrl+C to stop both servers\n")
    
    try:
        # Wait for both processes
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("Both servers stopped.")

if __name__ == "__main__":
    main()