import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from middleware.auth_middleware import get_current_user, require_role
from models.case import (
    CaseCreate,
    CaseDetailResponse,
    CaseListResponse,
    CaseUpdate,
    SuspectCreate,
    SuspectResponse,
    TimelineEventCreate,
    TimelineEventResponse,
    WitnessCreate,
    WitnessResponse,
)
from models.common import PaginatedResponse, SuccessResponse
from services.case_service import CaseService
from adapters.catalyst_db import catalyst_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cases", tags=["Cases"])

case_service = CaseService(db=catalyst_db)


@router.get(
    "/",
    response_model=PaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="List cases with optional filters",
)
async def list_cases(
    current_user: dict = Depends(get_current_user),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    crime_type: Optional[str] = Query(default=None, description="Filter by crime type"),
    status: Optional[str] = Query(default=None, description="Filter by case status"),
    district: Optional[str] = Query(default=None, description="Filter by district"),
    date_from: Optional[str] = Query(default=None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(default=None, description="Filter to date (ISO format)"),
    officer_id: Optional[str] = Query(default=None, description="Filter by officer ID"),
    sort_by: Optional[str] = Query(default="created_at", description="Sort field"),
    sort_order: Optional[str] = Query(default="desc", description="Sort order (asc or desc)"),
):
    try:
        filters = {}
        if crime_type:
            filters["crime_type"] = crime_type
        if status:
            filters["status"] = status
        if district:
            filters["district"] = district
        if date_from:
            filters["date_from"] = date_from
        if date_to:
            filters["date_to"] = date_to
        if officer_id:
            filters["officer_id"] = officer_id
        filters["sort_by"] = sort_by
        filters["sort_order"] = sort_order

        result = await case_service.list_cases(page=page, limit=limit, filters=filters)
        return PaginatedResponse(
            data=result["data"],
            total=result["total"],
            page=result["page"],
            pages=result["pages"],
        )
    except Exception as e:
        logger.exception("Failed to list cases: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cases.",
        )


@router.get(
    "/search",
    response_model=PaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="Search cases by keyword",
)
async def search_cases(
    current_user: dict = Depends(get_current_user),
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    try:
        result = await case_service.search_cases(query=q, page=page, limit=limit)
        return PaginatedResponse(
            data=result["data"],
            total=result["total"],
            page=result["page"],
            pages=result["pages"],
        )
    except Exception as e:
        logger.exception("Failed to search cases: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search cases.",
        )


@router.get(
    "/{case_id}",
    response_model=CaseDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed case information",
)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        result = await case_service.get_case(case_id)
        return CaseDetailResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to get case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve case details.",
        )


@router.post(
    "/",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new case",
)
async def create_case(
    body: CaseCreate,
    current_user: dict = Depends(require_role(["inspector", "admin", "super_admin"])),
):
    try:
        result = await case_service.create_case(body, user_id=current_user["user_id"])
        return SuccessResponse(data=result, message="Case created successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to create case: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create case.",
        )


@router.put(
    "/{case_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Update an existing case",
)
async def update_case(
    case_id: str,
    body: CaseUpdate,
    current_user: dict = Depends(require_role(["inspector", "admin", "super_admin"])),
):
    try:
        result = await case_service.update_case(case_id, body, user_id=current_user["user_id"])
        return SuccessResponse(data=result, message="Case updated successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to update case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update case.",
        )


@router.delete(
    "/{case_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Soft delete a case",
)
async def delete_case(
    case_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
):
    try:
        await case_service.delete_case(case_id, user_id=current_user["user_id"])
        return SuccessResponse(data=None, message="Case deleted successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to delete case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete case.",
        )


@router.get(
    "/{case_id}/timeline",
    response_model=list[TimelineEventResponse],
    status_code=status.HTTP_200_OK,
    summary="Get timeline events for a case",
)
async def get_case_timeline(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        case = await case_service.get_case(case_id)
        return [TimelineEventResponse(**evt) for evt in case.get("timeline_events", [])]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to get timeline for case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve timeline.",
        )


@router.post(
    "/{case_id}/timeline",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a timeline event to a case",
)
async def add_timeline_event(
    case_id: str,
    body: TimelineEventCreate,
    current_user: dict = Depends(require_role(["inspector", "admin", "super_admin"])),
):
    try:
        from utils.helpers import generate_uuid
        from datetime import datetime

        now = datetime.utcnow().isoformat()
        event_data = body.model_dump()
        event_data["ROWID"] = generate_uuid()
        event_data["case_id"] = case_id
        event_data["created_at"] = now
        event_data["officer_id"] = event_data.get("officer_id") or current_user["user_id"]

        await catalyst_db.insert("Timeline", event_data)
        return SuccessResponse(data=event_data, message="Timeline event added successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to add timeline event to case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add timeline event.",
        )


@router.get(
    "/{case_id}/related",
    response_model=list[dict],
    status_code=status.HTTP_200_OK,
    summary="Get related cases with similarity scores",
)
async def get_related_cases(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        results = await case_service.get_related_cases(case_id)
        return results
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to get related cases for %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve related cases.",
        )


@router.post(
    "/{case_id}/suspects",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a suspect to a case",
)
async def add_suspect(
    case_id: str,
    body: SuspectCreate,
    current_user: dict = Depends(require_role(["inspector", "admin", "super_admin"])),
):
    try:
        from utils.helpers import generate_uuid
        from datetime import datetime

        case = await case_service.get_case(case_id)
        suspect_id = generate_uuid()
        now = datetime.utcnow().isoformat()
        row_data = body.model_dump()
        row_data["ROWID"] = suspect_id
        row_data["suspect_id"] = suspect_id
        row_data["case_id"] = case_id
        row_data["created_at"] = now
        row_data["updated_at"] = now

        await catalyst_db.insert("Suspects", row_data)

        await catalyst_db.insert("Audit_Logs", {
            "user_id": current_user["user_id"],
            "action": "suspect.added",
            "module": "cases",
            "details": f"Added suspect '{body.name}' to case {case_id}",
        })

        return SuccessResponse(data=row_data, message="Suspect added successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to add suspect to case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add suspect.",
        )


@router.get(
    "/{case_id}/witnesses",
    response_model=list[WitnessResponse],
    status_code=status.HTTP_200_OK,
    summary="Get witnesses for a case",
)
async def get_witnesses(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        case = await case_service.get_case(case_id)
        return [WitnessResponse(**w) for w in case.get("witnesses", [])]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to get witnesses for case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve witnesses.",
        )


@router.post(
    "/{case_id}/witnesses",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a witness to a case",
)
async def add_witness(
    case_id: str,
    body: WitnessCreate,
    current_user: dict = Depends(require_role(["inspector", "admin", "super_admin"])),
):
    try:
        from utils.helpers import generate_uuid
        from datetime import datetime

        case = await case_service.get_case(case_id)
        witness_id = generate_uuid()
        now = datetime.utcnow().isoformat()
        row_data = body.model_dump()
        row_data["ROWID"] = witness_id
        row_data["witness_id"] = witness_id
        row_data["case_id"] = case_id
        row_data["created_at"] = now
        row_data["updated_at"] = now

        await catalyst_db.insert("Witnesses", row_data)

        await catalyst_db.insert("Audit_Logs", {
            "user_id": current_user["user_id"],
            "action": "witness.added",
            "module": "cases",
            "details": f"Added witness '{body.name}' to case {case_id}",
        })

        return SuccessResponse(data=row_data, message="Witness added successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to add witness to case %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add witness.",
        )
