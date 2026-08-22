import logging
import os
import certifi
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Any, Dict, List, Optional

from config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self) -> None:
        self._initialized = False
        self._api_key = os.getenv("GEMINI_API_KEY", "")
        # Use gemini-3.6-flash which is available for new users
        self._api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
        self._session = None

    def _get_session(self):
        if self._session is None:
            self._session = requests.Session()
            self._session.verify = certifi.where()
            retry = Retry(total=3, backoff_factor=0.5)
            adapter = HTTPAdapter(max_retries=retry)
            self._session.mount("https://", adapter)
        return self._session

    async def initialize(self) -> None:
        if self._initialized:
            return

        if not self._api_key or self._api_key == "your_gemini_api_key_here":
            logger.warning("GEMINI_API_KEY not set. Gemini service will not be available.")
            self._initialized = True
            return

        try:
            session = self._get_session()
            headers = {"x-goog-api-key": self._api_key, "Content-Type": "application/json"}
            data = {"contents": [{"parts": [{"text": "test"}]}]}
            response = session.post(self._api_url, headers=headers, json=data, timeout=60)
            if response.status_code == 200:
                self._initialized = True
                logger.info("Gemini service initialized successfully via REST API with certifi")
            else:
                logger.error("Gemini API test failed: %s", response.text)
                self._initialized = True
        except Exception as e:
            logger.error("Failed to initialize Gemini service: %s", e)
            self._initialized = True

    async def generate_grounded_response(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        await self.initialize()

        if not self._initialized or not self._api_key:
            return self._fallback_response(query, context_records, intent, entities)

        if not context_records:
            return "Insufficient information was found in the available crime database."

        context_text = self._build_context(context_records)
        prompt = self._build_prompt(query, context_text, intent, entities)

        try:
            session = self._get_session()
            headers = {
                "x-goog-api-key": self._api_key,
                "Content-Type": "application/json",
            }
            data = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 1024,
                },
            }
            response = session.post(self._api_url, headers=headers, json=data, timeout=30)
            if response.status_code == 200:
                result = response.json()
                return result["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                logger.error("Gemini API error: %s", response.text)
                return self._fallback_response(query, context_records, intent, entities)
        except Exception as e:
            logger.error("Gemini API call failed: %s", e)
            return self._fallback_response(query, context_records, intent, entities)

    def _build_context(self, records: List[Dict[str, Any]]) -> str:
        parts = []
        for i, record in enumerate(records, 1):
            case_id = record.get("case_id", "Unknown")
            crime_type = record.get("crime_type", "Unknown")
            location = record.get("location", "Unknown")
            district = record.get("district", "Unknown")
            status = record.get("status", "Unknown")
            date_filed = record.get("date_filed", "Unknown")
            description = record.get("description", "")
            summary = record.get("summary", "")

            part = f"[Case {i}]\n"
            part += f"Case ID: {case_id}\n"
            part += f"Crime Type: {crime_type}\n"
            part += f"Location: {location}, {district}\n"
            part += f"Date Filed: {date_filed}\n"
            part += f"Status: {status}\n"
            if description:
                part += f"Description: {description[:500]}\n"
            if summary:
                part += f"Summary: {summary}\n"
            parts.append(part)

        return "\n".join(parts)

    def _build_prompt(
        self,
        query: str,
        context_text: str,
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        return f"""You are CRIMA, the Crime Intelligence AI Assistant for Karnataka State Police.

USER QUERY: "{query}"
DETECTED INTENT: {intent}
ENTITIES: {entities}

RETRIEVED CASE RECORDS FROM DATABASE:
{context_text}

INSTRUCTIONS:
1. Answer the user's query using ONLY the retrieved case records above.
2. DO NOT invent or hallucinate any case details, case IDs, or statistics not present in the retrieved records.
3. If the retrieved records do not contain sufficient information to answer the query, respond with: "Insufficient information was found in the available crime database."
4. Always cite relevant Case IDs from the retrieved records when providing information.
5. For statistics queries, calculate from the retrieved records only.
6. Be concise, professional, and factual.
7. If multiple cases are relevant, summarize the key patterns.

YOUR RESPONSE:"""

    def _fallback_response(
        self,
        query: str,
        context_records: List[Dict[str, Any]],
        intent: str,
        entities: Dict[str, Any],
    ) -> str:
        if not context_records:
            return "Insufficient information was found in the available crime database."

        case_ids = [r.get("case_id", "Unknown") for r in context_records[:5]]
        crime_types = list(set(r.get("crime_type", "Unknown") for r in context_records))
        locations = list(set(r.get("location", "Unknown") for r in context_records))

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
                    f"Description: {r.get('description', 'No description available.')[:300]}"
                )
            return f"Case {case_id} was not found in the retrieved records."

        if intent == "statistics":
            total = len(context_records)
            open_count = sum(1 for r in context_records if r.get("status") in ["open", "under_investigation"])
            closed_count = sum(1 for r in context_records if r.get("status") == "closed")
            return (
                f"Based on {total} retrieved cases: "
                f"{open_count} open, {closed_count} closed. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}."
            )

        if intent in ["case_search", "location_query", "cross_reference"]:
            return (
                f"Found {len(context_records)} relevant case(s) for your query. "
                f"Case IDs: {', '.join(case_ids)}. "
                f"Crime types: {', '.join(crime_types[:5])}. "
                f"Locations: {', '.join(locations[:5])}."
            )

        return (
            f"Retrieved {len(context_records)} case(s) related to your query. "
            f"Case IDs: {', '.join(case_ids)}."
        )


gemini_service = GeminiService()