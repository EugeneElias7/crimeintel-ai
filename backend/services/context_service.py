import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class ContextService:
    SLIDING_WINDOW = 5

    def __init__(self) -> None:
        self._stores: Dict[str, List[Dict[str, str]]] = {}

    async def merge(
        self, text: str, context: Optional[List[Dict[str, Any]]], entities: Dict[str, Any]
    ) -> str:
        enriched = text

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
            import re
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
