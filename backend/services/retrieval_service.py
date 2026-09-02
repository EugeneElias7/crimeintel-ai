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
        intent, entities = await self.intent_service.classify(text, session_id=session_id)
        
        # Build query plan
        locations = entities.get("locations", [])
        primary_location = locations[0] if locations else entities.get("location")
        
        return QueryPlan(
            text=text,
            intent=intent,
            crime_type=entities.get("crime_type"),
            location=primary_location,
            district=entities.get("district"),
            status=entities.get("status"),
            date_from=entities.get("date_from") or entities.get("date_ref"),
            date_to=entities.get("date_to"),
            person=entities.get("person") or (entities.get("persons", [None])[0] if entities.get("persons") else None),
            case_id=entities.get("case_id"),
            limit=entities.get("limit", 20),
            offset=entities.get("offset", 0),
        )


class RetrievalService:
    """Hybrid retrieval service combining structured SQLite queries with FAISS semantic search."""
    
    def __init__(
        self,
        faiss_service: "FAISSService" = None,
        embedding_service: "EmbeddingService" = None,
    ):
        self.faiss_service = faiss_service
        # FIX line 71: actually assign param, fallback to None with log
        self.embedding_service = embedding_service
        if embedding_service is None:
            logger.warning("RetrievalService: embedding_service is None, FAISS retrieval will use fallback dummy if needed")
    
    async def retrieve(self, query_plan: "QueryPlan") -> List[Dict[str, Any]]:
        """Main retrieval method - hybrid structured + semantic search with metadata filtering and weighted merging."""
        intent = getattr(query_plan, 'intent', 'case_search')
        
        # For greetings and help, no retrieval needed
        if intent in ["greeting", "general_help"]:
            return []
        
        # For case detail, use direct lookup
        if intent == "case_detail" and getattr(query_plan, 'case_id', None):
            return await self._get_case_detail(query_plan.case_id)
        
        # For statistics, use analytics
        if intent == "statistics":
            return await self._get_statistics(query_plan)
        
        # For case detail with ID (secondary)
        if getattr(query_plan, 'case_id', None) and intent in ["case_detail", "summarization"]:
            return await self._get_case_detail(query_plan.case_id)
        
        # For structured queries with explicit filters, use structured retrieval
        structured_results = await self._structured_retrieval(query_plan)
        
        # Check if query has explicit filters (location, crime_type, status)
        has_explicit_filters = bool(getattr(query_plan, 'location', None) or getattr(query_plan, 'crime_type', None) or getattr(query_plan, 'status', None) or getattr(query_plan, 'district', None))
        
        # Determine if semantic search is needed: hybrid when semantic_heavy or no explicit filters or insufficient structured results
        # semantic_heavy if query text looks description-like (long > 10 words or contains semantic keywords)
        text = getattr(query_plan, 'text', '') or ''
        is_semantic_heavy = len(text.split()) > 8 or any(kw in text.lower() for kw in ["cctv", "description", "modus operandi", "similar", "like", "pattern", "behavior"])
        if getattr(query_plan, 'semantic_search', False):
            is_semantic_heavy = True

        # If structured results are sufficient and not semantic-heavy, return them
        if structured_results and len(structured_results) >= query_plan.limit and not is_semantic_heavy:
            for c in structured_results:
                c["retrieval_score"] = 1.0
                c["source_type"] = "structured"
            return structured_results[:query_plan.limit]
        
        # If query has explicit filters but no structured results and not semantic_heavy, return empty (no FAISS fallback)
        if has_explicit_filters and not structured_results and not is_semantic_heavy:
            return []
        
        # Use FAISS for semantic search (with metadata filtering)
        faiss_results = await self._faiss_retrieval(query_plan)
        
        # Merge and deduplicate results with weights: structured 1.0, faiss similarity
        combined = self._merge_results(
            structured_results,
            faiss_results,
            query_plan.limit
        )
        
        return combined[:query_plan.limit]
    
    async def _structured_retrieval(self, query_plan: "QueryPlan") -> List[Dict[str, Any]]:
        """Structured retrieval using SQLite with exact filters."""
        try:
            all_cases = await sqlite_db.get_all("Cases")
            if not all_cases:
                return []
            
            filtered = []
            for case in all_cases:
                if query_plan.crime_type and (case.get("crime_type") or "").lower() != query_plan.crime_type.lower():
                    continue
                
                if query_plan.location:
                    loc = query_plan.location.lower()
                    case_loc = (case.get("location") or "").lower()
                    case_district = (case.get("district") or "").lower()
                    if loc not in case_loc and loc not in case_district:
                        continue
                
                if query_plan.district:
                    # district alias handling
                    from services.crima_tools import _norm_district
                    filt = _norm_district((query_plan.district or "").lower())
                    cdist = _norm_district((case.get("district") or "").lower())
                    if filt != cdist:
                        # also check location contains district
                        if filt not in (case.get("location") or "").lower():
                            continue
                
                if query_plan.status:
                    st = query_plan.status.lower()
                    if st == "resolved":
                        st = "closed"
                    cst = (case.get("status") or "").lower()
                    if cst == "resolved":
                        cst = "closed"
                    if cst != st:
                        continue

                if query_plan.priority and (case.get("priority") or "").lower() != (query_plan.priority or "").lower():
                    continue

                if query_plan.date_from and (case.get("date_filed") or "") < query_plan.date_from:
                    continue
                if query_plan.date_to and (case.get("date_filed") or "") > query_plan.date_to:
                    continue
                
                filtered.append(case)
            
            # Apply pagination
            start = getattr(query_plan, 'offset', 0) or 0
            end = start + query_plan.limit
            return filtered[start:end]
            
        except Exception as e:
            logger.error(f"Structured retrieval failed: {e}")
            return []
    
    async def _faiss_retrieval(self, query_plan: "QueryPlan") -> List[Dict[str, Any]]:
        """Semantic search using FAISS with metadata filtering (district/crime_type)."""
        if not self.faiss_service:
            return []
        # embedding_service may be None -> try to create fallback
        emb_service = self.embedding_service
        if not emb_service:
            try:
                from services.embedding_service import EmbeddingService
                emb_service = EmbeddingService()
            except Exception:
                return []

        try:
            text = getattr(query_plan, 'text', '') or ''
            # Fallback to building text from filters if no text
            if not text:
                parts = []
                if query_plan.crime_type:
                    parts.append(query_plan.crime_type)
                if query_plan.location:
                    parts.append(query_plan.location)
                if query_plan.district:
                    parts.append(query_plan.district)
                text = " ".join(parts) or "case"
            
            embedding = await emb_service.generate(text)
            # search k larger to allow metadata filtering
            k = max(10, query_plan.limit * 3)
            similar = await self.faiss_service.search(embedding, k=k)
            
            if not similar:
                return []
            
            id_mapping = await self.faiss_service.get_id_mapping()
            # metadata filtering
            meta = await self.faiss_service.get_metadata() if hasattr(self.faiss_service, 'get_metadata') else {}
            
            results = []
            for idx, score in similar:
                case_id = id_mapping.get(idx)
                if not case_id:
                    # mapping may have string keys
                    case_id = id_mapping.get(str(idx))
                if not case_id:
                    continue
                # metadata filter: if query has district/crime_type, filter faiss results
                if meta and case_id in meta:
                    m = meta[case_id]
                    if query_plan.district and m.get("district") and m.get("district").lower() != query_plan.district.lower():
                        # allow contains check for district alias
                        from services.crima_tools import _norm_district
                        if _norm_district(m.get("district","").lower()) != _norm_district(query_plan.district.lower()):
                            continue
                    if query_plan.crime_type and m.get("crime_type") and m.get("crime_type").lower() != query_plan.crime_type.lower():
                        continue

                try:
                    case_data = await self._get_case_by_id(case_id)
                    if case_data:
                        case_data["similarity_score"] = score
                        case_data["retrieval_score"] = float(score)  # weighted later
                        case_data["source_type"] = "faiss"
                        results.append(case_data)
                except Exception:
                    continue
                if len(results) >= query_plan.limit:
                    break
            
            return results
        except Exception as e:
            logger.error(f"FAISS retrieval failed: {e}")
            return []
    
    async def _get_case_by_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Helper to fetch case by id (used by FAISS)."""
        try:
            from services.case_service import CaseService
            from adapters.db import db as db_adapter
            case_service = CaseService(db=db_adapter)
            # Try full get_case (raises if not found)
            try:
                return await case_service.get_case(case_id)
            except ValueError:
                # fallback direct DB fetch
                c = await sqlite_db.get("Cases", case_id)
                if c:
                    return c
                res = await sqlite_db.query("Cases", {"case_id": case_id})
                if res:
                    return res[0]
                return None
        except Exception:
            return None

    async def _get_case_detail(self, case_id: str) -> List[Dict[str, Any]]:
        """Get full case details by ID."""
        from services.case_service import CaseService
        from adapters.db import db as db_adapter
        
        case_service = CaseService(db=db_adapter)
        try:
            case_data = await case_service.get_case(case_id)
            if case_data:
                case_data["retrieval_score"] = 1.0
                case_data["source_type"] = "structured"
                return [case_data]
        except ValueError:
            return []
        return []
    
    async def _get_statistics(self, query_plan: "QueryPlan") -> List[Dict]:
        """Get statistics for statistics queries with proper filtering."""
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
            if query_plan.crime_type and (case.get("crime_type") or "").lower() != query_plan.crime_type.lower():
                continue
            if query_plan.location:
                loc = query_plan.location.lower()
                case_loc = (case.get("location") or "").lower()
                case_district = (case.get("district") or "").lower()
                if loc not in case_loc and loc not in case_district:
                    continue
            if query_plan.district and (case.get("district") or "").lower() != (query_plan.district or "").lower():
                # district alias
                from services.crima_tools import _norm_district
                if _norm_district((case.get("district") or "").lower()) != _norm_district(query_plan.district.lower()):
                    continue
            if query_plan.status and (case.get("status") or "").lower() != query_plan.status.lower():
                cst = (case.get("status") or "").lower()
                if cst == "resolved":
                    cst = "closed"
                filt = query_plan.status.lower()
                if filt == "resolved":
                    filt = "closed"
                if cst != filt:
                    continue
            filtered.append(case)
        
        total = len(filtered)
        open_cases = len([c for c in filtered if (c.get("status") or "").lower() == "open"])
        closed_cases = len([c for c in filtered if (c.get("status") or "").lower() == "closed"])
        filed_cases = len([c for c in filtered if (c.get("status") or "").lower() == "filed"])
        under_inv = len([c for c in filtered if (c.get("status") or "").lower() == "under_investigation"])
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
        """Merge and deduplicate results from structured and FAISS retrieval with weights."""
        seen = set()
        merged = []
        
        # Add structured results first (higher priority, weight 1.0)
        for case in structured:
            case_id = case.get("case_id") or case.get("ROWID")
            if case_id and case_id not in seen:
                seen.add(case.get("case_id") or case.get("ROWID"))
                case["source_type"] = "structured"
                case["retrieval_score"] = 1.0
                merged.append(case)
        
        # Add FAISS results that aren't duplicates, weight = similarity
        for case in faiss:
            case_id = case.get("case_id") or case.get("ROWID")
            if case_id and case_id not in seen:
                case["source_type"] = case.get("source_type", "faiss")
                # retrieval_score already set from similarity; ensure 0-1
                if "retrieval_score" not in case:
                    case["retrieval_score"] = case.get("similarity_score", 0.5)
                merged.append(case)
                seen.add(case.get("case_id") or case.get("ROWID"))
        
        # Sort by retrieval_score descending (structured 1.0 on top)
        merged.sort(key=lambda x: x.get("retrieval_score", 0), reverse=True)
        return merged[:limit]


# Singleton instance - will be re-instantiated with proper deps in router
retrieval_service = RetrievalService()
