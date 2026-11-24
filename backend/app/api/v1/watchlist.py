import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.content import Content, ContentGenre, ContentPlatform
from app.models.watchlist import Watchlist, WatchlistItem, WatchlistStatus
from app.schemas.watchlist import (
    WatchlistRead,
    WatchlistCreate,
    WatchlistUpdate,
    WatchlistItemRead,
    WatchlistItemCreate,
    WatchlistItemUpdate,
    WatchlistToggleRequest,
    WatchlistToggleResponse,
    WatchlistCheckResponse
)
from app.schemas.common import ResponseEnvelope
from app.api.v1.content import serialize_content
from app.core.logging import logger

router = APIRouter()

def serialize_watchlist_item(item: WatchlistItem, content: Optional[Content] = None) -> WatchlistItemRead:
    item_content = content or (item.__dict__.get("content") if hasattr(item, "__dict__") else None)
    content_read = serialize_content(item_content) if item_content else None
    return WatchlistItemRead(
        id=item.id,
        watchlist_id=item.watchlist_id,
        content_id=item.content_id,
        status=item.status,
        personal_rating=item.personal_rating,
        notes=item.notes,
        created_at=item.created_at,
        content=content_read
    )

def serialize_watchlist(w: Watchlist, items: Optional[List[WatchlistItem]] = None) -> WatchlistRead:
    if items is not None:
        items_read = [serialize_watchlist_item(item) for item in items]
    else:
        loaded_items = w.__dict__.get("items", []) if hasattr(w, "__dict__") else []
        items_read = [serialize_watchlist_item(item) for item in loaded_items]

    return WatchlistRead(
        id=w.id,
        user_id=w.user_id,
        name=w.name,
        is_default=w.is_default,
        is_public=w.is_public,
        items_count=len(items_read),
        items=items_read,
        created_at=w.created_at
    )

async def get_or_create_default_watchlist(db: AsyncSession, user_id: str) -> Watchlist:
    """Ensure user has at least one default watchlist."""
    stmt = (
        select(Watchlist)
        .options(
            selectinload(Watchlist.items)
            .selectinload(WatchlistItem.content)
            .selectinload(Content.genres)
            .selectinload(ContentGenre.genre),
            selectinload(Watchlist.items)
            .selectinload(WatchlistItem.content)
            .selectinload(Content.platforms)
            .selectinload(ContentPlatform.platform)
        )
        .where(Watchlist.user_id == user_id, Watchlist.is_default == True)
    )
    result = await db.execute(stmt)
    watchlist = result.scalar_one_or_none()
    
    if not watchlist:
        watchlist = Watchlist(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name="My Watchlist",
            is_default=True,
            is_public=False
        )
        db.add(watchlist)
        await db.commit()
        await db.refresh(watchlist)
        # re-fetch with relationships loaded
        result = await db.execute(stmt)
        watchlist = result.scalar_one()
        logger.info(f"Created default watchlist for user {user_id}")
    return watchlist

