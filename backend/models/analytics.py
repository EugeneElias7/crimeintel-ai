from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PeriodInfo(BaseModel):
    from_date: str
    to_date: str


class OverviewResponse(BaseModel):
    total_cases: int
    open_cases: int
    closed_cases: int
    filed_cases: int
    clearance_rate: float = Field(default=0.0, ge=0.0, le=100.0)
    avg_resolution_days: float = Field(default=0.0, ge=0.0)
    period: PeriodInfo


class DistributionItem(BaseModel):
    crime_type: str
    count: int
    percentage: float = Field(default=0.0, ge=0.0, le=100.0)


class TrendItem(BaseModel):
    month: str
    total: int
    open: int
    closed: int


class DistrictItem(BaseModel):
    district: str
    count: int


class HeatMapItem(BaseModel):
    case_id: str
    crime_type: str
    status: str
    date_filed: str
    district: str
    latitude: float
    longitude: float
    intensity: float = 1.0


class StatusBreakdown(BaseModel):
    status: str
    count: int
    percentage: float = Field(default=0.0, ge=0.0, le=100.0)


class AnalyticsResponse(BaseModel):
    overview: OverviewResponse
    crime_distribution: List[DistributionItem] = []
    trends: List[TrendItem] = []
    district_breakdown: List[DistrictItem] = []
    status_breakdown: List[StatusBreakdown] = []
