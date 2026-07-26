from enum import Enum


class RoleEnum(str, Enum):
    OFFICER = "officer"
    INSPECTOR = "inspector"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class CaseStatusEnum(str, Enum):
    OPEN = "open"
    UNDER_INVESTIGATION = "under_investigation"
    CLOSED = "closed"
    FILED = "filed"


class CrimeTypeEnum(str, Enum):
    THEFT = "theft"
    ASSAULT = "assault"
    MURDER = "murder"
    ROBBERY = "robbery"
    CYBERCRIME = "cybercrime"
    FRAUD = "fraud"
    KIDNAPPING = "kidnapping"
    RIOTING = "rioting"
    DACOITY = "dacoity"
    OTHER = "other"


class PriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EvidenceTypeEnum(str, Enum):
    PDF = "pdf"
    JPEG = "jpeg"
    PNG = "png"
    MP4 = "mp4"


class NotificationTypeEnum(str, Enum):
    CASE_ASSIGNED = "case_assigned"
    STATUS_CHANGE = "status_change"
    EVIDENCE_UPLOADED = "evidence_uploaded"
    SYSTEM_ANNOUNCEMENT = "system_announcement"


# Audit action constants
AUDIT_CASE_CREATED = "case.created"
AUDIT_CASE_UPDATED = "case.updated"
AUDIT_CASE_DELETED = "case.deleted"
AUDIT_CASE_STATUS_CHANGED = "case.status_changed"
AUDIT_EVIDENCE_UPLOADED = "evidence.uploaded"
AUDIT_EVIDENCE_DELETED = "evidence.deleted"
AUDIT_SUSPECT_ADDED = "suspect.added"
AUDIT_SUSPECT_UPDATED = "suspect.updated"
AUDIT_WITNESS_ADDED = "witness.added"
AUDIT_WITNESS_UPDATED = "witness.updated"
AUDIT_USER_CREATED = "user.created"
AUDIT_USER_UPDATED = "user.updated"
AUDIT_USER_DELETED = "user.deleted"
AUDIT_USER_LOGIN = "user.login"
AUDIT_USER_LOGOUT = "user.logout"

AUDIT_ACTIONS = frozenset(
    {
        AUDIT_CASE_CREATED,
        AUDIT_CASE_UPDATED,
        AUDIT_CASE_DELETED,
        AUDIT_CASE_STATUS_CHANGED,
        AUDIT_EVIDENCE_UPLOADED,
        AUDIT_EVIDENCE_DELETED,
        AUDIT_SUSPECT_ADDED,
        AUDIT_SUSPECT_UPDATED,
        AUDIT_WITNESS_ADDED,
        AUDIT_WITNESS_UPDATED,
        AUDIT_USER_CREATED,
        AUDIT_USER_UPDATED,
        AUDIT_USER_DELETED,
        AUDIT_USER_LOGIN,
        AUDIT_USER_LOGOUT,
    }
)

ERROR_CODES: dict = {
    "INVALID_CREDENTIALS": "The provided credentials are invalid.",
    "TOKEN_EXPIRED": "The authentication token has expired.",
    "TOKEN_INVALID": "The authentication token is invalid.",
    "FORBIDDEN": "You do not have permission to perform this action.",
    "NOT_FOUND": "The requested resource was not found.",
    "DUPLICATE_ENTRY": "A record with the given details already exists.",
    "VALIDATION_ERROR": "The provided data failed validation.",
    "RATE_LIMIT_EXCEEDED": "Too many requests. Please try again later.",
    "FILE_TOO_LARGE": "The uploaded file exceeds the maximum allowed size.",
    "INVALID_FILE_TYPE": "The uploaded file type is not supported.",
    "INTERNAL_ERROR": "An internal server error occurred.",
    "DEPENDENCY_FAILURE": "An external service dependency failed.",
}

HTTPStatusMessages: dict = {
    200: "Request completed successfully.",
    201: "Resource created successfully.",
    204: "Resource deleted successfully.",
    400: "Bad request. Please check the provided data.",
    401: "Authentication is required.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "Conflict with the current state of the resource.",
    422: "The provided data failed validation.",
    429: "Too many requests. Please try again later.",
    500: "An internal server error occurred.",
}
