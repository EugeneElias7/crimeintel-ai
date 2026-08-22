from pydantic import BaseModel
from typing import List


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