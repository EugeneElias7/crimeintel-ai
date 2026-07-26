from fastapi import APIRouter

from .auth_router import router as auth_router
from .case_router import router as case_router
from .evidence_router import router as evidence_router
from .crima_router import router as crima_router
from .analytics_router import router as analytics_router
from .report_router import router as report_router
from .notification_router import router as notification_router
from .settings_router import router as settings_router
from .admin_router import router as admin_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(case_router)
router.include_router(evidence_router)
router.include_router(crima_router)
router.include_router(analytics_router)
router.include_router(report_router)
router.include_router(notification_router)
router.include_router(settings_router)
router.include_router(admin_router)
