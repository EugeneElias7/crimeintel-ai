from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from utils.constants import RoleEnum
from utils.validators import validate_email, validate_password, validate_role


class UserBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    role: str = Field(default=RoleEnum.OFFICER.value)
    badge_number: Optional[str] = Field(default=None, max_length=50)
    phone: Optional[str] = Field(default=None, max_length=20)
    status: str = Field(default="active", max_length=20)

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        return validate_email(v)

    @field_validator("role")
    @classmethod
    def _validate_role(cls, v: str) -> str:
        return validate_role(v)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def _validate_password(cls, v: str) -> str:
        return validate_password(v)


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[str] = Field(default=None, max_length=255)
    role: Optional[str] = None
    badge_number: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_email(v)
        return v

    @field_validator("role")
    @classmethod
    def _validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_role(v)
        return v

    @field_validator("password")
    @classmethod
    def _validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_password(v)
        return v


class UserResponse(BaseModel):
    user_id: str
    display_name: str
    email: str
    role: str
    badge_number: Optional[str] = None
    phone: Optional[str] = None
    status: str
    created_at: str
    updated_at: str


class UserProfileResponse(BaseModel):
    user_id: str
    display_name: str
    email: str
    role: str
    badge_number: Optional[str] = None
    phone: Optional[str] = None
    status: str
    created_at: str
    updated_at: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfileResponse
