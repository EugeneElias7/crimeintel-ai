from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional
from datetime import datetime
import json

from .models import Case, User, CaseEvent
from .database import SessionLocal

router = APIRouter(prefix="/crima", tags=["crima"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/query")
def crima_query(query: dict, db: Session = Depends(get_db)):
    """POST /crima/query - Process natural language query and return relevant cases"""
    text = query.get("text", "").lower()
    context = query.get("context", "")
    
    # Simple keyword-based search
    query_obj = db.query(Case)
    
    # Extract keywords for filtering
    text_lower = text
    
    # Check for crime types
    crime_keywords = {
        "burglary": "Burglary",
        "theft": "Theft",
        "robbery": "Robbery",
        "murder": "Murder",
        "kidnapping": "Kidnapping",
        "assault": "Assault",
        "fraud": "Fraud",
        "cyber": "Cyber Crime",
        "drug": "Drug Trafficking",
        "violence": "Domestic Violence",
        "traffic": "Traffic Violation",
        "arson": "Arson",
        "riot": "Rioting",
        "chain snatching": "Chain Snatching",
        "pickpocket": "Pickpocketing",
        "vehicle theft": "Vehicle Theft",
        "hit and run": "Hit and Run",
        "drunk driving": "Drunk Driving",
        "counterfeit": "Counterfeiting",
        "identity theft": "Identity Theft",
        "online fraud": "Online Fraud",
        "credit card fraud": "Credit Card Fraud",
        "atm fraud": "ATM Fraud",
        "murder": "Murder",
        "attempted murder": "Attempted Murder",
        "arson": "Arson",
        "extortion": "Extortion",
        "vandalism": "Vandalism",
        "rioting": "Rioting",
        "unlawful assembly": "Unlawful Assembly",
        "public nuisance": "Public Nuisance",
        "extortion": "Extortion",
        "counterfeiting": "Counterfeiting",
        "drunk driving": "Drunk Driving",
        "rash driving": "Rash Driving",
        "over speeding": "Over Speeding",
        "hit and run": "Hit and Run",
    }
    
    # Check for districts
    district_keywords = {
        "bangalore": "Bengaluru Urban",
        "bengaluru": "Bengaluru Urban",
        "rural": "Bengaluru Rural",
        "mysore": "Mysuru",
        "mysuru": "Mysuru",
        "mangalore": "Mangaluru",
        "mangaluru": "Mangaluru",
        "hubli": "Hubballi-Dharwad",
        "dharwad": "Hubballi-Dharwad",
        "belgaum": "Belagavi",
        "belagavi": "Belagavi",
        "kalaburagi": "Kalaburagi",
        "gulbarga": "Kalaburagi",
        "bidar": "Bidar",
        "yadgir": "Yadgir",
        "koppal": "Koppal",
        "gadag": "Gadag",
        "haveri": "Haveri",
        "uttara kannada": "Uttara Kannada",
        "dakshina kannada": "Dakshina Kannada",
        "udupi": "Udupi",
        "chikkamagaluru": "Chikkamagaluru",
        "hassan": "Hassan",
        "mandya": "Mandya",
        "chamarajanagar": "Chamarajanagar",
        "kodagu": "Kodagu",
        "chitradurga": "Chitradurga",
        "kolar": "Kolar",
        "ramanagara": "Ramanagara",
        "tumakuru": "Tumakuru",
        "tumkur": "Tumakuru",
        "shivamogga": "Shivamogga",
        "shimoga": "Shivamogga",
        "davanagere": "Davanagere",
        "ballari": "Ballari",
        "raichur": "Raichur",
        "bijapur": "Vijayapura",
        "vijayapura": "Vijayapura",
    }
    
    # Check for status
    status_keywords = {
        "open": "open",
        "under investigation": "under_investigation",
        "under_investigation": "under_investigation",
        "closed": "resolved",
        "resolved": "resolved",
        "filed": "filed",
    }
    
    # Apply filters based on keywords
    found_category = False
    for keyword, category in crime_keywords.items():
        if keyword in text_lower:
            query_obj = query_obj.filter(Case.category == category)
            found_category = True
            break
    
    found_district = False
    for keyword, district in district_keywords.items():
        if keyword in text_lower:
            query_obj = query_obj.filter(Case.district == district)
            found_district = True
            break
    
    found_status = False
    for keyword, status in status_keywords.items():
        if keyword in text_lower:
            query_obj = query_obj.filter(Case.status == status)
            found_status = True
            break
    
    # If no specific filters found, search in title/description
    if not found_category and not found_district and not found_status:
        search_term = f"%{text_lower}%"
        query_obj = query_obj.filter(
            Case.title.ilike(f"%{text_lower}%") |
            Case.description.ilike(f"%{text_lower}%") |
            Case.category.ilike(f"%{text_lower}%") |
            Case.district.ilike(f"%{text_lower}%") |
            Case.locality.ilike(f"%{text_lower}%")
        )
    
    # Limit results
    cases = query_obj.limit(10).all()
    
    # Build response
    results = []
    for case in cases:
        user = None  # db.query(User).filter(User.id == case.created_by_id).first() if case.created_by_id else None
        results.append({
            "case_id": case.case_number,
            "crime_type": case.category,
            "location": case.locality or case.district,
            "district": case.district,
            "summary": f"Case {case.case_number}: {case.title}. {case.description or 'No description.'}",
            "confidence": 0.85,
            "status": case.status,
            "date_filed": case.reported_at.isoformat() if case.reported_at else None,
        })
    
    # Generate response text
    if results:
        response_text = f"Found {len(results)} cases matching your query."
        if len(results) > 1:
            response_text += f" Top results include {results[0]['crime_type']} in {results[0]['district']}."
    else:
        response_text = "No cases found matching your query. Try different keywords."
    
    return {
        "response": response_text,
        "results": results,
        "query": text,
    }


@router.get("/history")
def get_history():
    """GET /crima/history - Get chat history (empty for now)"""
    return {"messages": []}


@router.delete("/history")
def clear_history():
    """DELETE /crima/history - Clear chat history"""
    return {"message": "History cleared"}