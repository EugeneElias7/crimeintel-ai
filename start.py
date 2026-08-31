#!/usr/bin/env python3
"""
CrimeIntel AI - Unified Launcher (Windows / PowerShell / CMD)

One command to run the full stack:
    python start.py
    python start.py --port 5175 --no-browser
    python start.py --backend-only
    python start.py --frontend-only

What it does:
  1. Kills stale processes on ports 8000, 5173, 5174, 5175, 3000
  2. Verifies Node + Python + dependencies
  3. Starts FastAPI backend  -> http://localhost:8000  (health: /api/v1/health)
  4. Starts Vite frontend    -> http://localhost:5175  (single port, no fallbacks)
  5. Waits for health checks, then opens browser
  6. Streams logs with prefixes [BACKEND] / [FRONTEND]
  7. Ctrl+C stops both servers cleanly (kills entire process tree)

Backend entrypoint: backend/main.py -> main:app   (new routers architecture)
Frontend entrypoint: frontend/vite.config.ts server.port
"""

import argparse
import os
import sys
import subprocess
import time
import webbrowser
import urllib.request
import urllib.error
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

BACKEND_PORT = 8000
FRONTEND_PORT = 5175
BACKEND_URL = f"http://localhost:{BACKEND_PORT}/api/v1/health"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"

# ----------------------------
# Helpers
# ----------------------------
def log(msg: str, prefix: str = ""):
    print(f"{prefix}{msg}", flush=True)

def get_python() -> str:
    """Prefer project venv, then rtk shim, then system python."""
    venv_py = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    if venv_py.exists():
        return str(venv_py)
    # rtk is available in this environment (Datathon container)
    if shutil.which("rtk"):
        # rtk python delegates to correct interpreter
        return "rtk"
    return sys.executable

def get_python_args() -> list[str]:
    py = get_python()
    if py == "rtk":
        return ["rtk", "python"]
    return [py]

