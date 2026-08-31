import uvicorn
import sys
import time
import requests
import subprocess
import os

# Start the server in a subprocess
server_process = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"], cwd="C:/D drive/Datathon/backend")

# Wait for server to start
time.sleep(3)

try:
    # Test the register endpoint
    response = requests.post("http://localhost:8000/api/v1/auth/register", json={
        "full_name": "Test Officer",
        "email": "testofficer@ksp.gov.in",
        "employee_id": "TEST999",
        "department": "Karnataka State Police",
        "designation": "Constable",
        "password": "SecurePass123",
        "confirm_password": "SecurePass123"
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
finally:
    server_process.terminate()