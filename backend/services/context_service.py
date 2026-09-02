import logging
import re
from typing import Any, Dict, List, Optional

from services.conversation_manager import conversation_manager

logger = logging.getLogger(__name__)


class ContextService:
    SLIDING_WINDOW = 5

    def __init__(self) -> None:
        self._stores: Dict[str, List[Dict[str, str]]] = {}

    async def merge(
        self, text: str, context: Optional[List[Dict[str, Any]]], entities: Dict[str, Any]
    ) -> str:
        """Merge query with conversation context. Handles follow-ups via conversation_manager."""
        enriched = text

        # If context provided, use it; else try session-based context
        # For Level 3 follow-ups: resolve references like "only open ones", "second one", etc.
        # We attempt to find session_id from entities or use default
        session_id = entities.get("_session_id", "default")
        try:
            # Use conversation_manager resolve_references if available
            resolved = conversation_manager.resolve_references(text, session_id)
            if resolved != text:
                enriched = resolved
        except Exception:
            pass

        if context and len(context) > 0:
            last_exchange = context[-1]
            last_response = last_exchange.get("response", "") or last_exchange.get("text", "")

        pronouns = {"they": "case", "it": "case", "that case": "case"}
        text_lower = enriched.lower()
        for pronoun, replacement in pronouns.items():
            if pronoun in text_lower and not entities.get("case_id"):
                last_case_id = await self._find_last_case_id(context)
                if last_case_id:
                    enriched = enriched.replace(pronoun, f"case {last_case_id}", 1)

        if not entities.get("crime_type") and not entities.get("case_id"):
            last_filters = await self._get_last_filters(context)
            if last_filters:
                filter_desc = " ".join(
                    f"{k}={v}" for k, v in last_filters.items()
                )
                enriched = f"{enriched} [context filters: {filter_desc}]"

        # Also inject active context from conversation_manager if no explicit location
        try:
            ctx_sum = conversation_manager.get_context_summary(session_id)
            if not entities.get("locations") and ctx_sum.get("active_location"):
                # append hint only if enriched doesn't already contain location
                if ctx_sum["active_location"].lower() not in enriched.lower():
                    enriched = f"{enriched} [active_location: {ctx_sum['active_location']}]"
            if not entities.get("crime_type") and ctx_sum.get("active_crime_type"):
                if ctx_sum["active_crime_type"].lower() not in enriched.lower():
                    enriched = f"{enriched} [active_crime_type: {ctx_sum['active_crime_type']}]"
        except Exception:
            pass

        return enriched

    async def save(self, user_id: str, query: str, response: str) -> None:
        if user_id not in self._stores:
            self._stores[user_id] = []

        self._stores[user_id].append({
            "role": "user",
            "text": query,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        })
        self._stores[user_id].append({
            "role": "assistant",
            "text": response,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        })

        if len(self._stores[user_id]) > self.SLIDING_WINDOW * 2:
            self._stores[user_id] = self._stores[user_id][
                -(self.SLIDING_WINDOW * 2):
            ]

    async def get_history(self, user_id: str) -> list:
        return self._stores.get(user_id, [])

    async def clear(self, user_id: str) -> None:
        if user_id in self._stores:
            del self._stores[user_id]

    async def _find_last_case_id(
        self, context: Optional[List[Dict[str, Any]]]
    ) -> Optional[str]:
        if not context:
            return None
        for entry in reversed(context):
            text = str(entry.get("response", "") or entry.get("text", ""))
            match = re.search(r"FIR-\d+-\d+", text)
            if match:
                return match.group(0)
        return None

    async def _get_last_filters(
        self, context: Optional[List[Dict[str, Any]]]
    ) -> Optional[Dict[str, Any]]:
        if not context:
            return None
        for entry in reversed(context):
            if "filters" in entry:
                return entry["filters"]
        return None

    def resolve_references(self, text: str, session_id: str) -> str:
        """Expose conversation_manager resolve_references via context_service."""
        try:
            return conversation_manager.resolve_references(text, session_id)
        except Exception:
            return text
