import re
from typing import Optional

from utils.constants import CaseStatusEnum, RoleEnum

EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
PASSWORD_MIN_LENGTH = 8
PASSWORD_UPPERCASE = re.compile(r"[A-Z]")
PASSWORD_LOWERCASE = re.compile(r"[a-z]")
PASSWORD_DIGIT = re.compile(r"\d")
PASSWORD_SPECIAL = re.compile(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]")


def validate_email(email: Optional[str]) -> Optional[str]:
    if email is None:
        return None
    if not EMAIL_PATTERN.match(email):
        raise ValueError("Invalid email format")
    return email


def validate_password(password: str) -> str:
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(
            f"Password must be at least {PASSWORD_MIN_LENGTH} characters long"
        )
    if not PASSWORD_UPPERCASE.search(password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not PASSWORD_LOWERCASE.search(password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not PASSWORD_DIGIT.search(password):
        raise ValueError("Password must contain at least one digit")
    if not PASSWORD_SPECIAL.search(password):
        raise ValueError("Password must contain at least one special character")
    return password


def validate_role(role: str) -> str:
    valid_roles = {r.value for r in RoleEnum}
    # Normalize case - frontend sends SUPER_ADMIN, backend stores super_admin
    normalized = role.lower() if isinstance(role, str) else role
    if normalized not in valid_roles:
        raise ValueError(
            f"Invalid role '{role}'. Must be one of: {', '.join(sorted(valid_roles))}"
        )
    return normalized


def validate_case_status(status: str) -> str:
    valid_statuses = {s.value for s in CaseStatusEnum}
    if status not in valid_statuses:
        raise ValueError(
            f"Invalid case status '{status}'. Must be one of: {', '.join(sorted(valid_statuses))}"
        )
    return status


def validate_latitude(lat: Optional[float]) -> Optional[float]:
    if lat is None:
        return None
    if not -90.0 <= lat <= 90.0:
        raise ValueError("Latitude must be between -90 and 90")
    return lat


def validate_longitude(lon: Optional[float]) -> Optional[float]:
    if lon is None:
        return None
    if not -180.0 <= lon <= 180.0:
        raise ValueError("Longitude must be between -180 and 180")
    return lon
