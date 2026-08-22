import logging
from datetime import datetime
from typing import List

from fastapi import UploadFile

from adapters.catalyst_db import CatalystDBAdapter
from adapters.catalyst_fs import CatalystFSAdapter
from config import settings
from utils.constants import AUDIT_EVIDENCE_DELETED, AUDIT_EVIDENCE_UPLOADED
from utils.helpers import generate_uuid, validate_file_extension, validate_file_size

logger = logging.getLogger(__name__)


class EvidenceService:
    def __init__(self, db: CatalystDBAdapter, fs: CatalystFSAdapter) -> None:
        self.db = db
        self.fs = fs

    async def list_evidence(self, case_id: str) -> List[dict]:
        records = await self.db.query("Evidence_Metadata", {"case_id": case_id})
        results = []
        for r in (records or []):
            uploaded_by_id = r.get("uploaded_by", "")
            uploaded_by_user = await self.db.get("Users", uploaded_by_id) if uploaded_by_id else None
            uploaded_by = {
                "user_id": uploaded_by_id,
                "display_name": uploaded_by_user.get("display_name", "Unknown") if uploaded_by_user else "Unknown",
            }
            results.append({
                "evidence_id": r.get("evidence_id") or r.get("ROWID"),
                "case_id": r.get("case_id"),
                "file_name": r.get("file_name"),
                "file_type": r.get("file_type"),
                "file_size": r.get("file_size"),
                "file_url": r.get("file_url"),
                "description": r.get("description"),
                "sensitive": r.get("sensitive", False),
                "uploaded_by": uploaded_by,
                "uploaded_at": r.get("uploaded_at", ""),
            })
        return results

    async def get_evidence(self, evidence_id: str) -> dict:
        record = await self.db.get("Evidence_Metadata", evidence_id)
        if not record:
            raise ValueError("Evidence not found")

        uploaded_by_id = record.get("uploaded_by", "")
        uploaded_by_user = await self.db.get("Users", uploaded_by_id) if uploaded_by_id else None
        uploaded_by = {
            "user_id": uploaded_by_id,
            "display_name": uploaded_by_user.get("display_name", "Unknown") if uploaded_by_user else "Unknown",
        }

        return {
            "evidence_id": record.get("evidence_id") or evidence_id,
            "case_id": record.get("case_id"),
            "file_name": record.get("file_name"),
            "file_type": record.get("file_type"),
            "file_size": record.get("file_size"),
            "file_url": record.get("file_url"),
            "description": record.get("description"),
            "sensitive": record.get("sensitive", False),
            "uploaded_by": uploaded_by,
            "uploaded_at": record.get("uploaded_at", ""),
        }

    ALLOWED_MIME_TYPES = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
    }

    async def upload_evidence(
        self,
        file: UploadFile,
        case_id: str,
        description: str = "",
        sensitive: bool = False,
        user_id: str = "",
    ) -> dict:
        if not validate_file_extension(file.filename or ""):
            raise ValueError(
                f"Invalid file type. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
            )

        if file.content_type and file.content_type not in self.ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Invalid MIME type: {file.content_type}. Allowed: PDF, JPEG, PNG, MP4"
            )

        file_content = await file.read()
        if not validate_file_size(len(file_content)):
            raise ValueError(
                f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        await file.seek(0)
        file_url = await self.fs.upload_file(file, folder="evidence")

        import mimetypes
        mime_type, _ = mimetypes.guess_type(file.filename or "")
        file_type = (mime_type or "application/octet-stream").split("/")[-1]

        evidence_id = generate_uuid()
        now = datetime.utcnow().isoformat()

        await self.db.insert("Evidence_Metadata", {
            "ROWID": evidence_id,
            "evidence_id": evidence_id,
            "case_id": case_id,
            "file_name": file.filename,
            "file_type": file_type,
            "file_size": len(file_content),
            "file_url": file_url,
            "description": description,
            "sensitive": sensitive,
            "uploaded_by": user_id,
            "uploaded_at": now,
        })

        await self.db.insert("Timeline", {
            "ROWID": generate_uuid(),
            "case_id": case_id,
            "event_date": now,
            "event_type": "evidence_collected",
            "description": f"Evidence '{file.filename}' collected ({'sensitive' if sensitive else 'standard'})",
            "officer_id": user_id,
            "created_at": now,
        })

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": AUDIT_EVIDENCE_UPLOADED,
            "module": "evidence",
            "details": f"Uploaded evidence '{file.filename}' to case {case_id}",
        })

        return {
            "evidence_id": evidence_id,
            "file_name": file.filename,
            "file_type": file_type,
            "file_size": len(file_content),
            "uploaded_at": now,
        }

    async def delete_evidence(self, evidence_id: str, user_id: str = "") -> None:
        record = await self.db.get("Evidence_Metadata", evidence_id)
        if not record:
            raise ValueError("Evidence not found")

        file_url = record.get("file_url", "")
        if file_url:
            try:
                await self.fs.delete_file(file_url)
            except Exception as e:
                logger.warning("Failed to delete file from store: %s", e)

        await self.db.delete("Evidence_Metadata", evidence_id)

        await self.db.insert("Audit_Logs", {
            "user_id": user_id,
            "action": AUDIT_EVIDENCE_DELETED,
            "module": "evidence",
            "details": f"Deleted evidence {evidence_id} ('{record.get('file_name', '')}') from case {record.get('case_id', '')}",
        })
