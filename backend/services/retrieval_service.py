from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
import logging
import re
import json

from models.query_plan import QueryPlan, RetrievalResult
from services.conversation_manager import conversation_manager
from services.llm_provider import LLMProviderFactory, LLMResponse
from services.intent_service import IntentService
from services.faiss_service import FAISSService
from services.embedding_service import EmbeddingService
from adapters.sqlite_db import sqlite_db

logger = logging.getLogger(__name__)


class QueryPlanner:
    """Query planner that converts natural language into structured QueryPlan."""
    
    def __init__(self, intent_service: IntentService):
        self.intent_service = intent_service
    
    async def create_plan(self, text: str, session_id: str = "default") -> "QueryPlan":
        """Create a structured query plan from natural language."""
        from models.query_plan import QueryPlan
        
        # First, get intent and entities from intent service
        intent, entities = await self.intent_service.classify(text, session_id="default")
        
        # Create base query plan
        plan = QueryPlan(
            intent=text,  # Will be overridden
            intent_type=entities.get("intent_class", "case_search"),
            crime_type=entities.get("crime_type"),
            locations=entities.get("locations", []),
            persons=entities.get("persons", []),
            date_ref=entities.get("date_ref"),
            case_id=entities.get("case_id"),
        )
        
        # For simple queries, we can use the intent classification directly
        # For complex queries, we might want to use an LLM to create a more detailed plan
        
        # For now, use the intent classification to build the query plan
        if hasattr(query_plan, 'intent_class'):
            intent_class = query_plan.intent_class
        else:
            intent_class = "case_search"
        
        # Build the query plan based on intent and entities
        return QueryPlan(
            intent=intent,
            crime_type=entities.get("crime_type"),
            locations=entities.get("locations", []),
            persons=entities.get("persons", []),
            date_ref=entities.get("date_ref"),
            case_id=entities.get("case_id"),
        )