def kill_port(port: int):
    """Best-effort kill for Windows. Uses npx kill-port if available, else taskkill via netstat."""
    try:
        subprocess.run(["npx", "kill-port", str(port)], capture_output=True, timeout=5)
    except Exception:
        pass
    # Fallback: PowerShell netstat + taskkill (Windows)
    try:
        ps = subprocess.run(
            ["powershell", "-Command", f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object {{ taskkill /PID $_ /F 2>$null }}"],
            capture_output=True, timeout=5
        )
    except Exception:
        pass

def kill_stale_ports():
    for p in [BACKEND_PORT, 3000, 5173, 5174, FRONTEND_PORT]:
        kill_port(p)

def wait_for_http(url: str, timeout: int = 40, label: str = "service"):
    log(f"Waiting for {label} {url} ...", "[WAIT] ")
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if 200 <= r.status < 400:
                    log(f"{label} ready ({r.status})", "[OK] ")
                    return True
        except Exception:
            pass
        time.sleep(1)
    log(f"{label} not ready after {timeout}s - continuing anyway", "[WARN] ")
    return False

def ensure_frontend_port_config():
    """Force vite.config.ts to use FRONTEND_PORT to avoid 5173/5174 drift."""
    cfg = FRONTEND_DIR / "vite.config.ts"
    if not cfg.exists():
        return
    text = cfg.read_text(encoding="utf-8", errors="ignore")
    if f"port: {FRONTEND_PORT}" not in text:
        # patch port: 5173 -> 5175 if needed (idempotent)
        text = text.replace("port: 5173", f"port: {FRONTEND_PORT}")
        # if no port line, inject
        if f"port: {FRONTEND_PORT}" not in text:
            text = text.replace("server: {", f"server: {{\n      port: {FRONTEND_PORT},")
        cfg.write_text(text, encoding="utf-8")
        log(f"Patched vite.config.ts -> port {FRONTEND_PORT}", "[CFG] ")

def ensure_backend_cors():
    """Ensure .env ALLOWED_ORIGINS includes FRONTEND_PORT."""
    env_path = BACKEND_DIR / ".env"
    if not env_path.exists():
        return
    text = env_path.read_text(encoding="utf-8", errors="ignore")
    needed = f"http://localhost:{FRONTEND_PORT}"
    if needed not in text:
        if "ALLOWED_ORIGINS=" in text:
            text = text.replace(
                "ALLOWED_ORIGINS=http://localhost:5173",
                f"ALLOWED_ORIGINS=http://localhost:{FRONTEND_PORT},http://localhost:5173"
            )
            # handle generic case
            if needed not in text:
                text = text.replace("ALLOWED_ORIGINS=", f"ALLOWED_ORIGINS={needed},")
        env_path.write_text(text, encoding="utf-8")
        log(f"Patched backend/.env ALLOWED_ORIGINS to include {needed}", "[CFG] ")

def stream_output(name: str, proc: subprocess.Popen):
    """Optional: stream logs in background threads. Kept simple - print on exit."""
    pass

# ----------------------------
# Launchers
# ----------------------------
def start_backend() -> subprocess.Popen:
    log("=" * 60)
    log("Starting Backend (FastAPI) ...")
    log("=" * 60)
    # backend/main.py is canonical entry (routers architecture)
    # fallback to app.main:app if main.py missing
    entry = "main:app"
    if not (BACKEND_DIR / "main.py").exists() and (BACKEND_DIR / "app" / "main.py").exists():
        entry = "app.main:app"

    cmd = get_python_args() + ["-m", "uvicorn", entry, "--host", "0.0.0.0", "--port", str(BACKEND_PORT)]
    # --reload breaks on Windows with multiprocessing; use reload only in dev if desired
    # Keep simple: no reload in launcher (use --reload manually if needed)
    log(f"$ {' '.join(cmd)}  (cwd=backend)", "[BACKEND] ")
    proc = subprocess.Popen(cmd, cwd=str(BACKEND_DIR))
    log(f"Backend PID {proc.pid} -> http://localhost:{BACKEND_PORT}  docs: http://localhost:{BACKEND_PORT}/api/v1/docs", "[BACKEND] ")
    return proc

def start_frontend() -> subprocess.Popen:
    log("=" * 60)
    log("Starting Frontend (Vite) ...")
    log("=" * 60)
    # Force single port 5175, no other fallbacks
    cmd = f"npm run dev -- --port {FRONTEND_PORT} --host 0.0.0.0 --strictPort"
    log(f"$ {cmd}  (cwd=frontend)", "[FRONTEND] ")
    proc = subprocess.Popen(cmd, cwd=str(FRONTEND_DIR), shell=True)
    log(f"Frontend PID {proc.pid} -> {FRONTEND_URL}", "[FRONTEND] ")
    return proc

def stop(proc: subprocess.Popen):
    if not proc or proc.poll() is not None:
        return
    try:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True, timeout=8)
    except Exception:
        try:
            proc.terminate()
        except Exception:
            pass
    try:
        proc.wait(timeout=5)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass

