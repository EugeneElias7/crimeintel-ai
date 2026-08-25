from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class IntentType(str, Enum):
    GREETING = "greeting"
    GENERAL_HELP = "general_help"
    CASE_SEARCH = "case_search"
    CASE_DETAIL = "case_detail"
    CASE_SUMMARY = "summarization"
    SUSPECT_SEARCH = "suspect_search"
    EVIDENCE_SEARCH = "evidence_search"
    WITNESS_SEARCH = "witness_search"
    TIMELINE_SEARCH = "timeline_search"
    SIMILAR_CASE_SEARCH = "similar_case_search"
    STATISTICS = "statistics"
    LOCATION_QUERY = "location_query"
    CRIME_TREND = "crime_trend"
    CROSS_REFERENCE = "cross_reference"
    UNKNOWN = "unknown"


class QueryPlan(BaseModel):
    """Structured query plan for CRIMA retrieval."""
    intent: IntentType = IntentType.UNKNOWN
    crime_type: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    person: Optional[str] = None
    evidence_type: Optional[str] = None
    semantic_search: bool = False
    limit: int = 20
    offset: int = 0
    
    # Entity references for conversation context
    case_id: Optional[str] = None
    person_name: Optional[str] = None
    location: Optional[str] = None
    crime_type: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    
    # Search configuration
    semantic_search: bool = False
    fuzzy_matching: bool = True
    exact_match: bool = False
    limit: int = 20
    offset: int = 0
    
    # Context references
    case_id: Optional[str] = None
    person_name: Optional[str] = None
    location: Optional[str] = None
    crime_type: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    
    class Config:
        use_enum_values = True


class RetrievalResult(BaseModel):
    """Result from retrieval with relevance scoring."""
    case_id: str
    crime_type: str
    location: str
    district: Optional[str] = None
    status: str
    date_filed: Optional[str] = None
    similarity_score: float = 0.0
    exact_match_score: float = 0.0
    relevance_score: float = 0.0
    source_type: str = "structured"  # structured, faiss, hybrid
    case_data: Dict[str, Any] = {}


class QueryPlan(BaseModel):
    """Structured query plan for retrieval."""
    intent: str = "case_search"
    crime_type: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    person: Optional[str] = None
    evidence_type: Optional[str] = None
    semantic_search: bool = False
    limit: int = 20
    offset: int = 0
    
    # For context resolution
    case_id: Optional[str] = None
    person_name: Optional[str] = None
    location: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    
    # Search configuration
    semantic_search: bool = False
    fuzzy_matching: bool = True
    exact_match: bool = False
    limit: int = 20
    offset: int = 0
    
    class Config:
        arbitrary_types_allowed = True