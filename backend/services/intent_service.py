import re
from typing import Dict, List, Optional, Tuple


class IntentService:
    GREETING_KEYWORDS = [
        "hello", "hi", "hey", "greetings", "good morning", "good afternoon",
        "good evening", "howdy", "namaste", "what's up", "sup",
    ]

    STATISTICS_KEYWORDS = [
        "statistics", "stats", "dashboard", "overview", "summary", "analytics",
        "clearance rate", "crime rate", "how many", "total cases", "count",
    ]

    CASE_DETAIL_PATTERNS = [
        re.compile(r"(?:case|fir|detail|show|get|view|open)\s*(?:number)?\s*[#:]?\s*(FIR-\d+-\d+)", re.I),
        re.compile(r"(FIR-\d+-\d+)", re.I),
    ]

    CASE_SEARCH_KEYWORDS = [
        "find case", "search case", "lookup case", "cases of", "cases in",
        "list cases", "show cases", "all cases", "cases related", "search",
    ]

    SUSPECT_SEARCH_KEYWORDS = [
        "suspect", "accused", "wanted", "criminal", "person of interest",
    ]

    EVIDENCE_SEARCH_KEYWORDS = [
        "evidence", "forensic", "proof", "exhibit", "digital evidence",
    ]

    SUMMARIZATION_KEYWORDS = [
        "summarize", "summary", "brief", "overview of case", "tell me about",
        "explain case", "what happened in",
    ]

    CROSS_REFERENCE_KEYWORDS = [
        "cross reference", "related cases", "similar cases", "connected",
        "relate", "pattern", "modus operandi", "mo",
    ]

    LOCATION_QUERY_KEYWORDS = [
        "where", "location", "area", "district", "near", "in", "at",
        "incident location", "crime scene",
    ]

    PERSON_EXTRACTION = re.compile(
        r"(?:named|suspect|accused|called|known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        re.I,
    )

    LOCATION_EXTRACTION = re.compile(
        r"(?:in|near|at|around|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        re.I,
    )

    DATE_PATTERNS = [
        re.compile(r"(\d{4}-\d{2}-\d{2})"),
        re.compile(r"(\d{2}/\d{2}/\d{4})"),
        re.compile(r"(yesterday|today|last week|last month)"),
    ]

    @staticmethod
    def _score_keywords(text: str, keywords: List[str]) -> int:
        text_lower = text.lower()
        score = 0
        for kw in keywords:
            if kw in text_lower:
                score += 1
        return score

    async def classify(self, text: str) -> Tuple[str, Dict]:
        entities: Dict = {}

        for pattern in self.CASE_DETAIL_PATTERNS:
            match = pattern.search(text)
            if match:
                entities["case_id"] = match.group(1)
                break

        person_matches = self.PERSON_EXTRACTION.findall(text)
        if person_matches:
            entities["persons"] = person_matches

        location_matches = self.LOCATION_EXTRACTION.findall(text)
        if location_matches:
            entities["locations"] = location_matches

        crime_types = [
            "theft", "assault", "murder", "robbery", "cybercrime", "fraud",
            "kidnapping", "rioting", "dacoity",
        ]
        text_lower = text.lower()
        for ct in crime_types:
            if ct in text_lower:
                entities["crime_type"] = ct
                break

        for date_pat in self.DATE_PATTERNS:
            match = date_pat.search(text)
            if match:
                entities["date_ref"] = match.group(1)
                break

        greeting_score = self._score_keywords(text, self.GREETING_KEYWORDS)
        stats_score = self._score_keywords(text, self.STATISTICS_KEYWORDS)
        suspect_score = self._score_keywords(text, self.SUSPECT_SEARCH_KEYWORDS)
        evidence_score = self._score_keywords(text, self.EVIDENCE_SEARCH_KEYWORDS)
        summarize_score = self._score_keywords(text, self.SUMMARIZATION_KEYWORDS)
        cross_ref_score = self._score_keywords(text, self.CROSS_REFERENCE_KEYWORDS)
        location_score = self._score_keywords(text, self.LOCATION_QUERY_KEYWORDS)
        case_search_score = self._score_keywords(text, self.CASE_SEARCH_KEYWORDS)

        has_case_id = "case_id" in entities

        if greeting_score >= 2 or (greeting_score == 1 and len(text.split()) <= 3):
            entities["intent_class"] = "greeting"
            return ("greeting", entities)

        if has_case_id and summarize_score > 0:
            entities["intent_class"] = "case_detail"
            return ("case_detail", entities)

        if stats_score >= 2 or "statistics" in text_lower and stats_score >= 1:
            entities["intent_class"] = "statistics"
            return ("statistics", entities)

        if has_case_id:
            entities["intent_class"] = "case_detail"
            return ("case_detail", entities)

        if suspect_score >= 1:
            entities["intent_class"] = "suspect_search"
            return ("suspect_search", entities)

        if evidence_score >= 1:
            entities["intent_class"] = "evidence_search"
            return ("evidence_search", entities)

        if cross_ref_score >= 1:
            entities["intent_class"] = "cross_reference"
            return ("cross_reference", entities)

        if location_score >= 1:
            entities["intent_class"] = "location_query"
            return ("location_query", entities)

        if summarize_score >= 1:
            entities["intent_class"] = "summarization"
            return ("summarization", entities)

        entities["intent_class"] = "case_search"
        return ("case_search", entities)
