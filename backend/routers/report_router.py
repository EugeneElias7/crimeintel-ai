import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from middleware.auth_middleware import get_current_user
from models.common import SuccessResponse
from services.case_service import CaseService
from services.evidence_service import EvidenceService
from services.analytics_service import AnalyticsService
from adapters.catalyst_db import catalyst_db
from adapters.catalyst_fs import catalyst_fs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])

case_service = CaseService(db=catalyst_db)
evidence_service = EvidenceService(db=catalyst_db, fs=catalyst_fs)
analytics_service = AnalyticsService(db=catalyst_db)


@router.get(
    "/case/{case_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get structured case report data",
)
async def get_case_report(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        case = await case_service.get_case(case_id)
        evidence_list = await evidence_service.list_evidence(case_id)

        timeline = case.get("timeline_events", [])
        suspects = case.get("suspects", [])
        witnesses = case.get("witnesses", [])

        report = {
            "case_info": {
                "case_id": case.get("case_id"),
                "fir_number": case.get("fir_number"),
                "crime_type": case.get("crime_type"),
                "status": case.get("status"),
                "date_filed": case.get("date_filed"),
                "location": case.get("location"),
                "district": case.get("district"),
                "description": case.get("description"),
                "priority": case.get("priority"),
                "officer": case.get("officer"),
            },
            "evidence": [
                {
                    "evidence_id": e.get("evidence_id"),
                    "file_name": e.get("file_name"),
                    "file_type": e.get("file_type"),
                    "file_size": e.get("file_size"),
                    "description": e.get("description"),
                    "sensitive": e.get("sensitive", False),
                    "uploaded_at": e.get("uploaded_at"),
                }
                for e in evidence_list
            ],
            "timeline": [
                {
                    "event_id": t.get("event_id"),
                    "event_date": t.get("event_date"),
                    "event_type": t.get("event_type"),
                    "description": t.get("description"),
                    "officer": t.get("officer"),
                }
                for t in timeline
            ],
            "suspects": [
                {
                    "suspect_id": s.get("suspect_id"),
                    "name": s.get("name"),
                    "alias": s.get("alias"),
                    "age": s.get("age"),
                    "gender": s.get("gender"),
                    "status": s.get("status"),
                }
                for s in suspects
            ],
            "witnesses": [
                {
                    "witness_id": w.get("witness_id"),
                    "name": w.get("name"),
                    "contact": w.get("contact"),
                    "credibility_score": w.get("credibility_score"),
                    "status": w.get("status"),
                }
                for w in witnesses
            ],
            "summary": {
                "total_evidence": len(evidence_list),
                "total_suspects": len(suspects),
                "total_witnesses": len(witnesses),
                "total_timeline_events": len(timeline),
            },
        }

        return SuccessResponse(data=report, message="Case report generated successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to generate case report for %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate case report.",
        )


@router.get(
    "/summary",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get summary report with KPIs and crime distribution",
)
async def get_summary_report(
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
    district: Optional[str] = Query(default=None, description="Filter by district"),
):
    try:
        overview = await analytics_service.get_overview(from_date=from_date, to_date=to_date)
        distribution = await analytics_service.get_distribution(from_date=from_date, to_date=to_date)
        trends = await analytics_service.get_trends(from_date=from_date, to_date=to_date)
        by_district = await analytics_service.get_by_district(from_date=from_date, to_date=to_date)

        if district:
            by_district = [d for d in by_district if d["district"] == district]

        report = {
            "period": {"from": from_date or "", "to": to_date or ""},
            "district_filter": district,
            "kpis": {
                "total_cases": overview["total_cases"],
                "open_cases": overview["open_cases"],
                "closed_cases": overview["closed_cases"],
                "filed_cases": overview["filed_cases"],
                "clearance_rate": overview["clearance_rate"],
                "avg_resolution_days": overview["avg_resolution_days"],
            },
            "crime_distribution": distribution,
            "trends": trends,
            "district_breakdown": by_district,
        }

        return SuccessResponse(data=report, message="Summary report generated successfully.")
    except Exception as e:
        logger.exception("Failed to generate summary report: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate summary report.",
        )
