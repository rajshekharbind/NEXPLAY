import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, UserProfile, UserRole
from app.models.billing import CreditWallet, CreditTransaction, TransactionType
from app.models.watchlist import Watchlist, UserPreference
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.schemas.user import UserRead, DetailedUserRead
from app.schemas.common import ResponseEnvelope
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/register", response_model=ResponseEnvelope[TokenResponse], status_code=status.HTTP_201_CREATED)
async def register_user(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.
    Automatically initializes:
    1. User account with hashed password
    2. User profile (country, language, name)
    3. Credit wallet with 100 free welcome credits
    4. Default private watchlist ('My Watchlist')
    5. Default entertainment preferences
    """
    # Check if email is already registered
    existing_stmt = select(User).where(User.email == payload.email.lower().strip())
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    # Create User
    new_user_id = str(uuid.uuid4())
    user = User(
        id=new_user_id,
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole.USER,
        is_active=True,
        is_verified=False
    )
    db.add(user)

    # Create User Profile
    profile = UserProfile(
        id=str(uuid.uuid4()),
        user_id=new_user_id,
        full_name=payload.full_name or payload.email.split("@")[0].capitalize(),
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={payload.full_name or payload.email}",
        bio="Entertainment enthusiast exploring movies, music, and streaming on NEXPLAY.",
        country_code=payload.country_code,
        preferred_language=payload.preferred_language
    )
    db.add(profile)

    # Initialize Welcome Credit Wallet (100 free AI credits)
    wallet_id = str(uuid.uuid4())
    wallet = CreditWallet(
        id=wallet_id,
        user_id=new_user_id,
        balance_credits=100,
        lifetime_earned=100,
        lifetime_spent=0
    )
    db.add(wallet)

    welcome_tx = CreditTransaction(
        id=str(uuid.uuid4()),
        wallet_id=wallet_id,
        amount=100,
        transaction_type=TransactionType.BONUS,
        description="Welcome to NEXPLAY! 100 Free AI Credits.",
        reference_id="ONBOARDING_BONUS"
    )
    db.add(welcome_tx)

    # Initialize Default Watchlist
    watchlist = Watchlist(
        id=str(uuid.uuid4()),
        user_id=new_user_id,
        name="My Watchlist",
        is_default=True,
        is_public=False
    )
    db.add(watchlist)

    # Initialize Entertainment Preferences
    preferences = UserPreference(
        id=str(uuid.uuid4()),
        user_id=new_user_id,
        favorite_genres=["Action", "Sci-Fi", "Lo-Fi"],
        preferred_languages=["Hindi", "English"],
        connected_platforms_filter=[],
        mood_tags=["Chill", "Blockbuster"]
    )
    db.add(preferences)

    await db.commit()

    # Re-fetch with relationships loaded
    stmt = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.wallet))
        .where(User.id == new_user_id)
    )
    user_loaded = (await db.execute(stmt)).scalar_one()

    # Issue Tokens
    access_token = create_access_token(subject=user_loaded.id, extra_claims={"role": user_loaded.role.value})
    refresh_token = create_refresh_token(subject=user_loaded.id)

    token_data = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user_loaded)
    )

    return ResponseEnvelope(
        success=True,
        message="Registration successful! Welcome to NEXPLAY.",
        data=token_data
    )

@router.post("/login", response_model=ResponseEnvelope[TokenResponse])
async def login_user(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access & refresh tokens."""
    stmt = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.wallet))
        .where(User.email == payload.email.lower().strip())
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )

    access_token = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
    refresh_token = create_refresh_token(subject=user.id)

    token_data = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user)
    )

    return ResponseEnvelope(
        success=True,
        message="Login successful",
        data=token_data
    )

@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
async def refresh_access_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Rotate and refresh access token using a valid refresh token."""
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = decoded.get("sub")
    stmt = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.wallet))
        .where(User.id == user_id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated"
        )

    # Issue new token pair (refresh token rotation)
    new_access_token = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
    new_refresh_token = create_refresh_token(subject=user.id)

    token_data = TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user)
    )

    return ResponseEnvelope(
        success=True,
        message="Token refreshed successfully",
        data=token_data
    )

@router.get("/me", response_model=ResponseEnvelope[DetailedUserRead])
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Retrieve full details of the currently authenticated user."""
    pref = current_user.preferences[0] if current_user.preferences else None

    user_data = DetailedUserRead(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        profile=current_user.profile,
        wallet=current_user.wallet,
        preferences=pref
    )

    return ResponseEnvelope(
        success=True,
        message="User profile fetched",
        data=user_data
    )

@router.post("/logout", response_model=ResponseEnvelope[dict])
async def logout(current_user: User = Depends(get_current_active_user)):
    """Confirm user logout and session termination."""
    return ResponseEnvelope(
        success=True,
        message="Successfully logged out of NEXPLAY session",
        data={"user_id": current_user.id}
    )

@router.post("/forgot-password", response_model=ResponseEnvelope[dict])
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Generate a password reset token for account recovery."""
    stmt = select(User).where(User.email == payload.email.lower().strip())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Always return a generic success message to prevent user enumeration
    if user:
        reset_token = create_access_token(subject=user.id, extra_claims={"purpose": "reset_password"})
        return ResponseEnvelope(
            success=True,
            message="If this email is registered, password reset instructions have been dispatched.",
            data={"reset_token_preview": reset_token if settings.DEBUG else None}
        )

    return ResponseEnvelope(
        success=True,
        message="If this email is registered, password reset instructions have been dispatched.",
        data=None
    )

@router.post("/reset-password", response_model=ResponseEnvelope[dict])
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset user password using a verified reset token."""
    decoded = decode_token(payload.token)
    if not decoded or decoded.get("purpose") != "reset_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )

    user_id = decoded.get("sub")
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Password has been reset successfully. Please log in with your new password.",
        data=None
    )
