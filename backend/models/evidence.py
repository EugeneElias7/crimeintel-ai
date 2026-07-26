from typing import Optional

from pydantic import BaseModel, Field


class UploadedBy(BaseModel):
    user_id: str
    display_name: str


class EvidenceResponse(BaseModel):
    evidence_id: str
    case_id: str
    file_name: str
    file_type: str
    file_size: int
    file_url: str
    description: Optional[str] = None
    sensitive: bool = False
    uploaded_by: UploadedBy
    uploaded_at: str


class EvidenceUploadResponse(BaseModel):
    evidence_id: str
    file_name: str
    file_type: str
    file_size: int
    uploaded_at: str


class EvidenceCreate(BaseModel):
    file_name: str = Field(..., max_length=255)
    file_type: str = Field(..., max_length=50)
    file_size: int = Field(..., ge=0)
    file_url: str = Field(..., max_length=1024)
    description: Optional[str] = Field(default=None, max_length=2000)
    sensitive: bool = False
    uploaded_by: str
