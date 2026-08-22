import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class GroundingValidator:
    def __init__(self) -> None:
        pass

    def validate_context(self, context_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not context_records:
            return {
                "valid": False,
                "reason": "No context records provided",
                "fallback_message": "Insufficient information was found in the available crime database."
            }

        missing_sources = []
        for i, record in enumerate(context_records):
            if not record.get("case_id"):
                missing_sources.append(f"Record {i}: missing case_id")

        if missing_sources:
            logger.warning("Context validation: missing sources - %s", missing_sources)
            return {
                "valid": False,
                "reason": f"Missing source metadata: {', '.join(missing_sources)}",
                "fallback_message": "Insufficient information was found in the available crime database."
            }

        return {"valid": True}

    def validate_response(
        self,
        response: str,
        context_records: List[Dict[str, Any]],
        intent: str,
    ) -> Dict[str, Any]:
        if not response:
            return {
                "valid": False,
                "reason": "Empty response from provider",
                "fallback_message": "Insufficient information was found in the available crime database."
            }

        if "insufficient" in response.lower() or "not found" in response.lower():
            return {"valid": True, "note": "Provider indicated insufficient information"}

        retrieved_case_ids = {r.get("case_id") for r in context_records if r.get("case_id")}
        mentioned_case_ids = self._extract_case_ids(response)

        unverified = mentioned_case_ids - retrieved_case_ids
        if unverified:
            logger.warning("Response mentions unverified case IDs: %s", unverified)
            return {
                "valid": False,
                "reason": f"Response mentions case IDs not in retrieved context: {unverified}",
                "fallback_message": "Insufficient information was found in the available crime database."
            }

        if intent == "statistics":
            if not self._validate_statistics(response, context_records):
                return {
                    "valid": False,
                    "reason": "Statistics in response cannot be verified from context",
                    "fallback_message": "Insufficient information was found in the available crime database."
                }

        return {"valid": True}

    def _extract_case_ids(self, text: str) -> set:
        import re
        pattern = r"FIR-\d+-\d+"
        matches = re.findall(pattern, text, re.IGNORECASE)
        return set(matches)

    def _validate_statistics(self, response: str, context_records: List[Dict[str, Any]]) -> bool:
        import re
        numbers = re.findall(r"\b\d+\b", response)
        if not numbers:
            return True

        total_cases = len(context_records)
        for num_str in numbers:
            num = int(num_str)
            if num > total_cases * 2:
                logger.warning("Statistics validation: number %d exceeds possible max %d", num, total_cases)
                return False
        return True

    def generate_fallback(self, reason: str) -> str:
        return f"Insufficient information was found in the available crime database. ({reason})"


grounding_validator = GroundingValidator()