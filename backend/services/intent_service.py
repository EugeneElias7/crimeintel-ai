import re
from typing import Dict, List, Optional, Tuple
from services.conversation_manager import conversation_manager
from services.entity_resolution import entity_resolution_service, ResolvedEntity


class IntentService:
    GREETING_KEYWORDS = [
        "hello", "hi", "hey", "greetings", "good morning", "good afternoon",
        "good evening", "howdy", "namaste", "what's up", "sup", "hola",
        "ola", "saludos", "bonjour", "ciao", "hallo", "ni hao", "konnichiwa",
    ]

    STATISTICS_KEYWORDS = [
        "statistics", "stats", "dashboard", "overview", "summary", "analytics",
        "clearance rate", "crime rate", "how many", "total cases", "count",
        "open cases", "closed cases", "filed cases", "number of cases",
    ]

    CASE_DETAIL_PATTERNS = [
        re.compile(r"(?:case|fir|detail|show|get|view|open)\s*(?:number)?\s*[#:]?\s*(FIR-\d+-\d+)", re.I),
        re.compile(r"(FIR-\d+-\d+)", re.I),
        re.compile(r"(FIR[\s\-:]*[\d\-]+)", re.I),  # FIR followed by digits/dashes (ID-like)
    ]

    CASE_SEARCH_KEYWORDS = [
        "find case", "search case", "lookup case", "cases of", "cases in",
        "list cases", "show cases", "all cases", "cases related", "search",
    ]

    SUSPECT_SEARCH_KEYWORDS = [
        "suspect", "suspects", "accused", "wanted", "criminal", "person of interest",
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

    WITNESS_SEARCH_KEYWORDS = [
        "witness", "witnesses", "testimony", "statement", "eyewitness",
    ]

    TIMELINE_SEARCH_KEYWORDS = [
        "timeline", "history", "chronology", "events", "progress", "what happened",
    ]

    SIMILAR_CASE_SEARCH_KEYWORDS = [
        "similar", "like", "resemble", "comparable", "analogous",
    ]

    CRIME_TREND_KEYWORDS = [
        "trend", "trending", "increasing", "decreasing", "pattern", "rise", "fall",
        "increase", "decrease", "spike", "surge", "drop",
    ]

    GENERAL_HELP_KEYWORDS = [
        "help", "what can you do", "capabilities", "features", "commands",
    ]

    PERSON_EXTRACTION = re.compile(
        r"(?:named|suspect|accused|called|known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        re.I,
    )

    LOCATION_EXTRACTION = re.compile(
        r"(?:in|near|at|around|from|about|of|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        re.I,
    )

    KNOWN_LOCATIONS = [
        "Jalhalli", "Jalahalli", "Bengaluru", "Bangalore", "Mysore", "Mangalore",
        "Hubli", "Dharwad", "Gulbarga", "Shimoga", "Tumkur", "Belgaum",
        "Koramangala", "Indiranagar", "MG Road", "Whitefield", "Hebbal",
        "Yelahanka", "Marathahalli", "Electronic City", "HSR Layout",
        "BTM Layout", "JP Nagar", "Jayanagar", "Rajajinagar", "Malleswaram",
        "Vijayanagar", "Basavanagudi", "Kuvempunagar", "Gokulam", "Vinobanagar",
        "Saptapur", "MG Road"
    ]

    CRIME_TYPES = [
        "theft", "assault", "murder", "robbery", "cybercrime", "fraud",
        "kidnapping", "rioting", "dacoity",
    ]

    STATUS_TYPES = [
        "open", "closed", "filed", "under_investigation",
    ]

    LOCATION_ALIASES = {
        "bangalore": "Bangalore",
        "bengaluru": "Bangalore",
        "jalhalli": "Jalahalli",
        "jalahalli": "Jalahalli",
        "jalahalley": "Jalahalli",
        "mg road": "MG Road",
        "m.g. road": "MG Road",
        "indiranagar": "Indiranagar",
        "koramangala": "Koramangala",
        "whitefield": "Whitefield",
        "hebbal": "Hebbal",
        "yelahanka": "Yelahanka",
        "marathahalli": "Marathahalli",
        "electronic city": "Electronic City",
        "hsr layout": "HSR Layout",
        "btm layout": "BTM Layout",
        "jp nagar": "JP Nagar",
        "jayanagar": "Jayanagar",
        "rajajinagar": "Rajajinagar",
        "malleswaram": "Malleswaram",
    }

    DATE_PATTERNS = [
        re.compile(r"(\d{4}-\d{2}-\d{2})"),
        re.compile(r"(\d{2}/\d{2}/\d{4})"),
        re.compile(r"(yesterday|today|last week|last month)"),
    ]

    @staticmethod
    def _score_keywords(text: str, keywords: List[str]) -> int:
        import re
        text_lower = text.lower()
        score = 0
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                score += 1
        return score

    def _normalize_location(self, location: str) -> Optional[str]:
        loc_lower = location.lower().strip()
        return self.LOCATION_ALIASES.get(loc_lower, location)

    def _normalize_crime_type(self, crime_type: str) -> Optional[str]:
        ct_lower = crime_type.lower().strip()
        for ct in self.CRIME_TYPES:
            if ct == ct_lower or ct in ct_lower:
                return ct
        return None

    def _get_context(self, session_id: str) -> Dict:
        """Get conversation context for the session."""
        return conversation_manager.get_context_summary(session_id)

    def _resolve_entities_with_context(self, entities: Dict, context: Dict) -> Dict:
        """Resolve entities using conversation context."""
        resolved = entities.copy()
        
        # Resolve location from context if not explicitly mentioned
        if "locations" not in resolved and context.get("active_location"):
            resolved["locations"] = [context["active_location"]]
        
        # Resolve crime type from context
        if "crime_type" not in resolved and context.get("active_crime_type"):
            resolved["crime_type"] = context["active_crime_type"]
        
        # Resolve person from context
        if "persons" not in resolved and context.get("active_person"):
            resolved["persons"] = [context["active_person"]]
        
        return resolved

    async def classify(self, text: str, session_id: str = "default") -> Tuple[str, Dict]:
        context = self._get_context(session_id)
        entities: Dict = {}

        # Check for empty/whitespace query
        if not text.strip():
            raise ValueError("Query cannot be empty")

        # Check for greetings first (highest priority for short queries)
        greeting_score = self._score_keywords(text, self.GREETING_KEYWORDS)
        if greeting_score >= 2 or (greeting_score == 1 and len(text.split()) <= 3):
            entities["intent_class"] = "greeting"
            return ("greeting", entities)

        # Check for help request
        help_score = self._score_keywords(text, self.GENERAL_HELP_KEYWORDS)
        if help_score >= 1:
            entities["intent_class"] = "general_help"
            return ("general_help", entities)

        # Extract entities
        entities = await self._extract_entities(text)

        # Resolve entities with conversation context
        context = self._get_context(session_id)
        entities = self._resolve_entities_with_context(entities, context)

        # Extract case ID from text (not done in _extract_entities)
        for pattern in self.CASE_DETAIL_PATTERNS:
            match = pattern.search(text)
            if match:
                entities["case_id"] = match.group(1)
                break

        # Extract date reference (not done in _extract_entities)
        for date_pat in self.DATE_PATTERNS:
            match = date_pat.search(text)
            if match:
                entities["date_ref"] = match.group(1)
                break

        # Score different intent categories
        greeting_score = self._score_keywords(text, self.GREETING_KEYWORDS)
        stats_score = self._score_keywords(text, self.STATISTICS_KEYWORDS)
        suspect_score = self._score_keywords(text, self.SUSPECT_SEARCH_KEYWORDS)
        evidence_score = self._score_keywords(text, self.EVIDENCE_SEARCH_KEYWORDS)
        summarize_score = self._score_keywords(text, self.SUMMARIZATION_KEYWORDS)
        cross_ref_score = self._score_keywords(text, self.CROSS_REFERENCE_KEYWORDS)
        location_score = self._score_keywords(text, self.LOCATION_QUERY_KEYWORDS)
        case_search_score = self._score_keywords(text, self.CASE_SEARCH_KEYWORDS)
        witness_score = self._score_keywords(text, self.WITNESS_SEARCH_KEYWORDS)
        timeline_score = self._score_keywords(text, self.TIMELINE_SEARCH_KEYWORDS)
        similar_score = self._score_keywords(text, self.SIMILAR_CASE_SEARCH_KEYWORDS)
        trend_score = self._score_keywords(text, self.CRIME_TREND_KEYWORDS)
        help_score = self._score_keywords(text, self.GENERAL_HELP_KEYWORDS)

        # Special handling for "how many" + "cases" pattern
        has_how_many = "how many" in text.lower()
        has_cases = "cases" in text.lower()
        if has_how_many and has_cases:
            stats_score += 2
            location_score = max(0, location_score - 1)
            case_search_score = max(0, case_search_score - 1)

        has_case_id = "case_id" in entities

        # Empty/whitespace query check
        if not text.strip():
            raise ValueError("Query cannot be empty")

        # Help request
        if help_score >= 1:
            entities["intent_class"] = "general_help"
            return ("general_help", entities)

        # Explicit summarization with case ID
        # Check case_detail first if "tell me about" is used with a case ID
        # This must come BEFORE the summarization check to ensure "tell me about FIR-2026-000097" routes to case_detail
        wants_detail = any(phrase in text.lower() for phrase in [
            "tell me about", "detail", "show me", "get info", "lookup", "look up", 
            "find", "what is", "what's", "info on", "information on", "check", "exists",
            "nonexistent", "invalid", "missing", "not found"
        ])
        has_case_id = "case_id" in entities and entities.get("case_id") != "INVALID"
        
        # If "tell me about" + case_id, route to case_detail (before summarization check)
        # Only apply if case_id is a valid FIR format (FIR-XXXX-XXXXXX), not already INVALID
        if has_case_id and wants_detail and "FIR-" in text.upper():
            entities["intent_class"] = "case_detail"
            return ("case_detail", entities)
        
        # If evidence search request with case ID, route to evidence_search (before case_detail check)
        evidence_phrases = ["what evidence is associated with", "evidence for", "evidence related to"]
        if any(phrase in text.lower() for phrase in evidence_phrases) and has_case_id:
            entities["intent_class"] = "evidence_search"
            return ("evidence_search", entities)

        # Statistics queries
        if stats_score >= 2 or ("statistics" in text.lower() and stats_score >= 1):
            entities["intent_class"] = "statistics"
            return ("statistics", entities)

        # Handle "no cases" / empty query patterns
        no_case_phrases = ["no cases", "no matching cases", "no cases found", "there are no cases"]
        no_case_score = self._score_keywords(text, no_case_phrases)
        if no_case_score >= 1:
            entities["intent_class"] = "empty_query"
            return ("empty_query", entities)

        # Case ID present
        if has_case_id:
            explicit_summarize = any(kw in text.lower() for kw in ["summarize", "summary", "brief"])
            if summarize_score > 0 and explicit_summarize:
                entities["intent_class"] = "summarization"
                return ("summarization", entities)
            entities["intent_class"] = "case_detail"
            return ("case_detail", entities)

        # Check for "FIR" or "case" without valid ID - treat as case_detail but will return not found
        has_fir_keyword = "fir" in text.lower()
        has_case_keyword = "case" in text.lower()
        # Trigger case_detail for: tell me about, detail, show me, get info on, lookup, find FIR/case
        wants_detail = any(phrase in text.lower() for phrase in [
            "tell me about", "detail", "show me", "get info", "lookup", "look up", 
            "find", "what is", "what's", "info on", "information on", "check", "exists",
            "nonexistent", "invalid", "missing", "not found"
        ])
        # Check if this looks like a search query (has location + crime_type or "case"/"cases")
        has_location = bool(entities.get("locations"))
        has_crime_type = bool(entities.get("crime_type"))
        has_case_term = "case" in text.lower() or "cases" in text.lower()
        is_search_query = has_location and (has_crime_type or has_case_term)
        
        if has_fir_keyword and (wants_detail or summarize_score > 0) and not is_search_query:
            # Looks like they want case detail but didn't provide valid FIR ID
            entities["intent_class"] = "case_detail"
            entities["case_id"] = "INVALID"
            return ("case_detail", entities)
        # Also handle "case" keyword with detail intent (but not "cases" plural which is search)
        if has_case_keyword and not "cases" in text.lower() and wants_detail and not is_search_query:
            entities["intent_class"] = "case_detail"
            entities["case_id"] = "INVALID"
            return ("case_detail", entities)

        # Suspect search
        if suspect_score >= 1:
            entities["intent_class"] = "suspect_search"
            return ("suspect_search", entities)

        # Evidence search
        if evidence_score >= 1:
            entities["intent_class"] = "evidence_search"
            return ("evidence_search", entities)

        # Witness search
        if "witness" in text.lower() or "statement" in text.lower():
            entities["intent_class"] = "witness_search"
            return ("witness_search", entities)

        # Timeline search
        if timeline_score >= 1:
            entities["intent_class"] = "timeline_search"
            return ("timeline_search", entities)

        # Cross reference
        if cross_ref_score >= 1:
            entities["intent_class"] = "cross_reference"
            return ("cross_reference", entities)

        # Similar case search
        if similar_score >= 1:
            entities["intent_class"] = "similar_case_search"
            return ("similar_case_search", entities)

        # Crime trend analysis
        if trend_score >= 1:
            entities["intent_class"] = "crime_trend"
            return ("crime_trend", entities)

        # Aggregation queries: "which district has the highest number of theft cases?",
        # "which district has the most theft?", "what district reports the most theft cases?",
        # "where are theft cases highest?"
        aggregation_phrases = [
            "which district has the highest",
            "which district has the most",
            "what district reports the most",
            "where are",
            "highest cases?",
        ]
        aggregation_score = self._score_keywords(text, aggregation_phrases)
        if aggregation_score >= 1:
            # Ensure we have a crime type for meaningful aggregation
            if entities.get("crime_type"):
                entities["intent_class"] = "statistics"
                return ("statistics", entities)
            # If no crime type specified, still route to statistics for general aggregation
            entities["intent_class"] = "statistics"
            return ("statistics", entities)

        # case_search takes priority over location_query when crime_type is present
        if case_search_score >= 1 and entities.get("crime_type"):
            entities["intent_class"] = "case_search"
            return ("case_search", entities)

        # When both crime_type and location are present, case_search takes priority
        if entities.get("crime_type") and entities.get("locations") and case_search_score >= 0:
            entities["intent_class"] = "case_search"
            return ("case_search", entities)

        if location_score >= 1:
            entities["intent_class"] = "location_query"
            return ("location_query", entities)

        if summarize_score >= 1:
            entities["intent_class"] = "summarization"
            return ("summarization", entities)

        # Default to case_search
        entities["intent_class"] = "case_search"
        return ("case_search", entities)
    
    async def _extract_entities(self, text: str) -> Dict:
        """Extract entities from text with improved extraction using entity resolution service."""
        # Ensure entity resolution service is initialized
        if not entity_resolution_service._initialized:
            await entity_resolution_service.initialize()
        
        entities: Dict = {}
        text_lower = text.lower()

        # Extract case ID
        for pattern in self.CASE_DETAIL_PATTERNS:
            match = pattern.search(text)
            if match:
                entities["case_id"] = match.group(1)
                break

        # Extract persons
        person_matches = self.PERSON_EXTRACTION.findall(text)
        if person_matches:
            entities["persons"] = person_matches

        # Extract locations using entity resolution service
        location_matches = self.LOCATION_EXTRACTION.findall(text)
        known_matches = []
        for loc in self.KNOWN_LOCATIONS:
            if loc.lower() in text_lower:
                known_matches.append(loc)

        if known_matches:
            # Use entity resolution for each match
            resolved_locations = []
            for loc in known_matches:
                resolved = entity_resolution_service.resolve_location(loc)
                if resolved and resolved.confidence >= 0.70:
                    print(f"DEBUG: location resolved: '{loc}' -> '{resolved.canonical}' (confidence: {resolved.confidence:.2f}, method: {resolved.method})")
                if resolved and resolved.confidence >= 0.80:  # Only use high confidence matches
                    resolved_locations.append(resolved.canonical)
            if resolved_locations:
                entities['locations'] = resolved_locations
            else:
                entities['locations'] = None
        else:
            # No known locations matched - try extraction with entity resolution
            location_matches = self.LOCATION_EXTRACTION.findall(text)
            crime_types_lower = {ct.lower() for ct in self.CRIME_TYPES}
            crime_compounds = crime_types_lower | {f"{ct} cases" for ct in crime_types_lower} | {f"{ct} case" for ct in crime_types_lower}
            filtered = []
            for loc in location_matches:
                # Strip trailing punctuation and common words, but not individual characters
                loc_clean = loc.strip().rstrip(".,!?;:")
                # Remove trailing common words
                for word in [" and", " or", " but"]:
                    if loc_clean.endswith(word):
                        loc_clean = loc_clean[:-len(word)]
                if loc_clean.lower() not in crime_compounds and len(loc_clean) > 2:
                    filtered.append(loc_clean)
            
            resolved_locations = []
            for loc in filtered:
                resolved = entity_resolution_service.resolve_location(loc)
                if resolved and resolved.confidence >= 0.70:
                    print(f"DEBUG: location resolved: '{loc}' -> '{resolved.canonical}' (confidence: {resolved.confidence:.2f}, method: {resolved.method})")
                if resolved and resolved.confidence >= 0.80:
                    resolved_locations.append(resolved.canonical)
            
            if resolved_locations:
                entities["locations"] = resolved_locations
            else:
                entities["locations"] = None

        # Extract crime type using entity resolution service
        resolved_crime = entity_resolution_service.resolve_crime_type(text)
        if resolved_crime and resolved_crime.confidence >= 0.70:
            entities["crime_type"] = resolved_crime.canonical
            print(f"DEBUG: crime_type resolved: '{resolved_crime.raw}' -> '{resolved_crime.canonical}' (confidence: {resolved_crime.confidence:.2f}, method: {resolved_crime.method})")

        # Extract status using entity resolution service
        resolved_status = entity_resolution_service.resolve_status(text)
        if resolved_status and resolved_status.confidence >= 0.70:
            entities["status"] = resolved_status.canonical
            print(f"DEBUG: status resolved: '{resolved_status.raw}' -> '{resolved_status.canonical}' (confidence: {resolved_status.confidence:.2f}, method: {resolved_status.method})")

        # Extract persons
        person_matches = self.PERSON_EXTRACTION.findall(text)
        if person_matches:
            entities["persons"] = person_matches

        return entities
