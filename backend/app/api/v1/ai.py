from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_active_user, get_optional_current_user
from app.models.user import User
from app.schemas.ai import (
    AIMoodItem,
    AIRecommendRequest,
    AIRecommendResponse,
    AIChatRequest,
    AIChatResponse,
    RecommendationHistoryItem
)
from app.schemas.common import ResponseEnvelope
from app.services.ai_service import (
    PRESET_MOODS,
    get_ai_recommendations,
    generate_copilot_chat,
    get_user_recommendation_history
)
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/moods",
    response_model=ResponseEnvelope[List[AIMoodItem]],
    summary="Get curated mood and vibe presets for entertainment discovery"
)
async def get_moods():
    """Retrieve pre-configured entertainment moods with tags, icons, and sample queries."""
    return ResponseEnvelope(
        success=True,
        message="Retrieved AI mood presets successfully",
        data=PRESET_MOODS
    )

@router.post(
    "/recommend",
    response_model=ResponseEnvelope[AIRecommendResponse],
    summary="Generate personalized AI content recommendations"
)
async def recommend_content(
    request: AIRecommendRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Multi-dimensional AI recommendation engine.
    Analyzes natural language prompts, mood presets, duration constraints, and platforms.
    Personalizes based on user's watchlist history and deducts credits when logged in.
    """
    try:
        response = await get_ai_recommendations(db, request, user=user)
        return ResponseEnvelope(
            success=True,
            message=f"Generated {response.total_results} recommendations",
            data=response
        )
    except Exception as e:
        logger.error(f"Error generating AI recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )

@router.post(
    "/chat",
    response_model=ResponseEnvelope[AIChatResponse],
    summary="Conversational AI Entertainment Copilot chat assistant"
)
async def copilot_chat(
    request: AIChatRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Interactive entertainment assistant.
    Maintains dialogue context, returns smart streaming picks, platform deep links, and suggested follow-ups.
    """
    try:
        response = await generate_copilot_chat(db, request, user=user)
        return ResponseEnvelope(
            success=True,
            message="Copilot chat response generated",
            data=response
        )
    except Exception as e:
        logger.error(f"Error in Copilot chat: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Copilot chat failed: {str(e)}"
        )

@router.get(
    "/history",
    response_model=ResponseEnvelope[List[RecommendationHistoryItem]],
    summary="Get past recommendations history for authenticated user"
)
async def get_history(
    limit: int = Query(default=15, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Retrieve audit history of content recommendations generated for current user."""
    history = await get_user_recommendation_history(db, user.id, limit=limit)
    return ResponseEnvelope(
        success=True,
        message="Retrieved recommendation history",
        data=history
    )
