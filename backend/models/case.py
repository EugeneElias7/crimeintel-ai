from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

from utils.validators import (
    validate_case_status,
    validate_latitude,
    validate_longitude,
)


class OfficerInfo(BaseModel):
    user_id: str
    display_name: str


class SuspectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    alias: Optional[str] = Field(default=None, max_length=255)
    photo_url: Optional[str] = Field(default=None, max_length=1024)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=500)
    identification_marks: Optional[str] = Field(default=None, max_length=500)
    known_associates: Optional[str] = Field(default=None, max_length=500)
    criminal_history: Optional[str] = Field(default=None, max_length=2000)
    status: str = Field(default="under_investigation", max_length=50)


class SuspectCreate(SuspectBase):
    pass


class SuspectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    alias: Optional[str] = None
    photo_url: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    identification_marks: Optional[str] = None
    known_associates: Optional[str] = None
    criminal_history: Optional[str] = None
    status: Optional[str] = None


class SuspectResponse(BaseModel):
    suspect_id: str
    case_id: str
    name: str
    alias: Optional[str] = None
    photo_url: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    identification_marks: Optional[str] = None
    known_associates: Optional[str] = None
    criminal_history: Optional[str] = None
    status: str
    created_at: str
    updated_at: str


class WitnessBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contact: Optional[str] = Field(default=None, max_length=100)
    statement_summary: Optional[str] = Field(default=None, max_length=2000)
    credibility_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    status: str = Field(default="pending_contact", max_length=50)


class WitnessCreate(WitnessBase):
    pass


class WitnessUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    contact: Optional[str] = None
    statement_summary: Optional[str] = None
    credibility_score: Optional[float] = None
    status: Optional[str] = None


class WitnessResponse(BaseModel):
    witness_id: str
    case_id: str
    name: str
    contact: Optional[str] = None
    statement_summary: Optional[str] = None
    credibility_score: Optional[float] = None
    status: str
    created_at: str
    updated_at: str


class TimelineEventBase(BaseModel):
    event_date: str
    event_type: str = Field(..., max_length=100)
    description: str = Field(..., max_length=2000)
    officer_id: Optional[str] = None


class TimelineEventCreate(TimelineEventBase):
    pass


class TimelineEventUpdate(BaseModel):
    event_date: Optional[str] = None
    event_type: Optional[str] = None
    description: Optional[str] = None
    officer_id: Optional[str] = None


class TimelineEventResponse(BaseModel):
    event_id: str
    case_id: str
    event_date: str
    event_type: str
    description: str
    officer: Optional[Dict[str, Any]] = None
    created_at: str


class CaseBase(BaseModel):
    fir_number: str = Field(..., max_length=50)
    crime_type: str = Field(..., max_length=50)
    date_filed: str
    location: str = Field(..., max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: str = Field(..., max_length=100)
    description: str = Field(..., max_length=5000)
    officer_id: str
    priority: str = Field(default="medium", max_length=20)

    @field_validator("latitude")
    @classmethod
    def _validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        return validate_latitude(v)

    @field_validator("longitude")
    @classmethod
    def _validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        return validate_longitude(v)


class CaseCreate(CaseBase):
    status: str = Field(default="open", max_length=50)

    @field_validator("crime_type")
    @classmethod
    def _validate_crime_type(cls, v: str) -> str:
        from utils.constants import CrimeTypeEnum

        valid = {c.value for c in CrimeTypeEnum}
        if v not in valid:
            raise ValueError(
                f"Invalid crime type '{v}'. Must be one of: {', '.join(sorted(valid))}"
            )
        return v

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: str) -> str:
        return validate_case_status(v)

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: str) -> str:
        from utils.constants import PriorityEnum

        valid = {p.value for p in PriorityEnum}
        if v not in valid:
            raise ValueError(
                f"Invalid priority '{v}'. Must be one of: {', '.join(sorted(valid))}"
            )
        return v


class CaseUpdate(BaseModel):
    fir_number: Optional[str] = None
    crime_type: Optional[str] = None
    date_filed: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    description: Optional[str] = None
    officer_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

    @field_validator("latitude")
    @classmethod
    def _validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        return validate_latitude(v)

    @field_validator("longitude")
    @classmethod
    def _validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        return validate_longitude(v)

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_case_status(v)
        return v


class CaseListResponse(BaseModel):
    case_id: str
    fir_number: str
    crime_type: str
    status: str
    date_filed: str
    location: str
    district: str
    officer: OfficerInfo
    priority: str
    evidence_count: int = 0
    suspect_count: int = 0
    created_at: str
    updated_at: str


class CaseDetailResponse(BaseModel):
    case_id: str
    fir_number: str
    crime_type: str
    status: str
    date_filed: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: str
    description: str
    officer: OfficerInfo
    priority: str
    evidence_count: int = 0
    suspect_count: int = 0
    witness_count: int = 0
    suspects: List[SuspectResponse] = []
    witnesses: List[WitnessResponse] = []
    timeline_events: List[TimelineEventResponse] = []
    created_at: str
    updated_at: str
