import re
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, asc, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.content import Content, ContentType, Genre, ContentGenre, ContentPlatform, AvailabilityType
from app.models.platform import Platform
from app.models.user import User, UserRole
from app.schemas.content import (
    ContentRead,
    ContentSearchResults,
    ContentCreate,
    ContentPlatformLinkCreate,
    ContentPlatformRead,
    GenreRead
)
from app.schemas.common import ResponseEnvelope
from app.api.deps import require_roles

router = APIRouter()

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)

def serialize_content(c: Content) -> ContentRead:
    genre_names = [cg.genre.name for cg in c.genres if cg.genre] if c.genres else []
    streaming_options = [
        ContentPlatformRead(
            platform_name=cp.platform.name,
            platform_slug=cp.platform.slug,
            platform_logo=cp.platform.logo_url,
            availability_type=cp.availability_type,
            pricing_details=cp.pricing_details,
            stream_url=cp.stream_url
        )
        for cp in c.platforms
        if cp.platform
    ] if c.platforms else []

    return ContentRead(
        id=c.id,
        title=c.title,
        slug=c.slug,
        content_type=c.content_type,
        description=c.description,
        poster_url=c.poster_url,
        backdrop_url=c.backdrop_url,
        release_date=c.release_date,
        duration_minutes=c.duration_minutes,
        rating=c.rating,
        maturity_rating=c.maturity_rating,
        original_language=c.original_language,
        view_count=c.view_count,
        is_featured=c.is_featured,
        is_free=c.is_free,
        genres=genre_names,
        streaming_options=streaming_options
    )

@router.get("/genres", response_model=ResponseEnvelope[List[GenreRead]])
async def list_genres(db: AsyncSession = Depends(get_db)):
    """Fetch all entertainment genres across movies, music, video, and anime."""
    result = await db.execute(select(Genre).order_by(Genre.name.asc()))
    genres = result.scalars().all()
    return ResponseEnvelope(
        success=True,
        message="Genres fetched successfully",
        data=[GenreRead.model_validate(g) for g in genres]
    )

@router.get("/featured", response_model=ResponseEnvelope[List[ContentRead]])
async def list_featured_content(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve top featured and trending content across movies, series, songs, and anime."""
    stmt = (
        select(Content)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .where(Content.is_featured == True)
        .order_by(desc(Content.rating), desc(Content.view_count))
        .limit(limit)
    )
    result = await db.execute(stmt)
    items = result.scalars().all()
    return ResponseEnvelope(
        success=True,
        message=f"Fetched {len(items)} featured titles",
        data=[serialize_content(c) for c in items]
    )

@router.get("/search", response_model=ResponseEnvelope[ContentSearchResults])
async def search_and_filter_content(
    q: Optional[str] = Query(None, description="Keywords to match title, synopsis, or genres"),
    content_type: Optional[ContentType] = Query(None, description="MOVIE, SERIES, SONG, ALBUM, VIDEO, ANIME, PODCAST, AUDIOBOOK"),
    genre: Optional[str] = Query(None, description="Genre slug (e.g. sci-fi, action, lo-fi, thriller)"),
    platform: Optional[str] = Query(None, description="Streaming platform slug (e.g. netflix, prime-video, spotify, youtube)"),
    language: Optional[str] = Query(None, description="Language code (e.g. en, hi, te, ja)"),
    is_free: Optional[bool] = Query(None, description="Filter free-to-stream content"),
    is_featured: Optional[bool] = Query(None, description="Filter featured/spotlight content"),
    sort_by: str = Query("rating", description="rating, release_date, views, title"),
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Unified multi-platform search engine:
    Searches across 40+ platforms, genres, content types, and streaming availability.
    """
    stmt = select(Content).options(
        selectinload(Content.genres).selectinload(ContentGenre.genre),
        selectinload(Content.platforms).selectinload(ContentPlatform.platform)
    )

    # 1. Text Search Filter (Title, Description)
    if q and q.strip():
        search_kw = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                Content.title.ilike(search_kw),
                Content.description.ilike(search_kw),
                Content.slug.ilike(search_kw)
            )
        )

    # 2. Content Type Filter
    if content_type:
        stmt = stmt.where(Content.content_type == content_type)

    # 3. Genre Filter
    if genre and genre.strip():
        genre_slug = genre.strip().lower()
        stmt = stmt.join(Content.genres).join(ContentGenre.genre).where(
            or_(Genre.slug == genre_slug, Genre.name.ilike(f"%{genre_slug}%"))
        )

    # 4. Platform Filter
    if platform and platform.strip():
        plat_slug = platform.strip().lower()
        stmt = stmt.join(Content.platforms).join(ContentPlatform.platform).where(
            or_(Platform.slug == plat_slug, Platform.name.ilike(f"%{plat_slug}%"))
        )

    # 5. Language Filter
    if language and language.strip():
        stmt = stmt.where(Content.original_language.ilike(language.strip()))

    # 6. Free-to-stream Filter
    if is_free is not None:
        stmt = stmt.where(Content.is_free == is_free)

    # 7. Featured Filter
    if is_featured is not None:
        stmt = stmt.where(Content.is_featured == is_featured)

    # 8. Sorting Logic
    if sort_by == "release_date":
        stmt = stmt.order_by(desc(Content.release_date))
    elif sort_by == "views":
        stmt = stmt.order_by(desc(Content.view_count))
    elif sort_by == "title":
        stmt = stmt.order_by(asc(Content.title))
    else: # Default: rating
        stmt = stmt.order_by(desc(Content.rating), desc(Content.view_count))

    # Apply pagination
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    content_items = result.scalars().unique().all()

    items_data = [serialize_content(c) for c in content_items]

    return ResponseEnvelope(
        success=True,
        message=f"Found {len(items_data)} matching entertainment titles",
        data=ContentSearchResults(
            total=len(items_data),
            items=items_data,
            query=q,
            content_type=content_type.value if content_type else None,
            genre=genre,
            platform=platform,
            is_free_only=bool(is_free)
        )
    )