class RetrievalService:
    """Hybrid retrieval service combining structured SQLite queries with FAISS semantic search."""
    
    def __init__(
        self,
        faiss_service: "FAISSService" = None,
        embedding_service: "EmbeddingService" = None,
    ):
        self.faiss_service = faiss_service
        self.embedding_service = None  # embedding_service
    
    async def retrieve(self, query_plan: "QueryPlan") -> List[Dict[str, Any]]:
        """Main retrieval method - hybrid structured + semantic search."""
        intent = query_plan.intent if hasattr(query_plan, 'intent') else "case_search"
        
        # For greetings and help, no retrieval needed
        if query_plan.intent in ["greeting", "general_help"]:
            return []
        
        # For case detail, use direct lookup
        if query_plan.intent == "case_detail" and query_plan.case_id:
            return await self._get_case_detail(query_plan.case_id)
        
        # For statistics, use analytics
        if query_plan.intent == "statistics":
            return await self._get_statistics(query_plan)
        
        # For case detail with ID
        if query_plan.case_id and query_plan.intent in ["case_detail", "summarization"]:
            return await self._get_case_detail(query_plan.case_id)
        
        # For structured queries with explicit filters, use structured retrieval
        structured_results = await self._structured_retrieval(query_plan)
        
        # If structured results are sufficient, return them
        if structured_results and len(structured_results) >= query_plan.limit:
            return structured_results[:query_plan.limit]
        
        # If we need more results or no structured results, use FAISS for semantic search
        faiss_results = await self._faiss_retrieval(query_plan)
        
        # Merge and deduplicate results
        combined = self._merge_results(
            structured_results,
            faiss_results,
            query_plan.limit
        )
        
        return combined[:query_plan.limit]
    
    async def _structured_retrieval(self, query_plan: "QueryPlan") -> List[Dict[str, Any]]:
        """Structured retrieval using SQLite with exact filters."""
        from adapters.sqlite_db import sqlite_db
        
        try:
            # Build filters from query plan
            filters = {}
            if query_plan.crime_type:
                filters["crime_type"] = query_plan.crime_type
            if query_plan.location:
                filters["location"] = query_plan.location
            if query_plan.district:
                filters["district"] = query_plan.district
            if query_plan.date_from:
                filters["date_from"] = query_plan.date_from
            if query_plan.date_to:
                filters["date_to"] = query_plan.date_to
            
            all_cases = await sqlite_db.get_all("Cases")
            if not all_cases:
                return []
            
            filtered = []
            for case in all_cases:
                if query_plan.crime_type and case.get("crime_type") != query_plan.crime_type:
                    continue
                
                if query_plan.location:
                    loc = query_plan.location.lower()
                    case_loc = (case.get("location") or "").lower()
                    case_district = (case.get("district") or "").lower()
                    if loc not in case_loc and loc not in case_district:
                        continue
                
                if query_plan.date_from and case.get("date_filed", "") < query_plan.date_from:
                    continue
                if query_plan.date_to and case.get("date_filed", "") > query_plan.date_to:
                    continue
                
                filtered.append(case)
            
            # Apply pagination
            start = query_plan.offset
            end = start + query_plan.limit
            return filtered[start:end]
            
        except Exception as e:
            logger.error(f"Structured retrieval failed: {e}")
            return []
    
    async def _faiss_retrieval(self, query_plan: "QueryPlan") -> List[Dict[str, Any]]:
        """Semantic search using FAISS."""
        if not self.faiss_service or not self.embedding_service:
            return []
        
        try:
            embedding = await self.embedding_service.generate(query_plan.text)
            similar = await self.faiss_service.search(embedding, k=10)
            
            if not similar:
                return []
            
            id_mapping = await self.faiss_service.get_id_mapping()
            results = []
            
            for idx, score in similar:
                case_id = id_mapping.get(idx)
                if not case_id:
                    continue
                
                try:
                    case_data = await self._get_case_by_id(case_id)
                    if case_data:
                        case_data["similarity_score"] = score
                        results.append(case_data)
                except ValueError:
                    continue
            
            return results
        except Exception as e:
            logger.error(f"FAISS retrieval failed: {e}")
            return []
    
    async def _get_case_detail(self, case_id: str) -> List[Dict[str, Any]]:
        """Get full case details by ID."""
        from adapters.sqlite_db import sqlite_db
        from services.case_service import CaseService
        
        case_service = CaseService(db=sqlite_db)
        case_data = await case_service.get_case(case_id)
        if case_data:
            return [case_data]
        return []
    
    async def _get_statistics(self, query_plan: "QueryPlan") -> List[Dict]:
        """Get statistics for statistics queries with proper filtering."""
        from adapters.sqlite_db import sqlite_db
        
        # Build filters from query plan
        filters = {}
        if query_plan.crime_type:
            filters["crime_type"] = query_plan.crime_type
        if query_plan.location:
            filters["location"] = query_plan.location
        if query_plan.district:
            filters["district"] = query_plan.district
        if query_plan.status:
            filters["status"] = query_plan.status
        
        # Get all cases and filter manually
        all_cases = await sqlite_db.get_all("Cases")
        if not all_cases:
            return [{
                "type": "statistics",
                "total_cases": 0,
                "open_cases": 0,
                "closed_cases": 0,
                "clearance_rate": 0,
                "filtered_by": filters,
            }]
        
        filtered = []
        for case in all_cases:
            if query_plan.crime_type and case.get("crime_type") != query_plan.crime_type:
                continue
            if query_plan.location:
                loc = query_plan.location.lower()
                case_loc = (case.get("location") or "").lower()
                case_district = (case.get("district") or "").lower()
                if loc not in case_loc and loc not in case_district:
                    continue
            if query_plan.district and case.get("district") != query_plan.district:
                continue
            if query_plan.status and case.get("status") != query_plan.status:
                continue
            filtered.append(case)
        
        total = len(filtered)
        open_cases = len([c for c in filtered if c.get("status") == "open"])
        closed_cases = len([c for c in filtered if c.get("status") == "closed"])
        filed_cases = len([c for c in filtered if c.get("status") == "filed"])
        under_inv = len([c for c in filtered if c.get("status") == "under_investigation"])
        clearance_rate = round((closed_cases / total * 100) if total > 0 else 0, 2)
        
        return [{
            "type": "statistics",
            "total_cases": total,
            "open_cases": open_cases,
            "closed_cases": closed_cases,
            "filed_cases": filed_cases,
            "under_investigation_cases": under_inv,
            "clearance_rate": clearance_rate,
            "filtered_by": filters,
        }]
    
    def _merge_results(
        self,
        structured: List[Dict],
        faiss: List[Dict],
        limit: int
    ) -> List[Dict]:
        """Merge and deduplicate results from structured and FAISS retrieval."""
        seen = set()
        merged = []
        
        # Add structured results first (higher priority)
        for case in structured:
            case_id = case.get("case_id") or case.get("ROWID")
            if case_id and case_id not in seen:
                seen.add(case.get("case_id") or case.get("ROWID"))
                case["source_type"] = "structured"
                case["retrieval_score"] = 1.0
                merged.append(case)
        
        # Add FAISS results that aren't duplicates
        for case in faiss:
            case_id = case.get("case_id") or case.get("ROWID")
            if case_id and case_id not in seen:
                case["source_type"] = "faiss"
                case["retrieval_score"] = case.get("similarity_score", 0.5)
                merged.append(case)
                seen.add(case.get("case_id") or case.get("ROWID"))
        
        return merged[:limit]
    
    async def retrieve(self, query_plan: "QueryPlan") -> List[Dict[str, Any]]:
        """Main retrieval method - hybrid structured + semantic search."""
        intent = query_plan.intent if hasattr(query_plan, 'intent') else "case_search"
        
        # For greetings and help, no retrieval needed
        if query_plan.intent in ["greeting", "general_help"]:
            return []
        
        # For case detail, use direct lookup
        if query_plan.intent == "case_detail" and query_plan.case_id:
            return await self._get_case_detail(query_plan.case_id)
        
        # For statistics, use analytics
        if query_plan.intent == "statistics":
            return await self._get_statistics(query_plan)
        
        # For case detail with ID
        if query_plan.case_id and query_plan.intent in ["case_detail", "summarization"]:
            return await self._get_case_detail(query_plan.case_id)
        
        # For structured queries with explicit filters, use structured retrieval
        structured_results = await self._structured_retrieval(query_plan)
        
        # Check if query has explicit filters (location, crime_type, status)
        has_explicit_filters = bool(query_plan.location or query_plan.crime_type or query_plan.status or query_plan.district)
        
        # If structured results are sufficient, return them
        if structured_results and len(structured_results) >= query_plan.limit:
            return structured_results[:query_plan.limit]
        
        # If query has explicit filters but no structured results, return empty (no FAISS fallback)
        # This ensures zero-result behavior for filtered queries
        if has_explicit_filters and not structured_results:
            return []
        
        # If we need more results (no explicit filters or have some results), use FAISS for semantic search
        faiss_results = await self._faiss_retrieval(query_plan)
        
        # Merge and deduplicate results
        combined = self._merge_results(
            structured_results,
            faiss_results,
            query_plan.limit
        )
        
        return combined[:query_plan.limit]


# Singleton instance
retrieval_service = RetrievalService()