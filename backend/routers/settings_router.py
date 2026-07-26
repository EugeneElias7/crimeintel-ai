import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from middleware.auth_middleware import get_current_user
from models.common import SuccessResponse
from models.user import UserProfileResponse
from adapters.catalyst_db import catalyst_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get(
    "/profile",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
)
async def get_profile(
    current_user: dict = Depends(get_current_user),
):
    try:
        user = await catalyst_db.get("Users", current_user["user_id"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return UserProfileResponse(
            user_id=user.get("ROWID", current_user["user_id"]),
            display_name=user.get("display_name", ""),
            email=user.get("email", ""),
            role=user.get("role", ""),
            badge_number=user.get("badge_number"),
            phone=user.get("phone"),
            status=user.get("status", "active"),
            created_at=user.get("created_at", ""),
            updated_at=user.get("updated_at", ""),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get profile: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile.",
        )


@router.put(
    "/profile",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
)
async def update_profile(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    allowed_fields = {"display_name", "phone", "badge_number"}
    update_data = {k: v for k, v in body.items() if k in allowed_fields and v is not None}

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update. Allowed: display_name, phone, badge_number.",
        )

    try:
        user = await catalyst_db.get("Users", current_user["user_id"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow().isoformat()
        await catalyst_db.update("Users", current_user["user_id"], update_data)
        return SuccessResponse(data=update_data, message="Profile updated successfully.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update profile: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile.",
        )


@router.get(
    "/preferences",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user notification preferences and theme",
)
async def get_preferences(
    current_user: dict = Depends(get_current_user),
):
    try:
        records = await catalyst_db.query("User_Preferences", {"user_id": current_user["user_id"]})
        if records:
            prefs = records[0]
            return SuccessResponse(
                data={
                    "notifications": {
                        "case_assigned": prefs.get("notif_case_assigned", True),
                        "status_change": prefs.get("notif_status_change", True),
                        "evidence_uploaded": prefs.get("notif_evidence_uploaded", True),
                        "system_announcement": prefs.get("notif_system_announcement", True),
                    },
                    "theme": prefs.get("theme", "light"),
                }
            )
        return SuccessResponse(
            data={
                "notifications": {
                    "case_assigned": True,
                    "status_change": True,
                    "evidence_uploaded": True,
                    "system_announcement": True,
                },
                "theme": "light",
            }
        )
    except Exception as e:
        logger.exception("Failed to get preferences: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve preferences.",
        )


@router.put(
    "/preferences",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user notification preferences and theme",
)
async def update_preferences(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    try:
        notifications = body.get("notifications", {})
        theme = body.get("theme", "light")

        if theme not in ("light", "dark", "system"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="theme must be one of: light, dark, system.",
            )

        pref_data = {
            "user_id": current_user["user_id"],
            "notif_case_assigned": notifications.get("case_assigned", True),
            "notif_status_change": notifications.get("status_change", True),
            "notif_evidence_uploaded": notifications.get("evidence_uploaded", True),
            "notif_system_announcement": notifications.get("system_announcement", True),
            "theme": theme,
        }

        records = await catalyst_db.query("User_Preferences", {"user_id": current_user["user_id"]})
        if records:
            existing = records[0]
            pref_id = existing.get("ROWID") or existing.get("preference_id")
            if pref_id:
                await catalyst_db.update("User_Preferences", pref_id, pref_data)
            else:
                from utils.helpers import generate_uuid
                pref_data["ROWID"] = generate_uuid()
                await catalyst_db.insert("User_Preferences", pref_data)
        else:
            from utils.helpers import generate_uuid
            pref_data["ROWID"] = generate_uuid()
            await catalyst_db.insert("User_Preferences", pref_data)

        return SuccessResponse(data=pref_data, message="Preferences updated successfully.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update preferences: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences.",
        )
