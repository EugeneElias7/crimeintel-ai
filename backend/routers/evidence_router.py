import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from middleware.auth_middleware import get_current_user, require_role
from models.evidence import EvidenceResponse, EvidenceUploadResponse
from models.common import SuccessResponse
from services.evidence_service import EvidenceService
from adapters.db import db
from adapters.local_fs import local_fs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evidence", tags=["Evidence"])


def _resolve_evidence_file_path(file_url: str, file_name: str = "") -> str:
    raw = (file_url or "").strip()
    candidates = []

    if raw.startswith("file://"):
        candidates.append(raw[7:])
    elif raw:
        candidates.append(raw)

    if file_name:
        candidates.append(file_name)

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    normalized_name = os.path.basename(file_name or raw or "")
    if normalized_name:
        for root in [
            base_dir,
            os.path.join(base_dir, "storage"),
            os.path.join(base_dir, "storage", "cases"),
            os.path.join(base_dir, "storage", "evidence"),
        ]:
            for current_root, _, files in os.walk(root):
                if normalized_name in files:
                    candidates.append(os.path.join(current_root, normalized_name))

    if raw.startswith("/"):
        rel = raw.lstrip("/")
        rel_parts = rel.split("/") if rel else []
        candidates.extend([
            os.path.join(base_dir, rel),
            os.path.join(base_dir, "storage", rel),
            os.path.join(base_dir, "storage", "cases", rel),
        ])

        if len(rel_parts) >= 3 and rel_parts[0] == "evidence":
            case_id = rel_parts[1]
            file_name = rel_parts[2]
            candidates.extend([
                os.path.join(base_dir, "storage", "cases", case_id, "evidence", file_name),
                os.path.join(base_dir, "storage", "evidence", case_id, file_name),
            ])

        if len(rel_parts) >= 2 and rel_parts[0] != "cases":
            candidates.append(os.path.join(base_dir, "storage", "cases", rel_parts[0], "evidence", *rel_parts[1:]))

    seen = set()
    for candidate in candidates:
        if not candidate:
            continue
        normalized = candidate.replace("\\", "/")
        if normalized in seen:
            continue
        seen.add(normalized)
        if os.path.exists(candidate):
            return candidate

    return raw[7:] if raw.startswith("file://") else raw


_evidence_service = None


def get_evidence_service() -> EvidenceService:
    global _evidence_service
    if _evidence_service is None:
        _evidence_service = EvidenceService(db=db, fs=local_fs)
    return _evidence_service


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List all evidence (global gallery)",
    include_in_schema=False,
)
@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="List all evidence (global gallery)",
)
async def list_all_evidence(
    current_user: dict = Depends(get_current_user),
):
    try:
        all_items = await db.get_all("Evidence_Metadata")
        if not all_items:
            return []
        result = []
        for item in all_items:
            try:
                # Normalize uploaded_by
                ub = item.get("uploaded_by")
                if isinstance(ub, str):
                    item["uploaded_by"] = {"user_id": ub, "display_name": ub}
                elif not isinstance(ub, dict):
                    item["uploaded_by"] = {"user_id": str(ub) if ub else "unknown", "display_name": str(ub) if isinstance(ub, str) else "Unknown"}
                    if not isinstance(item["uploaded_by"], dict) or "user_id" not in item["uploaded_by"]:
                        item["uploaded_by"] = {"user_id": "unknown", "display_name": "Unknown"}
                # Normalize file_size
                try:
                    item["file_size"] = int(item.get("file_size", 0) or 0)
                except:
                    item["file_size"] = 0
                # Ensure required fields
                for fld in ["evidence_id", "case_id", "file_name", "file_type", "file_url", "uploaded_at"]:
                    if fld not in item or item[fld] is None:
                        if fld == "uploaded_at":
                            item[fld] = "2026-01-01T00:00:00"
                        elif fld == "file_size":
                            item[fld] = 0
                        else:
                            item[fld] = ""
                # Ensure uploaded_by has correct shape
                if not isinstance(item.get("uploaded_by"), dict) or "display_name" not in item["uploaded_by"]:
                    item["uploaded_by"] = {"user_id": "unknown", "display_name": "Unknown"}
                # Try to validate, but fallback to raw dict on failure
                try:
                    validated = EvidenceResponse(**item)
                    result.append(validated.model_dump())
                except Exception as ve:
                    logger.warning(f"Skipping validation for {item.get('evidence_id')}: {ve}")
                    result.append({
                        "evidence_id": str(item.get("evidence_id", "unknown")),
                        "case_id": str(item.get("case_id", "")),
                        "file_name": str(item.get("file_name", "file")),
                        "file_type": str(item.get("file_type", "file")),
                        "file_size": int(item.get("file_size", 0) or 0),
                        "file_url": str(item.get("file_url", "")),
                        "description": item.get("description"),
                        "sensitive": bool(item.get("sensitive", False)),
                        "uploaded_by": {"user_id": "unknown", "display_name": "Unknown"},
                        "uploaded_at": str(item.get("uploaded_at", "2026-01-01T00:00:00"))
                    })
            except Exception as e:
                logger.warning(f"Failed to process evidence item {item.get('evidence_id')}: {e}")
                continue
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list all evidence: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list evidence.",
        )


