import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from adapters.catalyst_db import CatalystDBAdapter
from models.case import CaseCreate, CaseUpdate
from utils.constants import (
    AUDIT_CASE_CREATED,
    AUDIT_CASE_DELETED,
    AUDIT_CASE_STATUS_CHANGED,
    AUDIT_CASE_UPDATED,
)
from utils.helpers import generate_case_id, generate_uuid

logger = logging.getLogger(__name__)


class CaseService:
    def __init__(self, db: CatalystDBAdapter) -> None:
        self.db = db

    async def list_cases(
        self,
        page: int = 1,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
    ) -> dict:
        all_cases = await self.db.get_all("Cases")
        if not all_cases:
            return {"data": [], "total": 0, "page": page, "pages": 0}

        filters = filters or {}
        filtered = []
        for case in all_cases:
            crime_type = filters.get("crime_type")
            if crime_type and case.get("crime_type") != crime_type:
                continue

            status = filters.get("status")
            if status and case.get("status") != status:
                continue

            district = filters.get("district")
            if district and case.get("district") != district:
                continue

            date_from = filters.get("date_from")
            if date_from and case.get("date_filed", "") < date_from:
                continue

            date_to = filters.get("date_to")
            if date_to and case.get("date_filed", "") > date_to:
                continue

            officer_id = filters.get("officer_id")
            if officer_id and case.get("officer_id") != officer_id:
                continue

            filtered.append(case)

        sort_by = filters.get("sort_by", "created_at")
        sort_order = filters.get("sort_order", "desc")
        reverse = sort_order == "desc"
        filtered.sort(key=lambda c: c.get(sort_by, ""), reverse=reverse)

        case_ids = [c.get("ROWID") or c.get("case_id") for c in filtered]

        all_officers = await self.db.get_all("Users")
        officer_map = {}
        for o in all_officers or []:
            oid = o.get("ROWID") or o.get("user_id")
            officer_map[oid] = o.get("display_name", "Unknown")

        all_evidence = await self.db.get_all("Evidence_Metadata")
        evidence_count_map: Dict[str, int] = {}
        for ev in all_evidence or []:
            cid = ev.get("case_id", "")
            evidence_count_map[cid] = evidence_count_map.get(cid, 0) + 1

        all_suspects = await self.db.get_all("Suspects")
        suspect_count_map: Dict[str, int] = {}
        for s in all_suspects or []:
            cid = s.get("case_id", "")
            suspect_count_map[cid] = suspect_count_map.get(cid, 0) + 1

        enriched = []
        for case in filtered:
            cid = case.get("ROWID") or case.get("case_id")
            officer_id = case.get("officer_id", "")
            enriched.append({
                "case_id": cid,
                "fir_number": case.get("fir_number"),
                "crime_type": case.get("crime_type"),
                "status": case.get("status"),
                "date_filed": case.get("date_filed"),
                "location": case.get("location"),
                "district": case.get("district"),
                "officer": {
                    "user_id": officer_id,
                    "display_name": officer_map.get(officer_id, "Unknown"),
                },
                "priority": case.get("priority"),
                "evidence_count": evidence_count_map.get(cid, 0),
                "suspect_count": suspect_count_map.get(cid, 0),
                "created_at": case.get("created_at", ""),
                "updated_at": case.get("updated_at", ""),
            })

        total = len(enriched)
        pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        end = start + limit
        page_items = enriched[start:end]

        return {"data": page_items, "total": total, "page": page, "pages": pages}

    async def search_cases(
        self, query: str, page: int = 1, limit: int = 20
    ) -> dict:
        all_cases = await self.db.get_all("Cases")
        if not all_cases:
            return {"data": [], "total": 0, "page": page, "pages": 0}

        q = query.lower()
        matched = []
        for case in all_cases:
            if (
                q in (case.get("case_id") or "").lower()
                or q in (case.get("fir_number") or "").lower()
                or q in (case.get("location") or "").lower()
                or q in (case.get("description") or "").lower()
            ):
                matched.append(case)

        total = len(matched)
        pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        end = start + limit
        page_items = matched[start:end]

        return {"data": page_items, "total": total, "page": page, "pages": pages}

    async def get_case(self, case_id: str) -> Optional[dict]:
        case = await self.db.get("Cases", case_id)
        if not case:
            return None

        suspects = await self.db.query("Suspects", {"case_id": case_id})
        witnesses = await self.db.query("Witnesses", {"case_id": case_id})
        timeline = await self.db.query("Timeline", {"case_id": case_id})

        officer_id = case.get("officer_id", "")
        officer = await self.db.get("Users", officer_id)
        officer_name = officer.get("display_name", "Unknown") if officer else "Unknown"

        suspects_data = []
        for s in suspects or []:
            suspects_data.append({
                "suspect_id": s.get("suspect_id") or s.get("ROWID"),
                "case_id": case_id,
                "name": s.get("name"),
                "alias": s.get("alias"),
                "photo_url": s.get("photo_url"),
                "age": s.get("age"),
                "gender": s.get("gender"),
                "address": s.get("address"),
                "identification_marks": s.get("identification_marks"),
                "known_associates": s.get("known_associates"),
                "criminal_history": s.get("criminal_history"),
                "status": s.get("status"),
                "created_at": s.get("created_at", ""),
                "updated_at": s.get("updated_at", ""),
            })

        witnesses_data = []
        for w in witnesses or []:
            witnesses_data.append({
                "witness_id": w.get("witness_id") or w.get("ROWID"),
                "case_id": case_id,
                "name": w.get("name"),
                "contact": w.get("contact"),
                "statement_summary": w.get("statement_summary"),
                "credibility_score": w.get("credibility_score"),
                "status": w.get("status"),
                "created_at": w.get("created_at", ""),
                "updated_at": w.get("updated_at", ""),
            })

        timeline_data = []
        for t in timeline or []:
            evt_officer_id = t.get("officer_id")
            evt_officer = None
            if evt_officer_id:
                evt_officer_data = await self.db.get("Users", evt_officer_id)
                if evt_officer_data:
                    evt_officer = {
                        "user_id": evt_officer_id,
                        "display_name": evt_officer_data.get("display_name", "Unknown"),
                    }
            timeline_data.append({
                "event_id": t.get("event_id") or t.get("ROWID"),
                "case_id": case_id,
                "event_date": t.get("event_date"),
                "event_type": t.get("event_type"),
                "description": t.get("description"),
                "officer": evt_officer,
                "created_at": t.get("created_at", ""),
            })

        evidence_list = await self.db.query("Evidence_Metadata", {"case_id": case_id})
        evidence_count = len(evidence_list or [])
        suspect_count = len(suspects_data)
        witness_count = len(witnesses_data)

        return {
            "case_id": case_id,
            "fir_number": case.get("fir_number"),
            "crime_type": case.get("crime_type"),
            "status": case.get("status"),
            "date_filed": case.get("date_filed"),
            "location": case.get("location"),
            "latitude": case.get("latitude"),
            "longitude": case.get("longitude"),
            "district": case.get("district"),
            "description": case.get("description"),
            "officer": {
                "user_id": officer_id,
                "display_name": officer_name,
            },
            "priority": case.get("priority"),
            "evidence_count": evidence_count,
            "suspect_count": suspect_count,
            "witness_count": witness_count,
            "suspects": suspects_data,
            "witnesses": witnesses_data,
            "timeline_events": timeline_data,
            "created_at": case.get("created_at", ""),
            "updated_at": case.get("updated_at", ""),
        }

    async def create_case(
        self, data: CaseCreate, user_id: Optional[str] = None
    ) -> dict:
        existing = await self.db.query("Cases", {"fir_number": data.fir_number})
        if existing:
            raise ValueError(f"Case with FIR number {data.fir_number} already exists")

        case_id = generate_case_id()
        now = datetime.utcnow().isoformat()

        row_data = {
            "ROWID": case_id,
            "case_id": case_id,
            "fir_number": data.fir_number,
            "crime_type": data.crime_type,
            "date_filed": data.date_filed,
            "location": data.location,
            "latitude": data.latitude,
            "longitude": data.longitude,
            "district": data.district,
            "description": data.description,
            "officer_id": data.officer_id,
            "priority": data.priority,
            "status": data.status or "open",
            "created_at": now,
            "updated_at": now,
        }

        await self.db.insert("Cases", row_data)

        await self.db.insert("Timeline", {
            "ROWID": generate_uuid(),
            "case_id": case_id,
            "event_date": now,
            "event_type": "fir_registered",
            "description": f"FIR registered for {data.crime_type} at {data.location}",
            "officer_id": data.officer_id,
            "created_at": now,
        })

        await self.db.insert("Audit_Logs", {
            "user_id": user_id or data.officer_id,
            "action": AUDIT_CASE_CREATED,
            "module": "cases",
            "details": f"Created case {case_id} for FIR {data.fir_number}",
            "created_at": datetime.utcnow().isoformat(),
        })

        return {**row_data, "ROWID": case_id}

    async def update_case(
        self, case_id: str, data: CaseUpdate, user_id: Optional[str] = None
    ) -> dict:
        existing = await self.db.get("Cases", case_id)
        if not existing:
            raise ValueError("Case not found")

        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return existing

        old_status = existing.get("status")
        new_status = update_data.get("status")

        update_data["updated_at"] = datetime.utcnow().isoformat()
        await self.db.update("Cases", case_id, update_data)

        if new_status and new_status != old_status:
            await self.db.insert("Timeline", {
                "ROWID": generate_uuid(),
                "case_id": case_id,
                "event_date": datetime.utcnow().isoformat(),
                "event_type": "status_change",
                "description": f"Status changed from {old_status} to {new_status}",
                "officer_id": user_id,
                "created_at": datetime.utcnow().isoformat(),
            })

            await self.db.insert("Audit_Logs", {
                "user_id": user_id or "",
                "action": AUDIT_CASE_STATUS_CHANGED,
                "module": "cases",
                "details": f"Case {case_id} status changed from {old_status} to {new_status}",
                "created_at": datetime.utcnow().isoformat(),
            })
        else:
            await self.db.insert("Audit_Logs", {
                "user_id": user_id or "",
                "action": AUDIT_CASE_UPDATED,
                "module": "cases",
                "details": f"Updated case {case_id} fields {list(update_data.keys())}",
                "created_at": datetime.utcnow().isoformat(),
            })

        updated = await self.db.get("Cases", case_id)
        return updated or existing

    async def delete_case(self, case_id: str, user_id: Optional[str] = None) -> None:
        existing = await self.db.get("Cases", case_id)
        if not existing:
            raise ValueError("Case not found")

        await self.db.update("Cases", case_id, {
            "status": "filed",
            "updated_at": datetime.utcnow().isoformat(),
        })

        await self.db.insert("Audit_Logs", {
            "user_id": user_id or "",
            "action": AUDIT_CASE_DELETED,
            "module": "cases",
            "details": f"Soft-deleted case {case_id} (status set to filed)",
            "created_at": datetime.utcnow().isoformat(),
        })

    async def get_related_cases(self, case_id: str) -> List[dict]:
        case = await self.db.get("Cases", case_id)
        if not case:
            raise ValueError("Case not found")

        all_cases = await self.db.get_all("Cases")
        if not all_cases:
            return []

        all_suspects = await self.db.get_all("Suspects")

        case_suspect_names = set()
        for s in all_suspects or []:
            if s.get("case_id") == case_id:
                case_suspect_names.add((s.get("name", "") or "").lower())

        district = case.get("district", "")
        crime_type = case.get("crime_type", "")

        results = []
        for other in all_cases:
            other_id = other.get("ROWID") or other.get("case_id")
            if other_id == case_id:
                continue

            score = 0
            reasons = []

            if other.get("district") == district:
                score += 0.3
                reasons.append("same_district")

            if other.get("crime_type") == crime_type:
                score += 0.3
                reasons.append("same_crime_type")

            for s in all_suspects or []:
                if s.get("case_id") == other_id:
                    name = (s.get("name", "") or "").lower()
                    if name in case_suspect_names and name:
                        score += 0.4
                        reasons.append("shared_suspect")
                        break

            if score > 0:
                results.append({
                    "case_id": other_id,
                    "fir_number": other.get("fir_number"),
                    "crime_type": other.get("crime_type"),
                    "status": other.get("status"),
                    "district": other.get("district"),
                    "date_filed": other.get("date_filed"),
                    "similarity_score": round(min(score, 1.0), 2),
                    "reasons": reasons,
                })

        results.sort(key=lambda r: r["similarity_score"], reverse=True)
        return results