@router.get("/{id_or_slug}", response_model=ResponseEnvelope[ContentRead])
async def get_content_details(id_or_slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch single content details including all streaming platforms and official deep links."""
    stmt = (
        select(Content)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .where(or_(Content.id == id_or_slug, Content.slug == id_or_slug.lower()))
    )
    result = await db.execute(stmt)
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail=f"Content '{id_or_slug}' not found")

    # Increment view counter
    c.view_count += 1
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Content details fetched successfully",
        data=serialize_content(c)
    )

# --- Admin Operations for Content Catalog ---

@router.post("/", response_model=ResponseEnvelope[ContentRead], status_code=status.HTTP_201_CREATED)
async def admin_create_content(
    payload: ContentCreate,
    current_admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Add a new movie, series, song, anime, or podcast into the catalog."""
    slug = payload.slug or slugify(payload.title)

    # Check duplicate slug
    dup = await db.scalar(select(Content).where(Content.slug == slug))
    if dup:
        raise HTTPException(status_code=400, detail=f"Content with slug '{slug}' already exists")

    new_content = Content(
        title=payload.title,
        slug=slug,
        content_type=payload.content_type,
        description=payload.description,
        poster_url=payload.poster_url,
        backdrop_url=payload.backdrop_url,
        release_date=payload.release_date,
        duration_minutes=payload.duration_minutes,
        rating=payload.rating,
        maturity_rating=payload.maturity_rating,
        original_language=payload.original_language,
        is_featured=payload.is_featured,
        is_free=payload.is_free
    )
    db.add(new_content)
    await db.flush()

    # Link genres
    if payload.genre_slugs:
        for g_slug in payload.genre_slugs:
            genre = await db.scalar(select(Genre).where(Genre.slug == g_slug.lower()))
            if genre:
                db.add(ContentGenre(content_id=new_content.id, genre_id=genre.id))

    await db.commit()

    # Re-fetch with relationships loaded
    stmt = (
        select(Content)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .where(Content.id == new_content.id)
    )
    res = await db.execute(stmt)
    c = res.scalar_one()

    return ResponseEnvelope(
        success=True,
        message=f"Content '{c.title}' created successfully",
        data=serialize_content(c)
    )

@router.post("/{content_id}/platforms", response_model=ResponseEnvelope[ContentRead])
async def admin_link_content_platform(
    content_id: str,
    payload: ContentPlatformLinkCreate,
    current_admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint: Map a streaming platform and official deep link to a content item."""
    c = await db.scalar(select(Content).where(Content.id == content_id))
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")

    platform = await db.scalar(select(Platform).where(Platform.slug == payload.platform_slug.lower()))
    if not platform:
        raise HTTPException(status_code=404, detail=f"Platform '{payload.platform_slug}' not found")

    # Check if mapping already exists
    existing_link = await db.scalar(
        select(ContentPlatform).where(
            ContentPlatform.content_id == content_id,
            ContentPlatform.platform_id == platform.id
        )
    )
    if existing_link:
        existing_link.availability_type = payload.availability_type
        existing_link.pricing_details = payload.pricing_details
        existing_link.stream_url = payload.stream_url
    else:
        new_link = ContentPlatform(
            content_id=c.id,
            platform_id=platform.id,
            availability_type=payload.availability_type,
            pricing_details=payload.pricing_details,
            stream_url=payload.stream_url,
            region=payload.region
        )
        db.add(new_link)

    await db.commit()

    stmt = (
        select(Content)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .where(Content.id == content_id)
    )
    res = await db.execute(stmt)
    refreshed = res.scalar_one()

    return ResponseEnvelope(
        success=True,
        message=f"Linked '{platform.name}' to '{c.title}'",
        data=serialize_content(refreshed)
    )