@router.get(
    "/case/{case_id}",
    response_model=list[EvidenceResponse],
    status_code=status.HTTP_200_OK,
    summary="List all evidence for a case",
)
async def list_case_evidence(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    logger.info(f"Evidence request for case_id: {case_id} by user: {current_user.get('user_id')}")
    try:
        svc = get_evidence_service()
        items = await svc.list_evidence(case_id)
        logger.info(f"Found {len(items)} evidence items")
        return [EvidenceResponse(**item) for item in items]
    except Exception as e:
        logger.exception("Failed to list evidence for case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list evidence.",
        )


@router.get(
    "/{evidence_id}",
    response_model=EvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get evidence detail with download URL",
)
async def get_evidence(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        svc = get_evidence_service()
        result = await svc.get_evidence(evidence_id)
        return EvidenceResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to get evidence %s: %s", evidence_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve evidence.",
        )


@router.post(
    "/",
    response_model=EvidenceUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload evidence file",
)
async def upload_evidence(
    file: UploadFile = File(..., description="Evidence file"),
    case_id: str = Form(..., description="Case ID to associate evidence with"),
    description: Optional[str] = Form(default="", description="Optional description"),
    sensitive: bool = Form(default=False, description="Mark as sensitive evidence"),
    current_user: dict = Depends(require_role(["officer", "inspector", "admin", "super_admin"])),
):
    try:
        svc = get_evidence_service()
        result = await svc.upload_evidence(
            file=file,
            case_id=case_id,
            description=description,
            sensitive=sensitive,
            user_id=current_user["user_id"],
        )
        return EvidenceUploadResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to upload evidence: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload evidence.",
        )


@router.get(
    "/{evidence_id}/file",
    summary="Download evidence file",
)
async def download_evidence_file(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        svc = get_evidence_service()
        record = await svc.get_evidence(evidence_id)
        file_url = record.get("file_url", "")
        file_name = record.get("file_name", "file")
        file_path = _resolve_evidence_file_path(file_url, file_name)
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on server")

        import mimetypes
        mime, _ = mimetypes.guess_type(file_name or file_path)
        stored_type = (record.get("file_type") or "").strip().lower()
        if stored_type and "/" not in stored_type:
            guessed_from_stored = mimetypes.guess_type(f"file.{stored_type}")[0]
            if guessed_from_stored:
                mime = guessed_from_stored
        elif stored_type and "/" in stored_type:
            mime = stored_type

        response_headers = {"Content-Disposition": f"inline; filename={file_name}"}
        return FileResponse(
            path=file_path,
            media_type=mime or "application/octet-stream",
            filename=file_name,
            headers=response_headers,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to download evidence file %s: %s", evidence_id, e)
        raise HTTPException(status_code=500, detail="Failed to download file")


@router.get(
    "/{evidence_id}/download",
    summary="Download evidence file (alias)",
)
async def download_evidence_alias(
    evidence_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await download_evidence_file(evidence_id, current_user)


@router.delete(
    "/{evidence_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete evidence",
)
async def delete_evidence(
    evidence_id: str,
    current_user: dict = Depends(require_role(["inspector", "admin", "super_admin"])),
):
    try:
        svc = get_evidence_service()
        await svc.delete_evidence(evidence_id, user_id=current_user["user_id"])
        return SuccessResponse(data=None, message="Evidence deleted successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to delete evidence %s: %s", evidence_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete evidence.",
        )
