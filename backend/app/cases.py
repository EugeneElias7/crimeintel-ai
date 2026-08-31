from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional
from datetime import datetime
from math import ceil

from .models import Case, User, Evidence, CaseEvent
from .database import SessionLocal

router = APIRouter(prefix="/cases", tags=["cases"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("")
def list_cases(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    crime_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    """GET /cases - List cases with pagination and filters"""
    query = db.query(Case)
    
    # Apply filters
    if crime_type:
        query = query.filter(Case.category == crime_type)
    if status:
        query = query.filter(Case.status == status)
    if district:
        query = query.filter(Case.district == district)
    if priority:
        query = query.filter(Case.priority == priority)
    if from_date:
        query = query.filter(Case.created_at >= from_date)
    if to_date:
        query = query.filter(Case.created_at <= to_date)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Case.case_number.ilike(search_term),
                Case.title.ilike(search_term),
                Case.description.ilike(search_term),
                Case.category.ilike(search_term),
                Case.district.ilike(search_term),
                Case.locality.ilike(search_term),
            )
        )
    
    # Total count before pagination
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Case, sort_by, Case.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Apply pagination
    offset = (page - 1) * limit
    cases = query.offset(offset).limit(limit).all()
    
    # Build response
    items = []
    for c in cases:
        user = db.query(User).filter(User.id == c.created_by_id).first() if c.created_by_id else None
        items.append({
            "case_id": c.case_number,
            "fir_number": c.case_number,
            "case_id": c.case_number,  # for backwards compat
            "description": c.description or "",
            "crime_type": c.category,
            "status": c.status,
            "priority": c.priority,
            "district": c.district,
            "location": c.locality,
            "date_filed": c.reported_at.isoformat() if c.reported_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "date_filed": c.reported_at.isoformat() if c.reported_at else None,
            "officer": {
                "user_id": user.id,
                "display_name": user.full_name,
            } if user else None,
            "witness_count": 0,
            "suspect_count": 0,
        })
    
    total_pages = ceil(total / limit)
    
    return {
        "data": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


@router.get("/search")
def search_cases(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """GET /cases/search - Search cases"""
    query = db.query(Case).filter(
        or_(
            Case.case_number.ilike(f"%{q}%"),
            Case.title.ilike(f"%{q}%"),
            Case.description.ilike(f"%{q}%"),
            Case.category.ilike(f"%{q}%"),
            Case.district.ilike(f"%{q}%"),
            Case.locality.ilike(f"%{q}%"),
        )
    )
    
    total = query.count()
    cases = query.order_by(desc(Case.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    items = []
    for c in cases:
        user = db.query(User).filter(User.id == c.created_by_id).first() if c.created_by_id else None
        items.append({
            "case_id": c.case_number,
            "fir_number": c.case_number,
            "case_id": c.case_number,
            "description": c.description or "",
            "crime_type": c.category,
            "status": c.status,
            "priority": c.priority,
            "district": c.district,
            "location": c.locality,
            "date_filed": c.reported_at.isoformat() if c.reported_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "date_filed": c.reported_at.isoformat() if c.reported_at else None,
            "officer": {
                "user_id": user.id,
                "display_name": user.full_name,
            } if user else None,
            "witness_count": 0,
            "suspect_count": 0,
        })
    
    total_pages = ceil(total / limit)
    
    return {
        "data": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


@router.get("/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    """GET /cases/{case_id} - Get case details"""
    case = db.query(Case).filter(Case.case_number == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    user = db.query(User).filter(User.id == case.created_by_id).first() if case.created_by_id else None
    evidence_list = db.query(Evidence).filter(Evidence.case_id == case.id).all()
    events = db.query(CaseEvent).filter(CaseEvent.case_id == case.id).order_by(CaseEvent.created_at).all()
    
    return {
        "case_id": case.case_number,
        "fir_number": case.case_number,
        "case_number": case.case_number,
        "description": case.description or "",
        "title": case.title,
        "description": case.description or "",
        "crime_type": case.category,
        "status": case.status,
        "priority": case.priority,
        "district": case.district,
        "location": case.locality,
        "latitude": case.latitude,
        "longitude": case.longitude,
        "date_filed": case.reported_at.isoformat() if case.reported_at else None,
        "date_updated": case.updated_at.isoformat() if case.updated_at else None,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "date_filed": case.reported_at.isoformat() if case.reported_at else None,
        "date_closed": case.resolved_at.isoformat() if case.resolved_at else None,
        "officer": {
            "user_id": case.created_by_id,
            "display_name": "Unknown",
        },
        "filing_officer": {
            "user_id": case.created_by_id,
            "display_name": "Unknown",
        },
        "witness_count": 0,
        "suspect_count": 0,
        "witnesses": [],
        "timeline": [
            {
                "event_id": ev.id,
                "event_type": ev.event_type,
                "title": ev.event_type,
                "description": ev.description or "",
                "date": ev.occurred_at.isoformat() if ev.occurred_at else None,
                "created_by": ev.created_by_id,
            }
            for ev in events
        ],
        "evidence": [
            {
                "evidence_id": ev.id,
                "name": ev.name,
                "description": ev.description,
                "evidence_type": ev.evidence_type,
                "file_size": ev.file_size,
                "mime_type": ev.mime_type,
                "date_uploaded": ev.created_at.isoformat() if ev.created_at else None,
            }
            for ev in evidence_list
        ],
    }


@router.post("")
def create_case(case_data: dict, db: Session = Depends(get_db)):
    """POST /cases - Create a new case"""
    case = Case(
        case_number=f"CRIME-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        title=case_data.get("title", ""),
        description=case_data.get("description", ""),
        category=case_data.get("crime_type", ""),
        status=case_data.get("status", "open"),
        priority=case_data.get("priority", "medium"),
        district=case_data.get("district", ""),
        locality=case_data.get("location", ""),
        reported_at=datetime.utcnow(),
        created_by_id=1,  # TODO: get from auth
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return {"case_id": case.case_number, "message": "Case created successfully"}


@router.put("/{case_id}")
def update_case(case_id: str, case_data: dict, db: Session = Depends(get_db)):
    """PUT /cases/{case_id} - Update a case"""
    case = db.query(Case).filter(Case.case_number == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    for key, value in case_data.items():
        if hasattr(case, key):
            setattr(case, key, value)
    
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    return {"case_id": case.case_number, "message": "Case updated successfully"}


@router.get("/{case_id}/timeline")
def get_timeline(case_id: str, db: Session = Depends(get_db)):
    """GET /cases/{case_id}/timeline - Get case timeline"""
    events = db.query(CaseEvent).filter(CaseEvent.case_id == case_id).order_by(CaseEvent.created_at).all()
    return [
        {
            "event_id": ev.id,
            "event_type": ev.event_type,
            "title": ev.event_type,
            "description": ev.description or "",
            "date": ev.occurred_at.isoformat() if ev.occurred_at else None,
            "created_by": ev.created_by_id,
        }
        for ev in events
    ]


@router.get("/{case_id}/related")
def get_related_cases(case_id: str, db: Session = Depends(get_db)):
    """GET /cases/{case_id}/related - Get related cases"""
    case = db.query(Case).filter(Case.case_number == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Find related cases by same district and category
    related = db.query(Case).filter(
        Case.id != case.id,
        Case.district == case.district,
        Case.category == case.category
    ).limit(5).all()
    
    return [
        {
            "case_id": c.case_number,
            "crime_type": c.category,
            "district": c.district,
            "status": c.status,
        }
        for c in related
    ]