import logging
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Optional

from adapters.catalyst_db import CatalystDBAdapter

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self, db: CatalystDBAdapter) -> None:
        self.db = db

    async def get_overview(
        self, from_date: Optional[str] = None, to_date: Optional[str] = None
    ) -> dict:
        all_cases = await self.db.get_all("Cases")
        if not all_cases:
            return {
                "total_cases": 0,
                "open_cases": 0,
                "closed_cases": 0,
                "filed_cases": 0,
                "clearance_rate": 0.0,
                "avg_resolution_days": 0.0,
                "period": {"from_date": from_date or "", "to_date": to_date or ""},
            }

        filtered = self._filter_by_date(all_cases, from_date, to_date)

        total = len(filtered)
        status_counts = Counter(c.get("status", "unknown") for c in filtered)
        open_cases = status_counts.get("open", 0) + status_counts.get("under_investigation", 0)
        closed_cases = status_counts.get("closed", 0)
        filed_cases = status_counts.get("filed", 0)

        clearance_rate = 0.0
        if total > 0:
            clearance_rate = round((closed_cases / total) * 100, 2)

        resolution_days = []
        for case in filtered:
            if case.get("status") == "closed":
                created = case.get("created_at")
                updated = case.get("updated_at")
                if created and updated:
                    try:
                        created_dt = datetime.fromisoformat(created)
                        updated_dt = datetime.fromisoformat(updated)
                        delta = (updated_dt - created_dt).days
                        if delta >= 0:
                            resolution_days.append(delta)
                    except (ValueError, TypeError):
                        continue

        avg_resolution = 0.0
        if resolution_days:
            avg_resolution = round(sum(resolution_days) / len(resolution_days), 2)

        return {
            "total_cases": total,
            "open_cases": open_cases,
            "closed_cases": closed_cases,
            "filed_cases": filed_cases,
            "clearance_rate": clearance_rate,
            "avg_resolution_days": avg_resolution,
            "period": {
                "from_date": from_date or "",
                "to_date": to_date or "",
            },
        }

    async def get_distribution(
        self, from_date: Optional[str] = None, to_date: Optional[str] = None
    ) -> list:
        all_cases = await self.db.get_all("Cases")
        if not all_cases:
            return []

        filtered = self._filter_by_date(all_cases, from_date, to_date)
        total = len(filtered) or 1

        crime_counts = Counter(c.get("crime_type", "other") for c in filtered)
        return [
            {
                "crime_type": crime_type,
                "count": count,
                "percentage": round((count / total) * 100, 2),
            }
            for crime_type, count in sorted(crime_counts.items(), key=lambda x: x[1], reverse=True)
        ]

    async def get_trends(
        self, from_date: Optional[str] = None, to_date: Optional[str] = None
    ) -> list:
        all_cases = await self.db.get_all("Cases")
        if not all_cases:
            return []

        filtered = self._filter_by_date(all_cases, from_date, to_date)

        monthly: dict = defaultdict(lambda: {"total": 0, "open": 0, "closed": 0})
        for case in filtered:
            date_str = case.get("date_filed") or case.get("created_at", "")
            try:
                dt = datetime.fromisoformat(date_str)
                month_key = dt.strftime("%Y-%m")
            except (ValueError, TypeError):
                continue

            monthly[month_key]["total"] += 1
            status = case.get("status", "")
            if status == "open" or status == "under_investigation":
                monthly[month_key]["open"] += 1
            elif status == "closed":
                monthly[month_key]["closed"] += 1

        return [
            {
                "month": month,
                "total": data["total"],
                "open": data["open"],
                "closed": data["closed"],
            }
            for month, data in sorted(monthly.items())
        ]

    async def get_by_district(
        self, from_date: Optional[str] = None, to_date: Optional[str] = None
    ) -> list:
        all_cases = await self.db.get_all("Cases")
        if not all_cases:
            return []

        filtered = self._filter_by_date(all_cases, from_date, to_date)
        district_counts = Counter(c.get("district", "unknown") for c in filtered)

        return [
            {"district": district, "count": count}
            for district, count in sorted(
                district_counts.items(), key=lambda x: x[1], reverse=True
            )
        ]

    async def get_clearance(
        self, from_date: Optional[str] = None, to_date: Optional[str] = None
    ) -> dict:
        overview = await self.get_overview(from_date, to_date)
        return {
            "clearance_rate": overview["clearance_rate"],
            "total_cases": overview["total_cases"],
            "closed_cases": overview["closed_cases"],
            "open_cases": overview["open_cases"],
            "period": overview["period"],
        }

    @staticmethod
    def _filter_by_date(
        cases: list,
        from_date: Optional[str],
        to_date: Optional[str],
    ) -> list:
        if not from_date and not to_date:
            return cases

        filtered = []
        for case in cases:
            date_str = case.get("date_filed") or case.get("created_at", "")
            if not date_str:
                filtered.append(case)
                continue

            try:
                dt = date_str if isinstance(date_str, str) else str(date_str)
            except (ValueError, TypeError):
                filtered.append(case)
                continue

            if from_date and dt < from_date:
                continue
            if to_date and dt > to_date:
                continue

            filtered.append(case)

        return filtered
