from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import jwt

from .models import User, VerificationDocument, UserRole, AccountStatus, VerificationStatus, DocumentType
from .schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
    ChangePasswordRequest,
    DocumentUploadResponse,
    VerificationDocumentResponse,
    VerificationStatusResponse,
    AdminVerificationActionRequest,
)
from .database import SessionLocal, engine
from .security import hash_password, verify_password
from .storage import get_storage_service

router = APIRouter(prefix="/auth", tags=["authentication"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id) -> Optional[User]:
    try:
        # Handle both int and string IDs - SQLite uses string UUIDs, SQLAlchemy uses int
        if isinstance(user_id, str):
            # Try direct int conversion for legacy IDs like "1"
            try:
                int_id = int(user_id)
                result = db.query(User).filter(User.id == int_id).first()
                if result:
                    return result
            except ValueError:
                pass
            # Try string-based lookup for UUIDs - check if column supports it
            # For SQLAlchemy model with int PK, string UUIDs won't match - return None gracefully
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def get_user_by_employee_id(db: Session, employee_id: str) -> Optional[User]:
    return db.query(User).filter(User.employee_id == employee_id).first()


async def get_current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


@router.post("/register", response_model=RegisterResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if request.password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists. Please sign in."
        )

    existing_employee = get_user_by_employee_id(db, request.employee_id)
    if existing_employee:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee ID already registered. Please sign in."
        )

    username = request.email.split("@")[0]
    base_username = username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1

    password_hash = hash_password(request.password)

    user = User(
        username=username,
        email=request.email,
        full_name=request.full_name,
        password_hash=password_hash,
        employee_id=request.employee_id,
        department=request.department,
        designation=request.designation,
        role=UserRole.OFFICER,
        account_status=AccountStatus.PENDING_DOCUMENT,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        message="Registration successful. Please proceed to identity verification.",
        user_id=user.id,
        redirect_url="/verify-identity"
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    if user.account_status == AccountStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been rejected. Please contact administrator."
        )

    if user.account_status in [AccountStatus.PENDING_DOCUMENT, AccountStatus.PENDING_VERIFICATION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Your account is pending verification. Please complete the identity verification process.", "user_id": user.id, "account_status": user.account_status.value}
        )

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role.value}
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )

    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.password_hash = hash_password(request.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Password changed successfully"}


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_verification_document(
    user_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.account_status != AccountStatus.PENDING_DOCUMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document upload not allowed for current account status"
        )

    try:
        doc_type = DocumentType(document_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document type"
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: PDF, JPG, JPEG, PNG"
        )

    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds limit of {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    storage = get_storage_service()
    stored_filename, file_path, file_size = storage.save_document(
        user_id=user_id,
        file_content=file_content,
        original_filename=file.filename or "document",
        mime_type=file.content_type
    )

    document = VerificationDocument(
        user_id=user_id,
        document_type=doc_type,
        original_filename=file.filename or "document",
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        verification_status=VerificationStatus.PENDING,
    )

    db.add(document)

    user.account_status = AccountStatus.PENDING_VERIFICATION
    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(document)

    return DocumentUploadResponse(
        message="Document uploaded successfully. Your account is now pending verification.",
        document_id=document.id,
        redirect_url="/verification-pending"
    )


@router.get("/verification-status/{user_id}", response_model=VerificationStatusResponse)
def get_verification_status(user_id: str, db: Session = Depends(get_db)):
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    document = db.query(VerificationDocument).filter(
        VerificationDocument.user_id == user_id
    ).first()

    doc_response = None
    if document:
        doc_response = VerificationDocumentResponse.model_validate(document)

    return VerificationStatusResponse(
        account_status=user.account_status,
        document_status=document.verification_status if document else None,
        document=doc_response
    )


@router.get("/document/{document_id}")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(VerificationDocument).filter(
        VerificationDocument.id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and current_user.id != document.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document"
        )

    file_path = document.file_path
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found"
        )

    return FileResponse(
        path=file_path,
        filename=document.original_filename,
        media_type=document.mime_type
    )


@router.post("/admin/verify-user/{user_id}")
def admin_verify_user(
    user_id: int,
    request: AdminVerificationActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    document = db.query(VerificationDocument).filter(
        VerificationDocument.user_id == user_id
    ).first()

    if request.action == "approve":
        user.account_status = AccountStatus.APPROVED
        if document:
            document.verification_status = VerificationStatus.APPROVED
            document.reviewed_at = datetime.utcnow()
            document.reviewed_by = current_user.id
    elif request.action == "reject":
        user.account_status = AccountStatus.REJECTED
        if document:
            document.verification_status = VerificationStatus.REJECTED
            document.reviewed_at = datetime.utcnow()
            document.reviewed_by = current_user.id
            document.rejection_reason = request.rejection_reason
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Use 'approve' or 'reject'"
        )

    user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": f"User {request.action}d successfully"}