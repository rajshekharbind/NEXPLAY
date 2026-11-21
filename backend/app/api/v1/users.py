from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User, UserProfile
from app.models.watchlist import UserPreference
from app.models.billing import CreditWallet
from app.schemas.user import (
    UserProfileRead,
    UserProfileUpdate,
    UserPreferenceRead,
    UserPreferenceUpdate,
    WalletRead
)
from app.schemas.common import ResponseEnvelope
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/profile", response_model=ResponseEnvelope[UserProfileRead])
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Fetch current user's entertainment profile."""
    if not current_user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ResponseEnvelope(
        success=True,
        message="User profile fetched",
        data=UserProfileRead.model_validate(current_user.profile)
    )

@router.put("/profile", response_model=ResponseEnvelope[UserProfileRead])
async def update_user_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update profile details (name, avatar, bio, language, country)."""
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.country_code is not None:
        profile.country_code = payload.country_code
    if payload.preferred_language is not None:
        profile.preferred_language = payload.preferred_language

    await db.commit()
    await db.refresh(profile)

    return ResponseEnvelope(
        success=True,
        message="Profile updated successfully",
        data=UserProfileRead.model_validate(profile)
    )

@router.get("/preferences", response_model=ResponseEnvelope[UserPreferenceRead])
async def get_user_preferences(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch user's entertainment preferences (favorite genres, languages, mood tags)."""
    pref = current_user.preferences[0] if current_user.preferences else None
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            favorite_genres=["Action", "Sci-Fi"],
            preferred_languages=["Hindi", "English"],
            connected_platforms_filter=[],
            mood_tags=["Chill"]
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return ResponseEnvelope(
        success=True,
        message="Preferences fetched",
        data=UserPreferenceRead.model_validate(pref)
    )

@router.put("/preferences", response_model=ResponseEnvelope[UserPreferenceRead])
async def update_user_preferences(
    payload: UserPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's entertainment preferences."""
    pref = current_user.preferences[0] if current_user.preferences else None
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if payload.favorite_genres is not None:
        pref.favorite_genres = payload.favorite_genres
    if payload.preferred_languages is not None:
        pref.preferred_languages = payload.preferred_languages
    if payload.connected_platforms_filter is not None:
        pref.connected_platforms_filter = payload.connected_platforms_filter
    if payload.mood_tags is not None:
        pref.mood_tags = payload.mood_tags

    await db.commit()
    await db.refresh(pref)

    return ResponseEnvelope(
        success=True,
        message="Preferences updated successfully",
        data=UserPreferenceRead.model_validate(pref)
    )

@router.get("/wallet", response_model=ResponseEnvelope[WalletRead])
async def get_user_wallet(current_user: User = Depends(get_current_active_user)):
    """Fetch current user's AI credit wallet balance."""
    if not current_user.wallet:
        raise HTTPException(status_code=404, detail="Credit wallet not found")
    return ResponseEnvelope(
        success=True,
        message="Wallet balance fetched",
        data=WalletRead.model_validate(current_user.wallet)
    )
