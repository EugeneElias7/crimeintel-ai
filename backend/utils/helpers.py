import uuid
from datetime import date, datetime
from typing import Optional

from config import settings


def generate_uuid() -> str:
    return uuid.uuid4().hex


def generate_case_id() -> str:
    from datetime import datetime

    year = datetime.utcnow().strftime("%Y")
    seq = str(uuid.uuid4().int)[-6:].zfill(6)
    return f"FIR-{year}-{seq}"


def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.isoformat()


def parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return date.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None


def validate_file_extension(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return f".{ext}" in settings.ALLOWED_EXTENSIONS


def validate_file_size(size_bytes: int) -> bool:
    return size_bytes <= settings.MAX_UPLOAD_SIZE_BYTES


def truncate_text(text: str, max_length: int) -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