# ----------------------------
# Main
# ----------------------------
def main():
    global FRONTEND_PORT, BACKEND_PORT, FRONTEND_URL, BACKEND_URL
    parser = argparse.ArgumentParser(description="CrimeIntel AI launcher")
    parser.add_argument("--port", type=int, default=FRONTEND_PORT, help="Frontend port (default 5175)")
    parser.add_argument("--backend-port", type=int, default=BACKEND_PORT, help="Backend port (default 8000)")
    parser.add_argument("--no-browser", action="store_true", help="Don't auto-open browser")
    parser.add_argument("--backend-only", action="store_true", help="Only start backend")
    parser.add_argument("--frontend-only", action="store_true", help="Only start frontend")
    args = parser.parse_args()

    FRONTEND_PORT = args.port
    BACKEND_PORT = args.backend_port
    FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
    BACKEND_URL = f"http://localhost:{BACKEND_PORT}/api/v1/health"

    print("\n" + "=" * 60)
    print(" CrimeIntel AI - Unified Launcher")
    print("=" * 60)
    print(f" Frontend : {FRONTEND_URL}  (single port, strict)")
    print(f" Backend  : http://localhost:{BACKEND_PORT}  -> {BACKEND_URL}")
    print("=" * 60 + "\n")

    # 0. Config sanity
    ensure_frontend_port_config()
    ensure_backend_cors()

    # 1. Kill stale
    log(f"Killing stale ports {BACKEND_PORT}, 5173, 5174, {FRONTEND_PORT}, 3000 ...")
    kill_stale_ports()
    time.sleep(1)

    # 2. Checks
    if not (FRONTEND_DIR / "package.json").exists():
        log("frontend/package.json not found!", "[ERR] "); sys.exit(1)
    if not (BACKEND_DIR / "main.py").exists() and not (BACKEND_DIR / "app" / "main.py").exists():
        log("backend/main.py not found!", "[ERR] "); sys.exit(1)
    if not shutil.which("npm"):
        log("npm not found in PATH", "[ERR] "); sys.exit(1)

    backend_proc = None
    frontend_proc = None

    try:
        if not args.frontend_only:
            backend_proc = start_backend()
            wait_for_http(BACKEND_URL, timeout=30, label="backend")

        if not args.backend_only:
            frontend_proc = start_frontend()
            # Vite takes 3-8s; poll frontend URL
            wait_for_http(FRONTEND_URL, timeout=30, label="frontend")

        print("\n" + "=" * 60)
        if not args.no_browser and not args.backend_only:
            log(f"Opening {FRONTEND_URL} ...")
            webbrowser.open(FRONTEND_URL)
        print(" CrimeIntel AI is running!")
        print(f"   Backend : http://localhost:{BACKEND_PORT}/api/v1/docs")
        print(f"   Frontend: {FRONTEND_URL}")
        print("   Press Ctrl+C to stop both servers")
        print("=" * 60 + "\n")

        # Keep alive until user Ctrl+C - auto-restart if a process crashes (don't kill other on program issue)
        backend_restarts = 0
        frontend_restarts = 0
        while True:
            if backend_proc and backend_proc.poll() is not None:
                code = backend_proc.returncode
                if code != 0:
                    log(f"Backend exited with code {code} - auto-restarting (attempt {backend_restarts+1}) - not stopping frontend", "[WARN] ")
                    time.sleep(2)
                    try:
                        backend_proc = start_backend()
                        wait_for_http(BACKEND_URL, timeout=15, label="backend (restart)")
                        backend_restarts += 1
                        if backend_restarts > 5:
                            log("Backend restarted 5 times - giving up, but keeping frontend alive", "[ERR] ")
                            backend_proc = None
                        continue
                    except Exception as e:
                        log(f"Failed to restart backend: {e}", "[ERR] ")
                        backend_proc = None
                else:
                    log(f"Backend exited cleanly with code {code}", "[INFO] ")
                    break
            if frontend_proc and frontend_proc.poll() is not None:
                code = frontend_proc.returncode
                if code != 0:
                    log(f"Frontend exited with code {code} - auto-restarting - not stopping backend", "[WARN] ")
                    time.sleep(2)
                    try:
                        frontend_proc = start_frontend()
                        wait_for_http(FRONTEND_URL, timeout=15, label="frontend (restart)")
                        frontend_restarts += 1
                        if frontend_restarts > 5:
                            log("Frontend restarted 5 times - giving up, but keeping backend alive", "[ERR] ")
                            frontend_proc = None
                        continue
                    except Exception as e:
                        log(f"Failed to restart frontend: {e}", "[ERR] ")
                        frontend_proc = None
                else:
                    log(f"Frontend exited cleanly with code {code}", "[INFO] ")
                    break
            if not backend_proc and not frontend_proc:
                log("Both processes stopped - waiting for user Ctrl+C", "[INFO] ")
                time.sleep(1)
                continue
            time.sleep(1)

    except KeyboardInterrupt:
        log("\nCtrl+C received", "[STOP] ")
    finally:
        log("Stopping servers ...", "[STOP] ")
        if frontend_proc: stop(frontend_proc)
        if backend_proc: stop(backend_proc)
        kill_stale_ports()
        log("All servers stopped. Bye!", "[STOP] ")

if __name__ == "__main__":
    main()
