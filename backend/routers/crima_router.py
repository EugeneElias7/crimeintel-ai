import logging

from fastapi import APIRouter, Depends, HTTPException, status

from middleware.auth_middleware import get_current_user
from middleware.rate_limiter import rate_limiter
from models.common import SuccessResponse
from models.crima import ConversationHistory, QueryRequest, QueryResponse
from services.crima_service import CRIMAService
from services.intent_service import IntentService
from services.embedding_service import EmbeddingService
from services.faiss_service import FAISSService
from services.context_service import ContextService
from services.case_service import CaseService
from adapters.db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crima", tags=["CRIMA AI"])

crima_service = CRIMAService(
    intent_service=IntentService(),
    embedding_service=EmbeddingService(),
    faiss_service=FAISSService(),
    context_service=ContextService(),
    case_service=CaseService(db=db),
)


@router.post(
    "/query",
    response_model=QueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a natural language query to CRIMA AI",
)
async def query_crima(
    body: QueryRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id", "anonymous")
    if not rate_limiter.check(user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before sending another query.",
        )
    try:
        result = await crima_service.process_query(text=body.text, context=body.context)
        return result
    except Exception as e:
        logger.exception("CRIMA query failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process CRIMA query.",
        )


@router.get(
    "/history",
    response_model=ConversationHistory,
    status_code=status.HTTP_200_OK,
    summary="Get CRIMA conversation history for current user",
)
async def get_history(
    current_user: dict = Depends(get_current_user),
):
    try:
        messages = await crima_service.get_history()
        return ConversationHistory(messages=messages)
    except Exception as e:
        logger.exception("Failed to get CRIMA history: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation history.",
        )


@router.delete(
    "/history",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Clear CRIMA conversation history for current user",
)
async def clear_history(
    current_user: dict = Depends(get_current_user),
):
    try:
        await crima_service.clear_history()
        return SuccessResponse(data=None, message="Conversation history cleared.")
    except Exception as e:
        logger.exception("Failed to clear CRIMA history: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear conversation history.",
        )
