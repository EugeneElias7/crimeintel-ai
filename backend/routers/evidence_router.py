import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from middleware.auth_middleware import get_current_user, require_role
from models.evidence import EvidenceResponse, EvidenceUploadResponse
from models.common import SuccessResponse
from services.evidence_service import EvidenceService
from adapters.catalyst_db import catalyst_db
from adapters.catalyst_fs import catalyst_fs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evidence", tags=["Evidence"])

evidence_service = EvidenceService(db=catalyst_db, fs=catalyst_fs)


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
    try:
        items = await evidence_service.list_evidence(case_id)
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
        result = await evidence_service.get_evidence(evidence_id)
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
        result = await evidence_service.upload_evidence(
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
        await evidence_service.delete_evidence(evidence_id, user_id=current_user["user_id"])
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
