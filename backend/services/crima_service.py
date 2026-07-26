import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from models.crima import QueryResponse, QueryResult

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
        self, text: str, context: Optional[List[Dict[str, Any]]] = None
    ) -> QueryResponse:
        context = context or []

        intent, entities = await self.intent_service.classify(text)

        enriched_query = await self.context_service.merge(text, context, entities)

        total_found = 0
        results: List[QueryResult] = []
        sources: List[str] = []
        response_text = ""
        confidence_avg = 0.0

        if intent == "greeting":
            response_text = (
                "Hello! I am CRIMA, your Crime Intelligence Assistant. "
                "I can help you search for cases, view case details, "
                "look up suspects or evidence, and provide crime statistics. "
                "How can I assist you today?"
            )
            confidence_avg = 1.0
            sources = ["crima_knowledge"]

        elif intent == "case_detail":
            case_id = entities.get("case_id", "")
            if case_id:
                try:
                    case_data = await self.case_service.get_case(case_id)
                    summary = (
                        f"Case {case_data['case_id']}: {case_data['crime_type']} "
                        f"at {case_data['location']}, {case_data['district']}. "
                        f"Status: {case_data['status']}. "
                        f"Filed by officer {case_data['officer']['display_name']}. "
                        f"Suspects: {case_data['suspect_count']}, Evidence items: {case_data['evidence_count']}."
                    )
                    results.append(
                        QueryResult(
                            case_id=case_data["case_id"],
                            crime_type=case_data["crime_type"],
                            location=case_data["location"],
                            date_filed=case_data["date_filed"],
                            status=case_data["status"],
                            confidence=0.95,
                            summary=summary,
                        )
                    )
                    total_found = 1
                    confidence_avg = 0.95
                    sources = [f"Cases/{case_id}"]
                    response_text = summary
                except ValueError as e:
                    response_text = f"Case {case_id} was not found in the system."
                    confidence_avg = 0.0
                    sources = []
            else:
                response_text = "Please specify a case ID to view details."
                confidence_avg = 0.0

        elif intent == "statistics":
            try:
                analytics = await self._get_analytics_summary()
                response_text = analytics.get("summary", "")
                total_found = analytics.get("total_cases", 0)
                confidence_avg = 0.9
                sources = ["analytics_service"]
            except Exception as e:
                logger.error("Failed to get analytics: %s", e)
                response_text = "Unable to retrieve crime statistics at this time."
                confidence_avg = 0.0

        else:
            try:
                embedding = await self.embedding_service.generate(enriched_query)

                similar = await self.faiss_service.search(embedding, k=10)

                if similar:
                    id_mapping = await self.faiss_service.get_id_mapping()
                    for idx, score in similar:
                        case_id = id_mapping.get(idx)
                        if not case_id:
                            continue
                        try:
                            case_data = await self.case_service.get_case(case_id)
                            results.append(
                                QueryResult(
                                    case_id=case_data["case_id"],
                                    crime_type=case_data["crime_type"],
                                    location=case_data["location"],
                                    date_filed=case_data["date_filed"],
                                    status=case_data["status"],
                                    confidence=round(score, 4),
                                    summary=(
                                        f"{case_data['crime_type']} at {case_data['location']}, "
                                        f"{case_data['district']} - {case_data['status']}"
                                    ),
                                )
                            )
                            sources.append(f"Cases/{case_id}")
                        except ValueError:
                            continue

                    total_found = len(results)
                    if results:
                        confidence_avg = round(
                            sum(r.confidence for r in results) / len(results), 4
                        )
                        response_text = (
                            f"I found {total_found} relevant case{'s' if total_found != 1 else ''} "
                            f"related to your query."
                        )
                    else:
                        response_text = (
                            "I could not find any cases matching your query. "
                            "Try being more specific or using different keywords."
                        )
                        confidence_avg = 0.1
                else:
                    response_text = (
                        "No similar cases found in the database. "
                        "Please try rephrasing your query."
                    )
                    confidence_avg = 0.05
                    total_found = 0

            except Exception as e:
                logger.error("Embedding/FAISS search failed: %s", e)
                response_text = (
                    "I encountered an issue while searching the case database. "
                    "Please try again later."
                )
                confidence_avg = 0.0

        self._history.append({
            "role": "user",
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
        })
        self._history.append({
            "role": "assistant",
            "text": response_text,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return QueryResponse(
            response=response_text,
            results=results,
            intent=intent,
            confidence_avg=confidence_avg,
            total_found=total_found,
            sources=sources,
            entities=entities,
        )

    async def get_history(self) -> list:
        return self._history

    async def clear_history(self) -> None:
        self._history.clear()

    async def _get_analytics_summary(self) -> dict:
        from services.analytics_service import AnalyticsService
        from adapters.catalyst_db import catalyst_db

        analytics_service = AnalyticsService(catalyst_db)
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