@router.get("", response_model=ResponseEnvelope[List[WatchlistRead]])
async def list_user_watchlists(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all private and custom watchlists for the logged-in user."""
    # Ensure default watchlist exists
    await get_or_create_default_watchlist(db, current_user.id)

    stmt = (
        select(Watchlist)
        .options(
            selectinload(Watchlist.items)
            .selectinload(WatchlistItem.content)
            .selectinload(Content.genres)
            .selectinload(ContentGenre.genre),
            selectinload(Watchlist.items)
            .selectinload(WatchlistItem.content)
            .selectinload(Content.platforms)
            .selectinload(ContentPlatform.platform)
        )
        .where(Watchlist.user_id == current_user.id)
        .order_by(desc(Watchlist.is_default), Watchlist.created_at.asc())
    )
    result = await db.execute(stmt)
    watchlists = result.scalars().all()

    return ResponseEnvelope(
        success=True,
        message=f"Fetched {len(watchlists)} watchlists",
        data=[serialize_watchlist(w) for w in watchlists]
    )

@router.post("", response_model=ResponseEnvelope[WatchlistRead], status_code=status.HTTP_201_CREATED)
async def create_custom_watchlist(
    payload: WatchlistCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new custom themed watchlist (e.g., 'Anime Binge', 'Weekend Chill')."""
    new_watchlist = Watchlist(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=payload.name.strip(),
        is_default=False,
        is_public=payload.is_public
    )
    db.add(new_watchlist)
    await db.commit()
    await db.refresh(new_watchlist)

    return ResponseEnvelope(
        success=True,
        message=f"Watchlist '{new_watchlist.name}' created successfully",
        data=serialize_watchlist(new_watchlist, items=[])
    )

@router.get("/{watchlist_id}", response_model=ResponseEnvelope[WatchlistRead])
async def get_watchlist_detail(
    watchlist_id: str,
    status_filter: Optional[WatchlistStatus] = Query(None, description="Filter items by status (PLANNED, WATCHING, COMPLETED, DROPPED)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full details of a specific watchlist including all items and provider links."""
    stmt = (
        select(Watchlist)
        .options(
            selectinload(Watchlist.items)
            .selectinload(WatchlistItem.content)
            .selectinload(Content.genres)
            .selectinload(ContentGenre.genre),
            selectinload(Watchlist.items)
            .selectinload(WatchlistItem.content)
            .selectinload(Content.platforms)
            .selectinload(ContentPlatform.platform)
        )
        .where(Watchlist.id == watchlist_id, Watchlist.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    watchlist = result.scalar_one_or_none()

    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist not found or unauthorized access"
        )

    serialized = serialize_watchlist(watchlist)
    if status_filter:
        serialized.items = [item for item in serialized.items if item.status == status_filter]
        serialized.items_count = len(serialized.items)

    return ResponseEnvelope(
        success=True,
        message="Watchlist retrieved successfully",
        data=serialized
    )

@router.delete("/{watchlist_id}", response_model=ResponseEnvelope[dict])
async def delete_custom_watchlist(
    watchlist_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom watchlist. The default system watchlist cannot be deleted."""
    stmt = select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == current_user.id)
    result = await db.execute(stmt)
    watchlist = result.scalar_one_or_none()

    if not watchlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found")

    if watchlist.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the default 'My Watchlist'. You can remove items from it instead."
        )

    await db.delete(watchlist)
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Custom watchlist deleted successfully",
        data={"deleted_id": watchlist_id}
    )

@router.post("/{watchlist_id}/items", response_model=ResponseEnvelope[WatchlistItemRead], status_code=status.HTTP_201_CREATED)
async def add_item_to_watchlist(
    watchlist_id: str,
    payload: WatchlistItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a content item to a specific watchlist, or update status if it already exists."""
    # Verify watchlist ownership
    wl_stmt = select(Watchlist).where(Watchlist.id == watchlist_id, Watchlist.user_id == current_user.id)
    wl_res = await db.execute(wl_stmt)
    watchlist = wl_res.scalar_one_or_none()
    if not watchlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found")

    # Verify content exists
    c_stmt = (
        select(Content)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .where(Content.id == payload.content_id)
    )
    c_res = await db.execute(c_stmt)
    content = c_res.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    # Check for existing item in this watchlist
    item_stmt = select(WatchlistItem).where(
        WatchlistItem.watchlist_id == watchlist_id,
        WatchlistItem.content_id == payload.content_id
    )
    item_res = await db.execute(item_stmt)
    existing_item = item_res.scalar_one_or_none()

    if existing_item:
        existing_item.status = payload.status
        if payload.personal_rating is not None:
            existing_item.personal_rating = payload.personal_rating
        if payload.notes is not None:
            existing_item.notes = payload.notes
        await db.commit()
        return ResponseEnvelope(
            success=True,
            message="Watchlist item updated successfully",
            data=serialize_watchlist_item(existing_item, content=content)
        )

    # Create new item
    new_item = WatchlistItem(
        id=str(uuid.uuid4()),
        watchlist_id=watchlist_id,
        content_id=payload.content_id,
        status=payload.status,
        personal_rating=payload.personal_rating,
        notes=payload.notes
    )
    db.add(new_item)
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message=f"'{content.title}' added to watchlist",
        data=serialize_watchlist_item(new_item, content=content)
    )

@router.patch("/items/{item_id}", response_model=ResponseEnvelope[WatchlistItemRead])
async def update_watchlist_item(
    item_id: str,
    payload: WatchlistItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update progress status (PLANNED, WATCHING, COMPLETED, DROPPED), rating, or personal notes."""
    stmt = (
        select(WatchlistItem)
        .join(Watchlist)
        .options(
            selectinload(WatchlistItem.content).selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(WatchlistItem.content).selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .where(WatchlistItem.id == item_id, Watchlist.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found")

    cached_content = item.content
    if payload.status is not None:
        item.status = payload.status
    if payload.personal_rating is not None:
        item.personal_rating = payload.personal_rating
    if payload.notes is not None:
        item.notes = payload.notes

    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Watchlist item updated successfully",
        data=serialize_watchlist_item(item, content=cached_content)
    )

@router.delete("/items/{item_id}", response_model=ResponseEnvelope[dict])
async def delete_watchlist_item(
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a title from the watchlist."""
    stmt = (
        select(WatchlistItem)
        .join(Watchlist)
        .where(WatchlistItem.id == item_id, Watchlist.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found")

    await db.delete(item)
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Item removed from watchlist",
        data={"deleted_item_id": item_id}
    )

@router.post("/toggle", response_model=ResponseEnvelope[WatchlistToggleResponse])
async def toggle_default_watchlist_item(
    payload: WatchlistToggleRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    1-Click Quick Bookmark:
    Toggles content in the user's default watchlist.
    If present, removes it; if absent, adds it with status PLANNED.
    """
    default_wl = await get_or_create_default_watchlist(db, current_user.id)

    # Check if item exists in default watchlist
    stmt = (
        select(WatchlistItem)
        .options(
            selectinload(WatchlistItem.content).selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(WatchlistItem.content).selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .where(WatchlistItem.watchlist_id == default_wl.id, WatchlistItem.content_id == payload.content_id)
    )
    result = await db.execute(stmt)
    existing_item = result.scalar_one_or_none()

    if existing_item:
        await db.delete(existing_item)
        await db.commit()
        return ResponseEnvelope(
            success=True,
            message="Removed from watchlist",
            data=WatchlistToggleResponse(
                action="removed",
                content_id=payload.content_id,
                watchlist_id=default_wl.id,
                item=None
            )
        )
    else:
        # Load content to ensure it exists
        c_stmt = (
            select(Content)
            .options(
                selectinload(Content.genres).selectinload(ContentGenre.genre),
                selectinload(Content.platforms).selectinload(ContentPlatform.platform)
            )
            .where(Content.id == payload.content_id)
        )
        c_res = await db.execute(c_stmt)
        content = c_res.scalar_one_or_none()
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

        new_item = WatchlistItem(
            id=str(uuid.uuid4()),
            watchlist_id=default_wl.id,
            content_id=payload.content_id,
            status=payload.status or WatchlistStatus.PLANNED
        )
        db.add(new_item)
        await db.commit()

        return ResponseEnvelope(
            success=True,
            message="Added to watchlist",
            data=WatchlistToggleResponse(
                action="added",
                content_id=payload.content_id,
                watchlist_id=default_wl.id,
                item=serialize_watchlist_item(new_item, content=content)
            )
        )

@router.get("/check/{content_id}", response_model=ResponseEnvelope[WatchlistCheckResponse])
async def check_content_in_watchlist(
    content_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if a specific content title is in any of the user's watchlists."""
    stmt = (
        select(WatchlistItem)
        .join(Watchlist)
        .where(WatchlistItem.content_id == content_id, Watchlist.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()

    if item:
        return ResponseEnvelope(
            success=True,
            message="Content is in user watchlist",
            data=WatchlistCheckResponse(
                in_watchlist=True,
                item_id=item.id,
                watchlist_id=item.watchlist_id,
                status=item.status,
                personal_rating=item.personal_rating
            )
        )
    else:
        return ResponseEnvelope(
            success=True,
            message="Content is not in user watchlist",
            data=WatchlistCheckResponse(in_watchlist=False)
        )
