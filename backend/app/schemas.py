from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from enum import Enum


class UserRole(str, Enum):
    OFFICER = "OFFICER"
    INSPECTOR = "INSPECTOR"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class AccountStatus(str, Enum):
    PENDING_DOCUMENT = "PENDING_DOCUMENT"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DocumentType(str, Enum):
    EMPLOYEE_ID = "EMPLOYEE_ID"
    POLICE_ID = "POLICE_ID"
    OTHER_GOVERNMENT_ID = "OTHER_GOVERNMENT_ID"


class DashboardActivity(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: int
    user: str
    created_at: str


class DashboardSummary(BaseModel):
    total_cases: int
    open_cases: int
    under_investigation: int
    critical_cases: int
    resolved_this_month: int
    total_evidence: int
    recent_activity: List[DashboardActivity]


# Auth schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: "UserResponse"


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    employee_id: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=255)
    designation: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Officer Arun Kumar",
                "email": "arun.kumar@ksp.gov.in",
                "employee_id": "KSP12345",
                "department": "Karnataka State Police",
                "designation": "Sub Inspector",
                "password": "SecurePass123",
                "confirm_password": "SecurePass123"
            }
        }


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    redirect_url: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    employee_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    role: UserRole
    account_status: AccountStatus
    is_active: bool
    created_at: datetime


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


# Verification Document schemas
class DocumentUploadResponse(BaseModel):
    message: str
    document_id: int
    redirect_url: str


class VerificationDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    document_type: DocumentType
    original_filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    verification_status: VerificationStatus
    uploaded_at: datetime
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None


class VerificationStatusResponse(BaseModel):
    account_status: AccountStatus
    document_status: Optional[VerificationStatus] = None
    document: Optional[VerificationDocumentResponse] = None


class AdminUserListResponse(BaseModel):
    users: List[UserResponse]
    total: int


class AdminVerificationActionRequest(BaseModel):
    action: str  # "approve" or "reject"
    rejection_reason: Optional[str] = None


# Add forward reference resolution
LoginResponse.model_rebuild()