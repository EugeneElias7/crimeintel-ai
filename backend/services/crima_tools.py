"""
CRIMA Tools Registry - validated controlled tools for CrimeIntel.
All tools query live sqlite_db (ci_* tables) and never hardcode data.
Single source of truth: sqlite_db with prefix ci_.
"""
import logging
from typing import Any, Dict, List, Optional

from adapters.sqlite_db import sqlite_db

logger = logging.getLogger(__name__)

# Valid enumerations for validation (DB-derived checks optional)
VALID_CRIME_TYPES = {"theft", "assault", "murder", "robbery", "cybercrime", "fraud", "kidnapping", "rioting", "dacoity"}
VALID_STATUS = {"open", "closed", "filed", "under_investigation", "resolved"}
VALID_PRIORITY = {"low", "medium", "high", "critical"}

# District alias normalization (same as case_service)
DISTRICT_ALIAS = {
    "bengaluru urban": "bangalore urban",
    "bengaluru rural": "bangalore rural",
    "bengaluru": "bangalore",
    "mysuru": "mysore",
    "tumakuru": "tumkur",
    "belagavi": "belgaum",
    "shivamogga": "shimoga",
    "kalaburagi": "gulbarga",
}


def _norm_district(d: str) -> str:
    if not d:
        return d
    lower = d.lower()
    return DISTRICT_ALIAS.get(lower, lower)


