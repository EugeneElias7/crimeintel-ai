from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from datetime import datetime, timedelta
import random

from .models import Case, Evidence, User, CaseEvent
from .database import SessionLocal
from .geo_utils import validate_case_coordinates, get_district_center

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/overview")
def analytics_overview(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """GET /analytics/overview"""
    query = db.query(Case)
    
    if from_date:
        query = query.filter(Case.created_at >= from_date)
    if to_date:
        query = query.filter(Case.created_at <= to_date)
    
    total_cases = query.count()
    
    open_cases = query.filter(Case.status == "open").count()
    under_investigation = query.filter(Case.status == "under_investigation").count()
    closed_cases = query.filter(Case.status == "resolved").count()
    filed_cases = query.filter(Case.status == "filed").count()
    
    clearance_rate = (closed_cases / total_cases * 100) if total_cases > 0 else 0
    
    resolved_cases = query.filter(Case.status == "resolved", Case.resolved_at.isnot(None)).all()
    avg_days = 0
    if resolved_cases:
        total_days = sum((c.resolved_at - c.created_at).days for c in resolved_cases if c.resolved_at and c.created_at)
        avg_days = total_days / len(resolved_cases) if resolved_cases else 0
    
    recent_activity = db.query(CaseEvent).order_by(desc(CaseEvent.created_at)).limit(5).all()
    activity_list = []
    for ev in recent_activity:
        user = db.query(User).filter(User.id == ev.created_by_id).first() if ev.created_by_id else None
        activity_list.append({
            "id": ev.id,
            "action": ev.event_type,
            "entity_type": "case",
            "entity_id": ev.case_id,
            "user": user.username if user else "system",
            "created_at": ev.created_at.isoformat() if ev.created_at else "",
        })
    
    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "closed_cases": closed_cases,
        "filed_cases": filed_cases,
        "clearance_rate": round(clearance_rate, 2),
        "avg_resolution_days": round(avg_days, 1),
        "period": {
            "from_date": from_date or "",
            "to_date": to_date or ""
        },
        "recent_activity": activity_list
    }


@router.get("/distribution")
def analytics_distribution(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """GET /analytics/distribution"""
    query = db.query(Case)
    
    if from_date:
        query = query.filter(Case.created_at >= from_date)
    if to_date:
        query = query.filter(Case.created_at <= to_date)
    
    results = query.with_entities(
        Case.category,
        func.count(Case.id).label("count")
    ).group_by(Case.category).order_by(desc("count")).all()
    
    total = sum(r.count for r in results)
    
    return [
        {
            "crime_type": r.category,
            "count": r.count,
            "percentage": round(r.count / total * 100, 2) if total > 0 else 0
        }
        for r in results
    ]


@router.get("/trends")
def analytics_trends(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """GET /analytics/trends"""
    query = db.query(Case)
    
    if from_date:
        query = query.filter(Case.created_at >= from_date)
    if to_date:
        query = query.filter(Case.created_at <= to_date)
    
    results = query.with_entities(
        func.strftime('%Y-%m', Case.created_at).label("month"),
        func.count(Case.id).label("total"),
        func.count(Case.id).filter(Case.status == "open").label("open"),
        func.count(Case.id).filter(Case.status == "resolved").label("closed")
    ).group_by(func.strftime('%Y-%m', Case.created_at)).order_by("month").all()
    
    return [
        {
            "month": r.month,
            "total": r.total,
            "open": r.open,
            "closed": r.closed
        }
        for r in results
    ]


@router.get("/by-district")
def analytics_by_district(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """GET /analytics/by-district"""
    query = db.query(Case)
    
    if from_date:
        query = query.filter(Case.created_at >= from_date)
    if to_date:
        query = query.filter(Case.created_at <= to_date)
    
    results = query.with_entities(
        Case.district,
        func.count(Case.id).label("count")
    ).group_by(Case.district).order_by(desc("count")).all()
    
    return [
        {"district": r.district, "count": r.count}
        for r in results
    ]


@router.get("/heatmap/data")
def analytics_heatmap_data(
    crime_type: Optional[str] = None,
    district: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """GET /analytics/heatmap/data - Returns ONLY cases with valid coordinates for heatmap"""
    query = db.query(Case)
    
    if crime_type:
        query = query.filter(Case.category == crime_type)
    if district:
        query = query.filter(Case.district == district)
    if from_date:
        query = query.filter(Case.created_at >= from_date)
    if to_date:
        query = query.filter(Case.created_at <= to_date)
    
    # Only fetch cases with coordinates
    query = query.filter(Case.latitude.isnot(None), Case.longitude.isnot(None))
    cases = query.limit(5000).all()
    
    points = []
    invalid_count = 0
    
    for case in cases:
        # Validate coordinates for this specific case
        is_valid, error, lat, lng = validate_case_coordinates(case.latitude, case.longitude)
        
        if not is_valid:
            invalid_count += 1
            print(f"[HEATMAP] Invalid coordinates for {case.case_number}: {error}")
            continue
        
        # Use the validated coordinates for this exact case
        points.append({
            "case_id": case.case_number,
            "latitude": lat,
            "longitude": lng,
            "crime_type": case.category,
            "status": case.status,
            "date_filed": case.created_at.isoformat() if case.created_at else "",
            "district": case.district,
            "intensity": 0.5 + (random.random() * 0.5),
            "location": case.locality or case.district
        })
    
    if invalid_count > 0:
        print(f"[HEATMAP] Excluded {invalid_count} cases with invalid coordinates")
    
    return points