import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from middleware.auth_middleware import get_current_user
from models.common import SuccessResponse
from services.notification_service import NotificationService
from adapters.catalyst_db import catalyst_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

notification_service = NotificationService(db=catalyst_db)


@router.get(
    "/",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get notifications for current user",
)
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    unread_only: bool = Query(default=False, description="Filter to unread notifications only"),
):
    try:
        result = await notification_service.get_notifications(
            user_id=current_user["user_id"], unread_only=unread_only
        )
        return result
    except Exception as e:
        logger.exception("Failed to get notifications: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications.",
        )


@router.put(
    "/{notification_id}/read",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark a notification as read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        await notification_service.mark_read(
            notification_id=notification_id, user_id=current_user["user_id"]
        )
        return SuccessResponse(data=None, message="Notification marked as read.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to mark notification %s as read: %s", notification_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read.",
        )


@router.put(
    "/read-all",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark all notifications as read for current user",
)
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
):
    try:
        await notification_service.mark_all_read(user_id=current_user["user_id"])
        return SuccessResponse(data=None, message="All notifications marked as read.")
    except Exception as e:
        logger.exception("Failed to mark all notifications as read: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notifications as read.",
        )
