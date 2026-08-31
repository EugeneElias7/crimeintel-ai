import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base
from app.models import User, Case, Evidence, CaseEvent, VerificationDocument

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# Test registration
print("Testing registration...")
reg_data = {
    "full_name": "Test Officer",
    "email": "test@ksp.gov.in",
    "employee_id": "TEST123",
    "department": "Karnataka State Police",
    "designation": "Sub Inspector",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123"
}
response = client.post("/api/v1/auth/register", json=reg_data)
print(f"Registration status: {response.status_code}")
print(f"Registration response: {response.json()}")

if response.status_code == 200:
    user_id = response.json().get("user_id")
    print(f"User ID: {user_id}")
    
    # Test document upload
    print("\nTesting document upload...")
    import io
    dummy_file = io.BytesIO(b"dummy pdf content")
    
    response = client.post(
        "/api/v1/auth/upload-document",
        data={"user_id": user_id, "document_type": "EMPLOYEE_ID"},
        files={"file": ("test.pdf", dummy_file, "application/pdf")}
    )
    print(f"Upload status: {response.status_code}")
    print(f"Upload response: {response.json()}")
    
    if response.status_code == 200:
        doc_id = response.json().get("document_id")
        print(f"Document ID: {doc_id}")
        
        # Test verification status
        print("\nTesting verification status...")
        response = client.get(f"/api/v1/auth/verification-status/{user_id}")
        print(f"Status check: {response.status_code}")
        print(f"Status response: {response.json()}")

        # Test admin approve
        print("\nTesting admin approve...")
        # Create admin user
        admin_data = {
            "full_name": "Admin User",
            "email": "admin@ksp.gov.in",
            "employee_id": "ADMIN001",
            "department": "Karnataka State Police",
            "designation": "DGP",
            "password": "AdminPass123",
            "confirm_password": "AdminPass123"
        }
        response = client.post("/api/v1/auth/register", json=admin_data)
        print(f"Admin registration: {response.status_code}")
        
        # Login as admin
        login_data = {"email": "admin@ksp.gov.in", "password": "AdminPass123"}
        response = client.post("/api/v1/auth/login", json=login_data)
        print(f"Admin login: {response.status_code}")
        
        if response.status_code == 200:
            admin_token = response.json().get("access_token")
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            
            # Approve the user
            response = client.post(
                f"/api/v1/auth/admin/verify-user/{user_id}",
                headers=admin_headers,
                json={"action": "approve"}
            )
            print(f"Admin approve: {response.status_code}")
            print(f"Approve response: {response.json()}")
            
            # Check verification status again
            print("\nTesting verification status after approval...")
            response = client.get(f"/api/v1/auth/verification-status/{user_id}")
            print(f"Status check: {response.status_code}")
            print(f"Status response: {response.json()}")

            # Test login as approved user
            print("\nTesting login as approved user...")
            login_data = {"email": "test@ksp.gov.in", "password": "SecurePass123"}
            response = client.post("/api/v1/auth/login", json=login_data)
            print(f"User login: {response.status_code}")
            print(f"User login response: {response.json()}")

print("\nAll tests completed!")