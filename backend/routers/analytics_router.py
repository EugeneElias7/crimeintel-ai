import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from middleware.auth_middleware import get_current_user, require_role
from models.analytics import (
    DistributionItem,
    DistrictItem,
    HeatMapItem,
    OverviewResponse,
    PeriodInfo,
    TrendItem,
)
from models.common import SuccessResponse
from services.analytics_service import AnalyticsService
from adapters.db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

analytics_service = AnalyticsService(db=db)


@router.get(
    "/overview",
    response_model=OverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get overview analytics",
)
async def get_overview(
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
):
    try:
        result = await analytics_service.get_overview(from_date=from_date, to_date=to_date)
        return OverviewResponse(
            total_cases=result["total_cases"],
            open_cases=result["open_cases"],
            closed_cases=result["closed_cases"],
            filed_cases=result["filed_cases"],
            clearance_rate=result["clearance_rate"],
            avg_resolution_days=result["avg_resolution_days"],
            period=PeriodInfo(from_date=result["period"]["from_date"], to_date=result["period"]["to_date"]),
        )
    except Exception as e:
        logger.exception("Failed to get analytics overview: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics overview.",
        )


@router.get(
    "/distribution",
    response_model=list[DistributionItem],
    status_code=status.HTTP_200_OK,
    summary="Get crime type distribution",
)
async def get_distribution(
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
):
    try:
        result = await analytics_service.get_distribution(from_date=from_date, to_date=to_date)
        return [DistributionItem(**item) for item in result]
    except Exception as e:
        logger.exception("Failed to get distribution analytics: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve crime distribution.",
        )


@router.get(
    "/trends",
    response_model=list[TrendItem],
    status_code=status.HTTP_200_OK,
    summary="Get monthly crime trends",
)
async def get_trends(
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
):
    try:
        result = await analytics_service.get_trends(from_date=from_date, to_date=to_date)
        return [TrendItem(**item) for item in result]
    except Exception as e:
        logger.exception("Failed to get trend analytics: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trends.",
        )


@router.get(
    "/by-district",
    response_model=list[DistrictItem],
    status_code=status.HTTP_200_OK,
    summary="Get case counts by district",
)
async def get_by_district(
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
):
    try:
        result = await analytics_service.get_by_district(from_date=from_date, to_date=to_date)
        return [DistrictItem(**item) for item in result]
    except Exception as e:
        logger.exception("Failed to get district analytics: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve district breakdown.",
        )


@router.get(
    "/by-officer",
    response_model=list[dict],
    status_code=status.HTTP_200_OK,
    summary="Get case counts by officer (admin only)",
)
async def get_by_officer(
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
):
    try:
        all_cases = await db.get_all("Cases")
        if not all_cases:
            return []

        all_users = await db.get_all("Users")
        user_map = {}
        for u in all_users or []:
            uid = u.get("ROWID") or u.get("user_id")
            user_map[uid] = u.get("display_name", "Unknown")

        officer_counts: dict = {}
        for case in all_cases:
            oid = case.get("officer_id", "")
            if not oid:
                continue
            date_str = case.get("date_filed") or case.get("created_at", "")
            if from_date and date_str < from_date:
                continue
            if to_date and date_str > to_date:
                continue
            officer_counts[oid] = officer_counts.get(oid, 0) + 1

        return [
            {"officer_id": oid, "display_name": user_map.get(oid, "Unknown"), "case_count": count}
            for oid, count in sorted(officer_counts.items(), key=lambda x: x[1], reverse=True)
        ]
    except Exception as e:
        logger.exception("Failed to get by-officer analytics: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve officer breakdown.",
        )


@router.get(
    "/heatmap/data",
    response_model=list[HeatMapItem],
    status_code=status.HTTP_200_OK,
    summary="Get heat map data for crime incidents",
)
async def get_heatmap_data(
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
    crime_type: Optional[str] = Query(default=None, description="Filter by crime type"),
    district: Optional[str] = Query(default=None, description="Filter by district"),
):
    try:
        all_cases = await db.get_all("Cases")
        if not all_cases:
            return []

        # Normalize district aliases to handle Shimoga/Shivamogga etc.
        DISTRICT_ALIAS = {
            "bengaluru urban": "bangalore urban",
            "bengaluru rural": "bangalore rural",
            "mysuru": "mysore",
            "tumakuru": "tumkur",
            "belagavi": "belgaum",
            "shivamogga": "shimoga",
            "kalaburagi": "gulbarga",
            "chamarajanagar": "chamarajanagar",
            "chikkmagaluru": "chikkamagaluru",
        }
        def normalize_district(d: str) -> str:
            if not d:
                return ""
            ld = d.strip().lower()
            return DISTRICT_ALIAS.get(ld, ld)

        def normalize_date(s: str) -> str:
            if not s:
                return ""
            ss = str(s).strip()
            return ss[:10] if len(ss) >= 10 and ss[4] == "-" else ss

        norm_district = normalize_district(district) if district else None
        norm_from = normalize_date(from_date) if from_date else None
        norm_to = normalize_date(to_date) if to_date else None
        norm_crime = crime_type.lower().strip() if crime_type else None

        filtered = []
        missing_coords = 0
        for case in all_cases:
            date_str = case.get("date_filed") or case.get("created_at", "")
            norm_date = normalize_date(date_str)
            if norm_from and norm_date and norm_date < norm_from:
                continue
            if norm_to and norm_date and norm_date > norm_to:
                continue
            if norm_crime and (case.get("crime_type") or "").lower().strip() != norm_crime:
                continue
            if norm_district and normalize_district(case.get("district") or "") != norm_district:
                continue

            lat = case.get("latitude")
            lon = case.get("longitude")
            if lat is None or lon is None:
                missing_coords += 1
                continue

            filtered.append(HeatMapItem(
                case_id=case.get("case_id") or case.get("ROWID") or "",
                crime_type=case.get("crime_type", ""),
                status=case.get("status", ""),
                date_filed=date_str,
                district=case.get("district", ""),
                latitude=float(lat),
                longitude=float(lon),
                intensity=1.0,
            ))

        if missing_coords > 0:
            logger.info("Heatmap: %d cases missing coordinates", missing_coords)

        return filtered
    except Exception as e:
        logger.exception("Failed to get heatmap data: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve heatmap data.",
        )
