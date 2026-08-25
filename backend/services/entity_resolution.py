"""Entity Resolution Service for CRIMA AI.

Provides fuzzy/phonetic matching with confidence thresholds for location,
crime type, status, and other entity normalization.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass
from rapidfuzz import fuzz, process
from adapters.sqlite_db import sqlite_db

logger = logging.getLogger(__name__)


@dataclass
class ResolvedEntity:
    """Result of entity resolution."""
    raw: str
    canonical: str
    entity_type: str
    confidence: float
    method: str  # exact, alias, fuzzy, phonetic


class EntityResolutionService:
    """Service for resolving entities with fuzzy/phonetic matching."""
    
    # Confidence thresholds
    EXACT_THRESHOLD = 1.0
    HIGH_CONFIDENCE = 0.90
    MEDIUM_CONFIDENCE = 0.80
    LOW_CONFIDENCE = 0.70
    
    def __init__(self) -> None:
        self._initialized = False
        self._canonical_locations: List[str] = []
        self._canonical_crime_types: List[str] = []
        self._canonical_statuses: List[str] = []
        self._canonical_districts: List[str] = []
        self._location_aliases: Dict[str, str] = {}
        self._crime_type_aliases: Dict[str, str] = {}
        
    async def initialize(self) -> bool:
        """Initialize by loading canonical entities from database."""
        if self._initialized:
            return True
            
        try:
            # Load canonical locations from database
            cases = await sqlite_db.get_all("Cases")
            locations: Set[str] = set()
            districts: Set[str] = set()
            
            for case in cases or []:
                loc = case.get("location")
                if loc:
                    locations.add(loc.strip())
                dist = case.get("district")
                if dist:
                    districts.add(dist.strip())
                    
            self._canonical_locations = sorted(locations)
            self._canonical_districts = sorted(districts)
            
            # Crime types and statuses are from intent service
            self._canonical_crime_types = [
                "theft", "assault", "murder", "robbery", "cybercrime", "fraud",
                "kidnapping", "rioting", "dacoity"
            ]
            self._canonical_statuses = [
                "open", "closed", "filed", "under_investigation"
            ]
            
            # Build alias maps
            self._build_alias_maps()
            
            self._initialized = True
            logger.info("EntityResolutionService initialized with %d locations, %d districts, %d crime types",
                       len(self._canonical_locations), len(self._canonical_districts), len(self._canonical_crime_types))
            return True
            
        except Exception as e:
            logger.error("EntityResolutionService initialization failed: %s", e)
            return False
    
    def _build_alias_maps(self) -> None:
        """Build alias maps from canonical entities."""
        # Location aliases (lowercase -> canonical)
        self._location_aliases = {}
        for loc in self._canonical_locations:
            self._location_aliases[loc.lower()] = loc
            
        # Add common misspellings/aliases manually
        common_aliases = {
            "hebal": "Hebbal",
            "habala": "Hebbal",
            "hebbal": "Hebbal",
            "jalahalli": "Jalahalli",
            "jalhalli": "Jalahalli",
            "jalahalley": "Jalahalli",
            "jalhalli": "Jalahalli",
            "kurumangala": "Koramangala",
            "kurmnagala": "Koramangala",
            "koramangla": "Koramangala",
            "vijayanagar": "Vijayanagar",
            "vijaynagar": "Vijayanagar",
            "vijanagar": "Vijayanagar",
            "bengaluru": "Bangalore",
            "bangalore": "Bangalore",
            "bangalore urban": "Bangalore Urban",
            "hubali": "Hubli",
            "hubali": "Hubli",
            "hubballi": "Hubli",
            "hubly": "Hubli",
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
        
        for alias, canonical in common_aliases.items():
            self._location_aliases[alias.lower()] = canonical
            
        # Crime type aliases
        self._crime_type_aliases = {
            "thft": "theft",
            "teft": "theft",
            "theif": "theft",
            "stealing": "theft",
            "murdar": "murder",
            "mudrer": "murder",
            "killing": "murder",
            "robbery": "robbery",
            "robry": "robbery",
            "assult": "assault",
            "asault": "assault",
            "cyber crime": "cybercrime",
            "cyber-crime": "cybercrime",
            "fraud": "fraud",
            "scam": "fraud",
            "kidnap": "kidnapping",
            "kidnapp": "kidnapping",
            "riot": "rioting",
            "riots": "rioting",
        }
    
    def resolve_location(self, raw_location: str) -> Optional[ResolvedEntity]:
        """Resolve a raw location string to canonical form."""
        if not raw_location:
            return None
            
        raw = raw_location.strip()
        raw_lower = raw.lower()
        
        # 1. Exact canonical match (case-insensitive)
        for canonical in self._canonical_locations:
            if canonical.lower() == raw_lower:
                return ResolvedEntity(
                    raw=raw,
                    canonical=canonical,
                    entity_type="location",
                    confidence=self.EXACT_THRESHOLD,
                    method="exact"
                )
        
        # 2. Alias match
        if raw_lower in self._location_aliases:
            canonical = self._location_aliases[raw_lower]
            return ResolvedEntity(
                raw=raw,
                canonical=canonical,
                entity_type="location",
                confidence=self.HIGH_CONFIDENCE,
                method="alias"
            )
        
        # 3. Fuzzy match against canonical locations
        best_match, score = self._fuzzy_match(raw_lower, [l.lower() for l in self._canonical_locations])
        if best_match and score >= 90:  # 90% = HIGH_CONFIDENCE
            canonical = self._canonical_locations[[l.lower() for l in self._canonical_locations].index(best_match)]
            return ResolvedEntity(
                raw=raw,
                canonical=canonical,
                entity_type="location",
                confidence=score / 100.0,
                method="fuzzy"
            )
        
        # 4. Medium confidence fuzzy match (80-89)
        if best_match and score >= 80:
            canonical = self._canonical_locations[[l.lower() for l in self._canonical_locations].index(best_match)]
            return ResolvedEntity(
                raw=raw,
                canonical=canonical,
                entity_type="location",
                confidence=score / 100.0,
                method="fuzzy"
            )
        
        # 5. Phonetic matching (using rapidfuzz with different scorer)
        phonetic_match, phonetic_score = self._phonetic_match(raw_lower, [l.lower() for l in self._canonical_locations])
        if phonetic_match and phonetic_score >= 80:  # Lowered threshold for better phonetic matching
            canonical = self._canonical_locations[[l.lower() for l in self._canonical_locations].index(phonetic_match)]
            return ResolvedEntity(
                raw=raw,
                canonical=canonical,
                entity_type="location",
                confidence=phonetic_score / 100.0,
                method="phonetic"
            )
        
        return None
    
    def _fuzzy_match(self, query: str, choices: List[str]) -> Tuple[Optional[str], int]:
        """Find best fuzzy match using ratio scorer."""
        if not choices:
            return None, 0
        result = process.extractOne(query, choices, scorer=fuzz.ratio)
        if result:
            return result[0], result[1]
        return None, 0
    
    def _phonetic_match(self, query: str, choices: List[str]) -> Tuple[Optional[str], int]:
        """Find best phonetic match using partial ratio."""
        if not choices:
            return None, 0
        # Use token set ratio for better phonetic matching
        result = process.extractOne(query, choices, scorer=fuzz.token_set_ratio)
        if result:
            return result[0], result[1]
        return None, 0
    
    def resolve_crime_type(self, text: str) -> Optional[ResolvedEntity]:
        """Resolve a raw crime type string to canonical form.
        
        Can accept either a raw crime type word or a full text query.
        """
        if not text:
            return None
            
        raw = text.strip()
        raw_lower = text.lower()
        
        # 1. Check for exact crime type in text (word boundary)
        for canonical in self._canonical_crime_types:
            if re.search(r'\b' + re.escape(canonical) + r'\b', raw_lower):
                return ResolvedEntity(
                    raw=canonical,
                    canonical=canonical,
                    entity_type="crime_type",
                    confidence=self.EXACT_THRESHOLD,
                    method="exact"
                )
        
        # 2. Check for aliases in text
        for alias, canonical in self._crime_type_aliases.items():
            if re.search(r'\b' + re.escape(alias) + r'\b', raw_lower):
                return ResolvedEntity(
                    raw=alias,
                    canonical=canonical,
                    entity_type="crime_type",
                    confidence=self.HIGH_CONFIDENCE,
                    method="alias"
                )
        
        # 3. Fuzzy match on individual words
        words = raw_lower.split()
        best_crime = None
        best_score = 0
        for word in words:
            word_clean = word.strip().rstrip(".,!?;:")
            for ct in self._canonical_crime_types:
                score = fuzz.ratio(ct, word_clean)
                if score > best_score and score >= 80:
                    best_score = score
                    best_crime = ct
        
        if best_crime:
            return ResolvedEntity(
                raw=best_crime,
                canonical=best_crime,
                entity_type="crime_type",
                confidence=best_score / 100.0,
                method="fuzzy"
            )
        
        return None
    
    def resolve_status(self, raw_status: str) -> Optional[ResolvedEntity]:
        """Resolve a raw status string to canonical form."""
        if not raw_status:
            return None
            
        raw = raw_status.strip()
        raw_lower = raw.lower()
        
        for canonical in self._canonical_statuses:
            if canonical.lower() == raw_lower:
                return ResolvedEntity(
                    raw=raw,
                    canonical=canonical,
                    entity_type="status",
                    confidence=self.EXACT_THRESHOLD,
                    method="exact"
                )
        
        # Fuzzy match for status
        best_match, score = self._fuzzy_match(raw_lower, [s.lower() for s in self._canonical_statuses])
        if best_match and score >= 80:
            canonical = self._canonical_statuses[[s.lower() for s in self._canonical_statuses].index(best_match)]
            return ResolvedEntity(
                raw=raw,
                canonical=canonical,
                entity_type="status",
                confidence=score / 100.0,
                method="fuzzy"
            )
        
        return None
    
    def resolve_district(self, raw_district: str) -> Optional[ResolvedEntity]:
        """Resolve a raw district string to canonical form."""
        if not raw_district:
            return None
            
        raw = raw_district.strip()
        raw_lower = raw.lower()
        
        for canonical in self._canonical_districts:
            if canonical.lower() == raw_lower:
                return ResolvedEntity(
                    raw=raw,
                    canonical=canonical,
                    entity_type="district",
                    confidence=self.EXACT_THRESHOLD,
                    method="exact"
                )
        
        # Fuzzy match
        best_match, score = self._fuzzy_match(raw_lower, [d.lower() for d in self._canonical_districts])
        if best_match and score >= 85:
            canonical = self._canonical_districts[[d.lower() for d in self._canonical_districts].index(best_match)]
            return ResolvedEntity(
                raw=raw,
                canonical=canonical,
                entity_type="district",
                confidence=score / 100.0,
                method="fuzzy"
            )
        
        return None


# Singleton instance
entity_resolution_service = EntityResolutionService()