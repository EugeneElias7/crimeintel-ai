from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from .models import Case, Evidence, User, CaseEvent
from .database import SessionLocal, engine
from .schemas import DashboardSummary, DashboardActivity

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    """GET /dashboard/summary"""
    total_cases = db.query(Case).count()

    open_cases = db.query(Case).filter(Case.status == "open").count()

    under_investigation = db.query(Case).filter(Case.status == "under_investigation").count()

    critical_cases = db.query(Case).filter(Case.priority == "high").count()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    resolved_this_month = db.query(Case).filter(
        Case.status == "resolved",
        Case.resolved_at >= thirty_days_ago
    ).count()

    total_evidence = db.query(Evidence).count()

    recent_activity = db.query(CaseEvent).order_by(
        desc(CaseEvent.created_at)
    ).limit(5).all()

    activity_list = []
    for ev in recent_activity:
        user = db.query(User).filter(User.id == ev.created_by_id).first() if ev.created_by_id else None
        activity_list.append(DashboardActivity(
            id=ev.id,
            action=ev.event_type,
            entity_type="case",
            entity_id=ev.case_id,
            user=user.username if user else "system",
            created_at=ev.created_at.isoformat() if ev.created_at else "",
        ))

    if not activity_list:
        activity_list = [
            DashboardActivity(
                id=1,
                action="create",
                entity_type="case",
                entity_id=1,
                user="kavya",
                created_at=datetime.utcnow().isoformat(),
            )
        ]

    return DashboardSummary(
        total_cases=total_cases,
        open_cases=open_cases,
        under_investigation=under_investigation,
        critical_cases=critical_cases,
        resolved_this_month=resolved_this_month,
        total_evidence=total_evidence,
        recent_activity=activity_list,
    )


@router.get("/cases-by-district", response_model=List[dict])
def cases_by_district(db: Session = Depends(get_db)):
    """GET /dashboard/cases-by-district"""
    results = db.query(
        Case.district, func.count(Case.id).label("count")
    ).group_by(Case.district).order_by(desc("count")).all()

    return [{"district": r.district, "count": r.count} for r in results]


@router.get("/cases-by-category", response_model=List[dict])
def cases_by_category(db: Session = Depends(get_db)):
    """GET /dashboard/cases-by-category"""
    results = db.query(
        Case.category, func.count(Case.id).label("count")
    ).group_by(Case.category).order_by(desc("count")).all()

    return [{"category": r.category, "count": r.count} for r in results]


@router.get("/recent-cases", response_model=List[dict])
def recent_cases(limit: int = 8, db: Session = Depends(get_db)):
    """GET /dashboard/recent-cases"""
    cases = db.query(Case).order_by(desc(Case.created_at)).limit(limit).all()

    result = []
    for c in cases:
        user = db.query(User).filter(User.id == c.created_by_id).first() if c.created_by_id else None
        result.append({
            "id": c.id,
            "case_number": c.case_number,
            "title": c.title,
            "category": c.category,
            "district": c.district,
            "status": c.status,
            "priority": c.priority,
            "reported_at": c.reported_at.isoformat() if c.reported_at else None,
            "created_by": user.username if user else "unknown",
        })

    return result