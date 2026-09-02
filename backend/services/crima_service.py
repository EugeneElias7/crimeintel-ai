from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging
import uuid

from models.crima import QueryResponse, QueryResult
from services.llm_provider import LLMProviderFactory, LLMResponse
from services.grounding_validator import grounding_validator
from services.conversation_manager import conversation_manager
from models.query_plan import QueryPlan
from services.intent_service import IntentService

logger = logging.getLogger(__name__)


class CRIMAService:
    def __init__(
        self,
        intent_service: Any,
        embedding_service: Any,
        faiss_service: Any,
        context_service: Any,
        case_service: Any,
    ) -> None:
        self.intent_service = intent_service
        self.embedding_service = embedding_service
        self.faiss_service = faiss_service
        self.context_service = context_service
        self.case_service = case_service
        self._history: List[Dict[str, str]] = []

    async def process_query(
        self, text: str, context: Optional[List[Dict[str, Any]]] = None, session_id: str = "default"
    ) -> QueryResponse:
        context = context or []
        # ensure session_id is not empty
        session_id = session_id or "default"

        # Level 3: resolve references before classification using conversation_manager
        try:
            resolved_text = conversation_manager.resolve_references(text, session_id)
        except Exception:
            resolved_text = text

        # Classify intent with session context (use resolved text for better context)
        intent, entities = await self.intent_service.classify(resolved_text, session_id)
        # keep original text for response but use resolved for retrieval hints
        # Inject session_id into entities for context_service merge
        entities["_session_id"] = session_id

        # Fix: use passed session_id correctly for conversation_manager (both add_to_history calls)
        conversation_manager.add_to_history(session_id, "user", text, {"intent": intent})

        enriched_query = await self.context_service.merge(resolved_text, context, entities)

        total_found = 0
        results: List[QueryResult] = []
        sources: List[str] = []
        response_text = ""
        confidence_avg = 0.0
        context_records: List[Dict[str, Any]] = []

        # Handle greeting intent - no retrieval needed
        if intent == "greeting":
            response_text = (
                "Hello! I am CRIMA, your Crime Intelligence Assistant. "
                "I can help you search for cases, view case details, "
                "look up suspects or evidence, analyze crime trends, "
                "and provide crime statistics. How can I assist you today?"
            )
            conversation_manager.add_to_history(session_id, "assistant", response_text, {"intent": intent})
            # also update context_manager last intent
            conversation_manager.update_context(session_id, last_intent=intent)
            return QueryResponse(
                response=response_text,
                results=[],
                intent=intent,
                confidence_avg=1.0,
                total_found=0,
                sources=["crima_knowledge"],
                entities=entities,
            )

        # Handle case_detail with invalid/missing case_id
        if intent == "case_detail" and (not entities.get("case_id") or entities.get("case_id") == "INVALID"):
            response_text = (
                "I couldn't find a valid FIR/Case ID in your query. "
                "Please provide a valid FIR number (e.g., FIR-2024-000001) "
                "or ask me to search for cases by location, crime type, or other criteria."
            )
            conversation_manager.add_to_history(session_id, "assistant", response_text, {"intent": intent})
            return QueryResponse(
                response=response_text,
                results=[],
                intent=intent,
                confidence_avg=0.1,
                total_found=0,
                sources=[],
                entities=entities,
            )

        # Create query plan
        locations = entities.get("locations", [])
        primary_location = locations[0] if locations else entities.get("location")
        # Also handle district from location if district alias
        district = entities.get("district")
        # If location is like Bengaluru, treat as district hint if needed
        # but keep distinct

        query_plan = QueryPlan(
            text=enriched_query,
            intent=intent,
            crime_type=entities.get("crime_type"),
            location=primary_location,
            district=district,
            status=entities.get("status"),
            date_from=entities.get("date_from"),
            date_to=entities.get("date_to"),
            person=entities.get("person") or (entities.get("persons", [None])[0] if entities.get("persons") else None),
            limit=20,
            offset=0,
            case_id=entities.get("case_id"),
        )

        # Level 1 & 2: Use crima_tools via intent dispatcher instead of direct retrieval_service
        # Also supports hybrid semantic via retrieval_service when needed
        from services import crima_tools
        from services.retrieval_service import retrieval_service as retrieval_svc
        # Ensure retrieval_service has correct embedding/faiss
        if retrieval_svc.embedding_service is None and self.embedding_service is not None:
            retrieval_svc.embedding_service = self.embedding_service
        if retrieval_svc.faiss_service is None and self.faiss_service is not None:
            retrieval_svc.faiss_service = self.faiss_service

        retrieved_cases: List[Dict[str, Any]] = []
        # Track sub-results for evidence/suspect intents
        extra_evidence: List[Dict[str, Any]] = []
        extra_suspects: List[Dict[str, Any]] = []
        extra_witnesses: List[Dict[str, Any]] = []
        extra_timeline: List[Dict[str, Any]] = []

        # Intent handling for suspect_search/witness_search/evidence_search/timeline correctly
        # Multi-step planning: for queries like "Find open robbery in Bengaluru with CCTV evidence" -> sequential tool calls
        is_multi_step_evidence = "cctv" in text.lower() or "video" in text.lower() or "evidence" in text.lower() and entities.get("crime_type") and (primary_location or district)
        if is_multi_step_evidence and intent in ["case_search", "location_query", "evidence_search"]:
            # Step 1: search_cases with filters
            cases = await crima_tools.search_cases(
                crime_type=entities.get("crime_type"),
                location=primary_location,
                district=district,
                status=entities.get("status"),
                priority=entities.get("priority"),
                date_from=entities.get("date_from"),
                date_to=entities.get("date_to"),
                limit=20,
            )
            # Step 2: get_case_evidence for each, filter video evidence, rank
            filtered_cases = []
            for c in cases:
                cid = c.get("case_id") or c.get("ROWID")
                evs = await crima_tools.get_case_evidence(cid)
                # filter evidence by file_type or query
                has_video = any(("video" in (e.get("file_type") or "").lower() or "mp4" in (e.get("file_name") or "").lower() or "cctv" in (e.get("description") or "").lower()) for e in evs)
                # Also allow generic evidence filter if query mentions cctv
                if "cctv" in text.lower():
                    has_cctv = any("cctv" in (e.get("description") or "").lower() or "cctv" in (e.get("file_name") or "").lower() for e in evs)
                    if has_cctv:
                        filtered_cases.append(c)
                        extra_evidence.extend(evs)
                    elif has_video:
                        # fallback video counts as cctv evidence
                        filtered_cases.append(c)
                        extra_evidence.extend(evs)
                else:
                    if evs:
                        filtered_cases.append(c)
                        extra_evidence.extend(evs)
            # Step 3: if filtered_cases has results, use them; else fallback to cases
            if filtered_cases:
                retrieved_cases = filtered_cases
                sources.append("crima_tools:search_cases+get_case_evidence")
            else:
                # No evidence-filtered results, but still show cases and note no evidence
                retrieved_cases = cases[:10]
                sources.append("crima_tools:search_cases")
        elif intent == "suspect_search":
            # use crima_tools search_suspects
            person = entities.get("person") or (entities.get("persons", [None])[0] if entities.get("persons") else None)
            # fallback extract name from text after "named" etc.
            if not person:
                import re
                m = re.search(r"named\s+([A-Za-z ]+)", text, re.I)
                if m:
                    person = m.group(1).strip()
            if person:
                suspects = await crima_tools.search_suspects(name=person, case_id=entities.get("case_id"))
            else:
                # if no person, search all suspects then get suspect cases
                suspects = await crima_tools.search_suspects(name=None, case_id=entities.get("case_id"))
            extra_suspects = suspects
            # get_suspect_cases for each suspect name
            if suspects:
                # deduplicate case_ids
                case_ids = list({s.get("case_id") for s in suspects if s.get("case_id")})
                for cid in case_ids[:10]:
                    detail = await crima_tools.get_case_details(cid)
                    if detail:
                        retrieved_cases.append(detail)
                        sources.append("crima_tools:search_suspects->get_case_details")
            if not retrieved_cases and suspects:
                # fallback: return suspect info as results? But QueryResult expects case
                # we will still return cases via get_suspect_cases if name provided
                if person:
                    try:
                        cases = await crima_tools.get_suspect_cases(person)
                        retrieved_cases = cases
                        sources.append("crima_tools:get_suspect_cases")
                    except Exception:
                        pass

        elif intent == "witness_search":
            person = entities.get("person") or (entities.get("persons", [None])[0] if entities.get("persons") else None)
            witnesses = await crima_tools.search_witnesses(name=person, case_id=entities.get("case_id"))
            extra_witnesses = witnesses
            if witnesses:
                case_ids = list({w.get("case_id") for w in witnesses if w.get("case_id")})
                for cid in case_ids[:10]:
                    detail = await crima_tools.get_case_details(cid)
                    if detail:
                        retrieved_cases.append(detail)
                sources.append("crima_tools:search_witnesses")
            # hybrid fallback via retrieval if no witnesses
            if not retrieved_cases:
                retrieved_cases = await retrieval_svc.retrieve(query_plan)
                sources.append("retrieval_service:hybrid")

        elif intent == "evidence_search":
            # handle evidence_search: if case_id present use get_case_evidence else search_evidence
            case_id = entities.get("case_id")
            # also handle "second one" reference via resolved_text
            if not case_id:
                # try to extract from resolved_text ref hint
                import re
                m = re.search(r"FIR-\d+-\d+", resolved_text)
                if m:
                    case_id = m.group(0)
                else:
                    # use active_cases from conversation_manager
                    ctx = conversation_manager.get_context(session_id)
                    if ctx.active_cases:
                        # if text contains "second one", pick second
                        if "second" in text.lower() and len(ctx.active_cases) >= 2:
                            case_id = ctx.active_cases[1]
                        else:
                            case_id = ctx.active_cases[0]
            file_type = entities.get("file_type") or query_plan.evidence_type
            # detect video/cctv
            if "video" in text.lower() or "cctv" in text.lower():
                file_type = "video"
            elif "image" in text.lower() or "photo" in text.lower():
                file_type = "image"
            elif "pdf" in text.lower():
                file_type = "pdf"
            if case_id:
                evs = await crima_tools.get_case_evidence(case_id)
                # filter by file_type if needed
                if file_type:
                    evs = [e for e in evs if file_type.lower() in (e.get("file_type") or "").lower() or file_type.lower() in (e.get("file_name") or "").lower()]
                extra_evidence = evs
                # also get case details for that case
                detail = await crima_tools.get_case_details(case_id)
                if detail:
                    retrieved_cases = [detail]
                    sources.append("crima_tools:get_case_evidence+get_case_details")
                else:
                    # if no case details, still retrieve via retrieval
                    retrieved_cases = await retrieval_svc.retrieve(query_plan)
                    sources.append("crima_tools:search_evidence")
            else:
                evs = await crima_tools.search_evidence(case_id=None, file_type=file_type, query=text if len(text.split())>3 else None)
                extra_evidence = evs
                if evs:
                    case_ids = list({e.get("case_id") for e in evs if e.get("case_id")})[:10]
                    for cid in case_ids:
                        detail = await crima_tools.get_case_details(cid)
                        if detail:
                            retrieved_cases.append(detail)
                    sources.append("crima_tools:search_evidence")
                if not retrieved_cases:
                    retrieved_cases = await retrieval_svc.retrieve(query_plan)
                    sources.append("retrieval_service:hybrid")

        elif intent in ["timeline_search"]:
            case_id = entities.get("case_id")
            if not case_id:
                import re
                m = re.search(r"FIR-\d+-\d+", resolved_text)
                if m:
                    case_id = m.group(0)
                else:
                    ctx = conversation_manager.get_context(session_id)
                    if ctx.active_cases:
                        case_id = ctx.active_cases[0]
            if case_id:
                try:
                    timeline = await crima_tools.get_case_timeline(case_id)
                    extra_timeline = timeline
                    detail = await crima_tools.get_case_details(case_id)
                    if detail:
                        retrieved_cases = [detail]
                        sources.append("crima_tools:get_case_timeline")
                except Exception as e:
                    logger.warning("timeline fetch failed: %s", e)
                    retrieved_cases = await retrieval_svc.retrieve(query_plan)
            else:
                retrieved_cases = await retrieval_svc.retrieve(query_plan)
                sources.append("retrieval_service:hybrid")

        elif intent in ["similar_case_search", "cross_reference"]:
            case_id = entities.get("case_id")
            if not case_id:
                import re
                m = re.search(r"FIR-\d+-\d+", resolved_text)
                if m:
                    case_id = m.group(0)
                else:
                    ctx = conversation_manager.get_context(session_id)
                    if ctx.active_cases:
                        case_id = ctx.active_cases[0]
            if case_id:
                try:
                    related = await crima_tools.get_related_cases(case_id)
                    # Convert related to full case objects
                    for r in related[:10]:
                        rid = r.get("case_id")
                        detail = await crima_tools.get_case_details(rid)
                        if detail:
                            # preserve similarity_score
                            detail["similarity_score"] = r.get("similarity_score", 0.5)
                            detail["retrieval_score"] = r.get("similarity_score", 0.5)
                            retrieved_cases.append(detail)
                    sources.append("crima_tools:get_related_cases")
                except Exception as e:
                    logger.warning("get_related_cases failed: %s", e)
                    retrieved_cases = await retrieval_svc.retrieve(query_plan)
            else:
                retrieved_cases = await retrieval_svc.retrieve(query_plan)

        else:
            # Default: case_search, location_query, statistics, etc. via crima_tools search_cases
            # For statistics we also need counts, but search_cases gives raw list; _get_statistics handles total
            if intent == "statistics":
                retrieved_cases = await retrieval_svc.retrieve(query_plan)
                sources.append("retrieval_service:_get_statistics")
            else:
                # Try crima_tools first
                try:
                    # detect semantic-heavy
                    is_semantic = len(text.split()) > 8 and not (primary_location or entities.get("crime_type"))
                    if is_semantic or getattr(query_plan, 'semantic_search', False):
                        # Use hybrid retrieval via retrieval_service which does structured+faiss with weights
                        retrieved_cases = await retrieval_svc.retrieve(query_plan)
                        sources.append("retrieval_service:hybrid")
                    else:
                        cases = await crima_tools.search_cases(
                            crime_type=query_plan.crime_type,
                            location=query_plan.location,
                            district=query_plan.district,
                            status=query_plan.status,
                            priority=query_plan.priority,
                            date_from=query_plan.date_from,
                            date_to=query_plan.date_to,
                            limit=query_plan.limit,
                            offset=query_plan.offset,
                        )
                        retrieved_cases = cases
                        sources.append("crima_tools:search_cases")
                        # If no results and semantic heavy fallback to hybrid
                        if not cases and is_semantic:
                            hybrid = await retrieval_svc.retrieve(query_plan)
                            if hybrid:
                                retrieved_cases = hybrid
                                sources.append("retrieval_service:hybrid")
                except Exception as e:
                    logger.warning("crima_tools search failed, fallback to retrieval_service: %s", e)
                    retrieved_cases = await retrieval_svc.retrieve(query_plan)
                    sources.append("retrieval_service:fallback")

        # Ensure sources has at least one entry
        if not sources:
            sources = ["sqlite_db:ci_Cases"]

        # Build context records from retrieved cases
        for case in retrieved_cases:
            context_records.append(self._case_to_record(case))

        # Prepare results for response - include evidence/suspect sub-results when asked
        for case in retrieved_cases[:10]:  # Limit to top 10
            if case.get("type") == "statistics":
                # Handle statistics response specially
                results.append(
                    QueryResult(
                        case_id="",
                        crime_type="Statistics",
                        location="",
                        date_filed="",
                        status="",
                        confidence=1.0,
                        summary=f"Total cases: {case.get('total_cases', 0)}, Open: {case.get('open_cases', 0)}, Closed: {case.get('closed_cases', 0)}, Clearance rate: {case.get('clearance_rate', 0)}%",
                    )
                )
            else:
                # Build summary that includes evidence/suspect counts when relevant
                base_summary = self._case_to_record(case).get("summary", "")
                # If evidence_search, append evidence info
                if intent == "evidence_search" and extra_evidence:
                    cid = case.get("case_id") or case.get("ROWID") or ""
                    ev_for_case = [e for e in extra_evidence if e.get("case_id") == cid]
                    if ev_for_case:
                        base_summary += f" | Evidence: {len(ev_for_case)} items ({', '.join(e.get('file_name','') for e in ev_for_case[:2])})"
                if intent == "suspect_search" and extra_suspects:
                    cid = case.get("case_id") or case.get("ROWID") or ""
                    sus_for_case = [s for s in extra_suspects if s.get("case_id") == cid]
                    if sus_for_case:
                        base_summary += f" | Suspects: {', '.join(s.get('name','') for s in sus_for_case[:2])}"
                if intent == "witness_search" and extra_witnesses:
                    cid = case.get("case_id") or case.get("ROWID") or ""
                    wit_for_case = [w for w in extra_witnesses if w.get("case_id") == cid]
                    if wit_for_case:
                        base_summary += f" | Witnesses: {', '.join(w.get('name','') for w in wit_for_case[:2])}"
                if intent == "timeline_search" and extra_timeline:
                    base_summary += f" | Timeline events: {len(extra_timeline)}"

                results.append(
                    QueryResult(
                        case_id=case.get("case_id") or case.get("ROWID") or "",
                        crime_type=case.get("crime_type", ""),
                        location=case.get("location", ""),
                        date_filed=case.get("date_filed", ""),
                        status=case.get("status", ""),
                        confidence=case.get("retrieval_score", case.get("similarity_score", 0.9)),
                        summary=base_summary,
                    )
                )

        total_found = len(results)
        
        # Build specific zero-result message based on filters
        filter_parts = []
        if primary_location:
            filter_parts.append(f"location '{primary_location}'")
        if entities.get("crime_type"):
            filter_parts.append(f"crime type '{entities.get('crime_type')}'")
        if entities.get("status"):
            filter_parts.append(f"status '{entities.get('status')}'")
        
        filter_desc = ", ".join(filter_parts) if filter_parts else "your query"
        
        # Handle statistics intent specially
        if intent == "statistics" and results and results[0].crime_type == "Statistics":
            # Use the statistics summary directly
            stats = results[0].summary
            response_text = stats
            confidence_avg = 1.0
            # Parse total_cases from summary for total_found
            import re
            match = re.search(r'Total cases: (\d+)', stats)
            total_found = int(match.group(1)) if match else 0
        elif results:
            confidence_avg = round(
                sum(r.confidence for r in results) / len(results), 4
            ) if results else 0.0
            # Grounded summaries: after retrieval, call LLM with retrieved context (or fallback template) that cites case_ids and does not hallucinate
            response_text = await self._generate_grounded_response(
                text, context_records, intent, entities
            )
            if not response_text or response_text.startswith("Insufficient"):
                if results:
                    case_ids_str = ", ".join([r.case_id for r in results[:5] if r.case_id])
                    response_text = (
                        f"I found {total_found} relevant case{'s' if total_found != 1 else ''} "
                        f"related to your query. "
                        f"Case IDs: {case_ids_str}. "
                        f"Crime types: {', '.join(set(r.crime_type for r in results[:5]))}."
                    )
                else:
                    response_text = (
                        f"No cases matching {filter_desc} were found in the available records."
                    )
                    confidence_avg = 0.1
        else:
            response_text = (
                f"No cases matching {filter_desc} were found in the available records."
            )
            confidence_avg = 0.05
            total_found = 0
            # add grounding fallback that cites no hallucination
            if not response_text.startswith("Insufficient"):
                pass

        # Update conversation history and context
        conversation_manager.add_to_history(session_id, "assistant", response_text or "", {
            "intent": intent,
            "entities": entities,
            "results_count": len(results)
        })
        # Update active context for follow-ups
        try:
            conversation_manager.update_context(session_id, last_intent=intent)
            if results:
                # set last results for resolve_references
                conversation_manager.set_last_results(session_id, retrieved_cases)
                # also update active filters
                conversation_manager.update_context(session_id, active_filters={
                    "crime_type": entities.get("crime_type"),
                    "location": primary_location,
                    "district": district,
                    "status": entities.get("status"),
                })
                if primary_location:
                    conversation_manager.update_context(session_id, active_location=primary_location)
                if entities.get("crime_type"):
                    conversation_manager.update_context(session_id, active_crime_type=entities.get("crime_type"))
                # store active_cases
                for r in results[:5]:
                    if r.case_id:
                        conversation_manager.add_case_to_context(session_id, r.case_id)
        except Exception as e:
            logger.warning("Failed to update conversation context: %s", e)

        # Save to context_service for sliding window
        try:
            await self.context_service.save(session_id, text, response_text)
        except Exception:
            pass

        # Ensure sources are DB-derived, not hardcoded via counts
        # Single source of truth: all counts from DB-derived retrieved_cases

        return QueryResponse(
            response=response_text,
            results=results,
            intent=intent,
            confidence_avg=confidence_avg,
            total_found=total_found,
            sources=sources,
            entities=entities,
        )

    async def _generate_grounded_response(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        context_validation = grounding_validator.validate_context(context_records)
        if not context_validation["valid"]:
            return context_validation["fallback_message"]

        result: LLMResponse = await LLMProviderFactory.generate_with_fallback(
            query, context_records, intent, entities
        )
        logger.info("CRIMA response from provider: %s (model: %s, fallback: %s)",
                    result.provider, result.model, result.metadata.get("fallback", False))

        # Handle LLM timeout or error - return grounded fallback instead of empty
        if result.metadata.get("error") == "timeout":
            logger.warning("LLM provider %s timed out, returning grounded fallback", result.provider)
            return self._build_grounded_fallback_response(query, context_records, intent, entities)
        
        if result.metadata.get("error") and not result.answer:
            logger.warning("LLM provider %s returned error: %s, returning grounded fallback", 
                         result.provider, result.metadata.get("error"))
            return self._build_grounded_fallback_response(query, context_records, intent, entities)

        response_validation = grounding_validator.validate_response(
            result.answer, context_records, intent
        )
        if not response_validation["valid"]:
            return response_validation["fallback_message"]
        # Ensure response cites case_ids (grounded summaries must cite case_ids)
        if context_records and not any(cid in result.answer for cid in [r.get("case_id","") for r in context_records[:3] if r.get("case_id")]):
            # Append citation if missing
            case_ids = ", ".join([r.get("case_id","") for r in context_records[:3] if r.get("case_id")])
            if case_ids:
                result.answer = f"{result.answer} [Sources: {case_ids}]"

        return result.answer

    def _build_grounded_fallback_response(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        """Build a grounded response using only retrieved database records when LLM fails."""
        if not context_records:
            return "Insufficient information was found in the available crime database."

        case_ids = [r.get("case_id", "Unknown") for r in context_records[:5]]
        crime_types = list(set(r.get("crime_type", "Unknown") for r in context_records))
        locations = list(set(r.get("location", "Unknown") for r in context_records))
        statuses = list(set(r.get("status", "Unknown") for r in context_records))

        if intent == "statistics":
            total = len(context_records)
            open_count = sum(1 for r in context_records if r.get("status") in ["open", "under_investigation"])
            closed_count = sum(1 for r in context_records if r.get("status") == "closed")
            return (
                f"Based on {total} retrieved cases: "
                f"{open_count} open, {closed_count} closed. "
                f"Case IDs: {', '.join(case_ids)}. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}. "
                f"Statuses: {', '.join(statuses[:5])}."
            )

        if intent in ["case_search", "location_query", "cross_reference", "evidence_search", "suspect_search", "witness_search"]:
            return (
                f"Found {len(context_records)} relevant case(s) for your query. "
                f"Case IDs: {', '.join(case_ids)}. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}. "
                f"Statuses: {', '.join(statuses[:5])}."
            )

        if intent == "case_detail" and entities.get("case_id"):
            case_id = entities["case_id"]
            matching = [r for r in context_records if r.get("case_id") == case_id]
            if matching:
                r = matching[0]
                return (
                    f"Case {r.get('case_id', case_id)}: {r.get('crime_type', 'Unknown')} "
                    f"at {r.get('location', 'Unknown')}, {r.get('district', 'Unknown')}. "
                    f"Status: {r.get('status', 'Unknown')}. "
                    f"Filed on: {r.get('date_filed', 'Unknown')}. "
                    f"Description: {r.get('description', 'No description available.')[:300]} [Case ID: {r.get('case_id', case_id)}]"
                )
            return f"Case {case_id} was not found in the retrieved records."

        return (
            f"Retrieved {len(context_records)} case(s) related to your query. "
            f"Case IDs: {', '.join(case_ids)}. "
            f"Crime types: {', '.join(crime_types[:5])}. "
            f"Locations: {', '.join(locations[:5])}."
        )

    def _case_to_record(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "case_id": case_data.get("case_id", "") or case_data.get("ROWID", ""),
            "crime_type": case_data.get("crime_type", ""),
            "location": case_data.get("location", ""),
            "district": case_data.get("district", ""),
            "status": case_data.get("status", ""),
            "date_filed": case_data.get("date_filed", ""),
            "description": case_data.get("description", ""),
            "summary": (
                f"{case_data.get('crime_type', '')} at {case_data.get('location', '')}, "
                f"{case_data.get('district', '')} - {case_data.get('status', '')}"
            ),
        }

    async def get_history(self) -> list:
        return self._history

    async def clear_history(self) -> None:
        self._history.clear()

    async def _get_analytics_summary(self) -> dict:
        from services.analytics_service import AnalyticsService
        from adapters.sqlite_db import sqlite_db

        analytics_service = AnalyticsService(sqlite_db)
        overview = await analytics_service.get_overview()
        distribution = await analytics_service.get_distribution()

        top_crimes = []
        for item in distribution[:3]:
            top_crimes.append(f"{item['crime_type']} ({item['count']})")

        summary_parts = [
            f"Total cases: {overview['total_cases']}",
            f"Open cases: {overview['open_cases']}",
            f"Closed cases: {overview['closed_cases']}",
            f"Clearance rate: {overview['clearance_rate']}%",
        ]
        if top_crimes:
            summary_parts.append(f"Top crimes: {', '.join(top_crimes)}")

        return {
            "summary": ". ".join(summary_parts) + ".",
            "total_cases": overview["total_cases"],
        }

    async def _structured_retrieval(
        self,
        crime_type: Optional[str],
        locations: List[str],
        persons: List[str],
        date_ref: Optional[str],
        k: int = 10
    ) -> List[Tuple[Dict[str, Any], float]]:
        from adapters.sqlite_db import sqlite_db

        try:
            all_cases = await sqlite_db.get_all("Cases")
            if not all_cases:
                return []

            filtered = []
            for case in all_cases:
                if crime_type and case.get("crime_type") != crime_type:
                    continue
                if locations:
                    loc = locations[0].lower()
                    case_loc = (case.get("location") or "").lower()
                    case_district = (case.get("district") or "").lower()
                    if loc not in case_loc and loc not in case_district:
                        continue
                if date_ref and case.get("date_filed", "") < date_ref:
                    continue

                filtered.append(case)

            if persons:
                all_suspects = await sqlite_db.get_all("Suspects")
                person_names = [p.lower() for p in persons]
                matching_case_ids = set()
                for s in all_suspects:
                    suspect_name = (s.get("name") or "").lower()
                    if any(p in suspect_name for p in person_names):
                        matching_case_ids.add(s.get("case_id"))
                filtered = [c for c in filtered if (c.get("case_id") or c.get("ROWID")) in matching_case_ids]

            scored = []
            for case in filtered[:k]:
                scored.append((case, 0.9))
            return scored

        except Exception as e:
            logger.error("Structured retrieval failed: %s", e)
            return []
