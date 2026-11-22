from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.platform import Platform, PlatformCategory, PlatformPricingType, PlatformIntegrationType
from app.schemas.platform import PlatformRead, PlatformCategoryRead
from app.schemas.common import ResponseEnvelope

router = APIRouter()

@router.get("/categories", response_model=ResponseEnvelope[List[PlatformCategoryRead]])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Return all platform categories (OTT, Music, Video, Anime, etc.)."""
    stmt = select(PlatformCategory).order_by(PlatformCategory.display_order.asc())
    result = await db.execute(stmt)
    categories = result.scalars().all()
    return ResponseEnvelope(
        success=True,
        message="Platform categories fetched successfully",
        data=[PlatformCategoryRead.model_validate(c) for c in categories]
    )

@router.get("/", response_model=ResponseEnvelope[List[PlatformRead]])
async def list_platforms(
    category: Optional[str] = Query(None, description="Category slug (e.g. ott, music, anime)"),
    pricing: Optional[PlatformPricingType] = Query(None, description="Pricing type (FREE, PAID, SUBSCRIPTION)"),
    integration: Optional[PlatformIntegrationType] = Query(None, description="Integration type"),
    search: Optional[str] = Query(None, description="Search platform name or description"),
    db: AsyncSession = Depends(get_db)
):
    """List 40+ entertainment platforms with rich filtering and category metadata."""
    stmt = select(Platform).options(selectinload(Platform.category)).where(Platform.is_active == True)

    if category:
        stmt = stmt.join(Platform.category).where(PlatformCategory.slug == category.lower())

    if pricing:
        stmt = stmt.where(Platform.pricing_type == pricing)

    if integration:
        stmt = stmt.where(Platform.integration_type == integration)

    if search:
        search_pattern = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                Platform.name.ilike(search_pattern),
                Platform.description.ilike(search_pattern)
            )
        )

    stmt = stmt.order_by(Platform.display_priority.desc(), Platform.name.asc())
    result = await db.execute(stmt)
    platforms = result.scalars().all()

    data = []
    for p in platforms:
        p_read = PlatformRead(
            id=p.id,
            category_id=p.category_id,
            name=p.name,
            slug=p.slug,
            logo_url=p.logo_url,
            banner_url=p.banner_url,
            official_url=p.official_url,
            description=p.description,
            pricing_type=p.pricing_type,
            integration_type=p.integration_type,
            supported_features=p.supported_features or {},
            is_active=p.is_active,
            region_availability=p.region_availability or ["IN"],
            display_priority=p.display_priority,
            category_name=p.category.name if p.category else None
        )
        data.append(p_read)

    return ResponseEnvelope(
        success=True,
        message=f"Found {len(data)} entertainment platforms",
        data=data
    )

@router.get("/{slug}", response_model=ResponseEnvelope[PlatformRead])
async def get_platform(slug: str, db: AsyncSession = Depends(get_db)):
    """Retrieve details for a single entertainment platform by slug."""
    stmt = select(Platform).options(selectinload(Platform.category)).where(Platform.slug == slug.lower())
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail=f"Platform '{slug}' not found")

    p_read = PlatformRead(
        id=p.id,
        category_id=p.category_id,
        name=p.name,
        slug=p.slug,
        logo_url=p.logo_url,
        banner_url=p.banner_url,
        official_url=p.official_url,
        description=p.description,
        pricing_type=p.pricing_type,
        integration_type=p.integration_type,
        supported_features=p.supported_features or {},
        is_active=p.is_active,
        region_availability=p.region_availability or ["IN"],
        display_priority=p.display_priority,
        category_name=p.category.name if p.category else None
    )

    return ResponseEnvelope(
        success=True,
        message="Platform retrieved successfully",
        data=p_read
    )