async def search_cases(
    crime_type: Optional[str] = None,
    location: Optional[str] = None,
    district: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """Search cases with validated filters. Queries live sqlite_db ci_Cases."""
    # Validation
    if crime_type:
        ct = crime_type.lower()
        # allow unknown types gracefully - filter will yield 0 results rather than error
        crime_type = ct
    if status:
        st = status.lower()
        if st == "resolved":
            st = "closed"
        status = st
    if district:
        district = district.strip()
    if priority:
        priority = priority.lower()
    if limit is not None:
        limit = max(1, min(limit, 100))
    if offset is not None:
        offset = max(0, offset)

    all_cases = await sqlite_db.get_all("Cases")
    if not all_cases:
        return []

    filtered: List[Dict[str, Any]] = []
    for case in all_cases:
        if crime_type and (case.get("crime_type") or "").lower() != crime_type.lower():
            continue
        if status:
            case_status = (case.get("status") or "").lower()
            if case_status == "resolved":
                case_status = "closed"
            if case_status != status.lower():
                continue
        if district:
            case_dist = (case.get("district") or "").lower()
            filt_dist = district.lower()
            filt_dist_norm = _norm_district(filt_dist)
            case_dist_norm = _norm_district(case_dist)
            # match district or location contains district term
            if case_dist_norm != filt_dist_norm and case_dist.lower() != filt_dist.lower():
                # also allow location containing district name
                case_loc = (case.get("location") or "").lower()
                if filt_dist.lower() not in case_loc and filt_dist.lower() not in case_dist.lower():
                    continue
        if location:
            loc = location.lower()
            case_loc = (case.get("location") or "").lower()
            case_dist = (case.get("district") or "").lower()
            if loc not in case_loc and loc not in case_dist:
                continue
        if priority and (case.get("priority") or "").lower() != priority.lower():
            continue
        if date_from and (case.get("date_filed") or "") < date_from:
            continue
        if date_to and (case.get("date_filed") or "") > date_to:
            continue
        filtered.append(case)

    # Pagination
    start = offset or 0
    end = start + limit
    return filtered[start:end]


async def get_case_details(case_id: str) -> Optional[Dict[str, Any]]:
    """Get full case details by FIR/case_id from live DB."""
    if not case_id or not case_id.strip():
        raise ValueError("case_id is required")
    case_id = case_id.strip()
    # Try exact ROWID first
    case = await sqlite_db.get("Cases", case_id)
    if not case:
        res = await sqlite_db.query("Cases", {"case_id": case_id})
        if res:
            case = res[0]
    if not case:
        res = await sqlite_db.query("Cases", {"fir_number": case_id})
        if res:
            case = res[0]
    if not case:
        return None

    resolved_id = case.get("case_id") or case.get("ROWID") or case_id
    # Enrich with suspects/witnesses/timeline/evidence counts (live)
    suspects = await sqlite_db.query("Suspects", {"case_id": resolved_id}) or []
    witnesses = await sqlite_db.query("Witnesses", {"case_id": resolved_id}) or []
    timeline = await sqlite_db.query("Timeline", {"case_id": resolved_id}) or []
    evidence = await sqlite_db.query("Evidence_Metadata", {"case_id": resolved_id}) or []

    enriched = dict(case)
    enriched["case_id"] = resolved_id
    enriched["suspects"] = suspects
    enriched["witnesses"] = witnesses
    enriched["timeline_events"] = timeline
    enriched["evidence"] = evidence
    enriched["evidence_count"] = len(evidence)
    enriched["suspect_count"] = len(suspects)
    enriched["witness_count"] = len(witnesses)
    return enriched


async def search_suspects(name: Optional[str] = None, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Search suspects by name substring and/or case_id from live ci_Suspects."""
    all_suspects = await sqlite_db.get_all("Suspects")
    if not all_suspects:
        return []
    filtered = []
    for s in all_suspects:
        if case_id and s.get("case_id") != case_id:
            continue
        if name:
            n_lower = name.lower()
            s_name = (s.get("name") or "").lower()
            s_alias = (s.get("alias") or "").lower()
            if n_lower not in s_name and n_lower not in s_alias:
                continue
        filtered.append(s)
    return filtered


async def get_suspect_cases(suspect_name: str) -> List[Dict[str, Any]]:
    """Get cases associated with a suspect name (live join Suspects -> Cases)."""
    if not suspect_name or not suspect_name.strip():
        raise ValueError("suspect_name is required")
    suspects = await search_suspects(name=suspect_name.strip())
    if not suspects:
        return []
    # collect unique case_ids
    case_ids = list({s.get("case_id") for s in suspects if s.get("case_id")})
    results = []
    for cid in case_ids:
        detail = await get_case_details(cid)
        if detail:
            results.append(detail)
    return results


async def search_witnesses(name: Optional[str] = None, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Search witnesses by name substring and/or case_id from live ci_Witnesses."""
    all_wits = await sqlite_db.get_all("Witnesses")
    if not all_wits:
        return []
    filtered = []
    for w in all_wits:
        if case_id and w.get("case_id") != case_id:
            continue
        if name:
            n_lower = name.lower()
            w_name = (w.get("name") or "").lower()
            if n_lower not in w_name:
                continue
        filtered.append(w)
    return filtered


async def search_evidence(case_id: Optional[str] = None, file_type: Optional[str] = None, query: Optional[str] = None) -> List[Dict[str, Any]]:
    """Search evidence by case_id, file_type substring, or query in description/file_name from live ci_Evidence_Metadata."""
    all_ev = await sqlite_db.get_all("Evidence_Metadata")
    if not all_ev:
        return []
    filtered = []
    for ev in all_ev:
        if case_id and ev.get("case_id") != case_id:
            continue
        if file_type:
            ft = file_type.lower()
            ev_ft = (ev.get("file_type") or "").lower()
            ev_fn = (ev.get("file_name") or "").lower()
            # file_type stored as extension like pdf/jpg/mp4, allow substring
            if ft not in ev_ft and ft not in ev_fn:
                continue
        if query:
            q = query.lower()
            hay = f"{ev.get('file_name','')} {ev.get('description','')} {ev.get('file_type','')}".lower()
            if q not in hay:
                continue
        filtered.append(ev)
    return filtered


async def get_case_evidence(case_id: str) -> List[Dict[str, Any]]:
    """Get all evidence for a case_id from live DB."""
    if not case_id or not case_id.strip():
        raise ValueError("case_id is required")
    return await search_evidence(case_id=case_id.strip())


async def get_related_cases(case_id: str) -> List[Dict[str, Any]]:
    """Get related cases by same district/crime_type/shared suspect from live DB."""
    if not case_id or not case_id.strip():
        raise ValueError("case_id is required")
    case_id = case_id.strip()
    base = await get_case_details(case_id)
    if not base:
        raise ValueError("Case not found")
    all_cases = await sqlite_db.get_all("Cases") or []
    all_suspects = await sqlite_db.get_all("Suspects") or []
    base_suspect_names = { (s.get("name") or "").lower() for s in (base.get("suspects") or []) if s.get("name")}
    base_district = base.get("district") or ""
    base_crime = base.get("crime_type") or ""
    results = []
    for other in all_cases:
        other_id = other.get("case_id") or other.get("ROWID")
        if other_id == (base.get("case_id") or base.get("ROWID")):
            continue
        if other_id == case_id:
            continue
        score = 0
        reasons = []
        if other.get("district") == base_district and base_district:
            score += 0.3
            reasons.append("same_district")
        if (other.get("crime_type") or "").lower() == (base_crime or "").lower() and base_crime:
            score += 0.3
            reasons.append("same_crime_type")
        # shared suspect check
        for s in all_suspects:
            if s.get("case_id") == other_id:
                name = (s.get("name") or "").lower()
                if name in base_suspect_names and name:
                    score += 0.4
                    reasons.append("shared_suspect")
                    break
        if score > 0:
            rec = dict(other)
            rec["case_id"] = other_id
            rec["similarity_score"] = round(min(score, 1.0), 2)
            rec["reasons"] = reasons
            results.append(rec)
    results.sort(key=lambda r: r["similarity_score"], reverse=True)
    return results


async def get_case_timeline(case_id: str) -> List[Dict[str, Any]]:
    """Get timeline events for a case_id from live ci_Timeline."""
    if not case_id or not case_id.strip():
        raise ValueError("case_id is required")
    case_id = case_id.strip()
    rows = await sqlite_db.query("Timeline", {"case_id": case_id}) or []
    # Also try resolved case_id via get_case_details fallback if empty
    if not rows:
        detail = await get_case_details(case_id)
        if detail:
            return detail.get("timeline_events", []) or rows
    # enrich officer display name if available
    enriched = []
    for t in rows:
        rec = dict(t)
        oid = t.get("officer_id")
        if oid:
            try:
                u = await sqlite_db.get("Users", oid)
                if u:
                    rec["officer"] = {"user_id": oid, "display_name": u.get("display_name", "Unknown")}
            except Exception:
                pass
        enriched.append(rec)
    # sort by event_date
    enriched.sort(key=lambda x: x.get("event_date", "") or "")
    return enriched


# Tool registry for dispatcher
TOOL_REGISTRY = {
    "search_cases": search_cases,
    "get_case_details": get_case_details,
    "search_suspects": search_suspects,
    "get_suspect_cases": get_suspect_cases,
    "search_witnesses": search_witnesses,
    "search_evidence": search_evidence,
    "get_case_evidence": get_case_evidence,
    "get_related_cases": get_related_cases,
    "get_case_timeline": get_case_timeline,
}

# Intent -> tools mapping for Level1 dispatcher
INTENT_TOOL_MAP = {
    "case_search": ["search_cases"],
    "location_query": ["search_cases"],
    "cross_reference": ["search_cases"],
    "case_detail": ["get_case_details"],
    "summarization": ["get_case_details"],
    "suspect_search": ["search_suspects", "get_suspect_cases"],
    "witness_search": ["search_witnesses"],
    "evidence_search": ["search_evidence", "get_case_evidence"],
    "timeline_search": ["get_case_timeline", "get_case_details"],
    "similar_case_search": ["get_related_cases"],
    "statistics": ["search_cases"],
}
