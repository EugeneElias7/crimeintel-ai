from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    text: str = Field(..., max_length=500, description="Natural language query text")
    context: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        max_length=10,
        description="Optional context from previous queries",
    )


class QueryResult(BaseModel):
    case_id: str
    crime_type: str
    location: str
    date_filed: str
    status: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    summary: str


class QueryResponse(BaseModel):
    response: str
    results: List[QueryResult] = []
    intent: str
    confidence_avg: float = Field(default=0.0, ge=0.0, le=1.0)
    total_found: int = 0
    sources: List[str] = []
    entities: Dict[str, Any] = {}


class ConversationMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    text: str
    timestamp: datetime


class ConversationHistory(BaseModel):
    case_id: Optional[str] = None
    messages: List[ConversationMessage] = []


class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., max_length=100)


class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int
    count: int


class SimilaritySearchRequest(BaseModel):
    query_embedding: List[float]
    top_k: int = Field(default=5, ge=1, le=50)


class SimilaritySearchResponse(BaseModel):
    results: List[Dict[str, Any]] = []
