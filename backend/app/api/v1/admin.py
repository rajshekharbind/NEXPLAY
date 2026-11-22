import re
import time
from datetime import datetime
from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, delete
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.platform import (
    Platform,
    PlatformCategory,
    PlatformIntegration,
    PlatformPricingType,
    PlatformIntegrationType
)
from app.schemas.platform import (
    PlatformRead,
    PlatformCreate,
    PlatformUpdate,
    PlatformCategoryRead,
    PlatformCategoryCreate,
    PlatformCategoryUpdate,
    PlatformHealthCheckResult,
    AdminStatsRead
)
from app.schemas.common import ResponseEnvelope
from app.api.deps import require_roles

router = APIRouter(
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN]))]
)

def slugify(text: str) -> str:
    """Generate a clean URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)

@router.get("/stats", response_model=ResponseEnvelope[AdminStatsRead])
async def get_admin_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Fetch high-level administrative platform & user metrics."""
    # Total & active platforms
    plat_total = await db.scalar(select(func.count(Platform.id))) or 0
    plat_active = await db.scalar(select(func.count(Platform.id)).where(Platform.is_active == True)) or 0
    cat_total = await db.scalar(select(func.count(PlatformCategory.id))) or 0

    # Total users & premium users
    user_total = await db.scalar(select(func.count(User.id))) or 0
    user_prem = await db.scalar(
        select(func.count(User.id)).where(
            User.role.in_([UserRole.PREMIUM_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])
        )
    ) or 0

    # Platforms by category
    cats_res = await db.execute(select(PlatformCategory).options(selectinload(PlatformCategory.platforms)))
    categories = cats_res.scalars().all()
    by_category = {c.name: len(c.platforms) for c in categories}

    # Platforms by pricing type
    pricing_res = await db.execute(
        select(Platform.pricing_type, func.count(Platform.id)).group_by(Platform.pricing_type)
    )
    by_pricing = {row[0].value if hasattr(row[0], "value") else str(row[0]): row[1] for row in pricing_res.all()}

    return ResponseEnvelope(
        success=True,
        message="Admin statistics fetched",
        data=AdminStatsRead(
            total_platforms=plat_total,
            active_platforms=plat_active,
            total_categories=cat_total,
            platforms_by_category=by_category,
            platforms_by_pricing=by_pricing,
            total_users=user_total,
            premium_users=user_prem
        )
    )

@router.get("/platforms", response_model=ResponseEnvelope[List[PlatformRead]])
async def admin_list_platforms(
    category_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Admin directory listing including both active and deactivated platforms."""
    stmt = select(Platform).options(selectinload(Platform.category))

    if category_id:
        stmt = stmt.where(Platform.category_id == category_id)

    if is_active is not None:
        stmt = stmt.where(Platform.is_active == is_active)

    if search:
        search_pattern = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                Platform.name.ilike(search_pattern),
                Platform.description.ilike(search_pattern),
                Platform.slug.ilike(search_pattern)
            )
        )

    stmt = stmt.order_by(Platform.display_priority.desc(), Platform.name.asc())
    result = await db.execute(stmt)
    platforms = result.scalars().all()

    data = [
        PlatformRead(
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
            region_availability=p.region_availability or ["IN", "GLOBAL"],
            display_priority=p.display_priority,
            category_name=p.category.name if p.category else None
        )
        for p in platforms
    ]

    return ResponseEnvelope(
        success=True,
        message=f"Found {len(data)} platforms in admin registry",
        data=data
    )

@router.post("/platforms", response_model=ResponseEnvelope[PlatformRead], status_code=status.HTTP_201_CREATED)
async def admin_create_platform(
    payload: PlatformCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a new entertainment platform to NEXPLAY."""
    # Verify category exists
    cat_res = await db.execute(select(PlatformCategory).where(PlatformCategory.id == payload.category_id))
    category = cat_res.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=400, detail=f"Category with id '{payload.category_id}' does not exist")

    slug = payload.slug or slugify(payload.name)

    # Check for duplicate name or slug
    dup_res = await db.execute(
        select(Platform).where(or_(Platform.name == payload.name, Platform.slug == slug))
    )
    if dup_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Platform with name '{payload.name}' or slug '{slug}' already exists")

    new_platform = Platform(
        category_id=payload.category_id,
        name=payload.name,
        slug=slug,
        logo_url=payload.logo_url,
        banner_url=payload.banner_url,
        official_url=payload.official_url,
        description=payload.description,
        pricing_type=payload.pricing_type,
        integration_type=payload.integration_type,
        supported_features=payload.supported_features or {},
        is_active=payload.is_active,
        region_availability=payload.region_availability or ["IN", "GLOBAL"],
        display_priority=payload.display_priority
    )
    db.add(new_platform)
    await db.flush()

    # Create default integration record
    integration = PlatformIntegration(
        platform_id=new_platform.id,
        api_endpoint=payload.official_url,
        auth_type=payload.integration_type.value,
        status_health="OPERATIONAL",
        last_checked_at=datetime.utcnow().isoformat()
    )
    db.add(integration)

    await db.commit()
    await db.refresh(new_platform)

    # Re-fetch with category loaded
    res = await db.execute(
        select(Platform).options(selectinload(Platform.category)).where(Platform.id == new_platform.id)
    )
    p = res.scalar_one()

    return ResponseEnvelope(
        success=True,
        message=f"Platform '{p.name}' created successfully",
        data=PlatformRead(
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
            region_availability=p.region_availability or ["IN", "GLOBAL"],
            display_priority=p.display_priority,
            category_name=p.category.name if p.category else None
        )
    )

@router.get("/platforms/{platform_id}", response_model=ResponseEnvelope[PlatformRead])
async def admin_get_platform(platform_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch single platform details by ID."""
    stmt = select(Platform).options(selectinload(Platform.category)).where(Platform.id == platform_id)
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Platform not found")

    return ResponseEnvelope(
        success=True,
        message="Platform details fetched",
        data=PlatformRead(
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
            region_availability=p.region_availability or ["IN", "GLOBAL"],
            display_priority=p.display_priority,
            category_name=p.category.name if p.category else None
        )
    )

@router.put("/platforms/{platform_id}", response_model=ResponseEnvelope[PlatformRead])
async def admin_update_platform(
    platform_id: str,
    payload: PlatformUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update platform metadata, URL, priority, or active status."""
    stmt = select(Platform).options(selectinload(Platform.category)).where(Platform.id == platform_id)
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Platform not found")

    if payload.name is not None:
        p.name = payload.name
    if payload.category_id is not None:
        p.category_id = payload.category_id
    if payload.slug is not None:
        p.slug = payload.slug
    if payload.logo_url is not None:
        p.logo_url = payload.logo_url
    if payload.banner_url is not None:
        p.banner_url = payload.banner_url
    if payload.official_url is not None:
        p.official_url = payload.official_url
    if payload.description is not None:
        p.description = payload.description
    if payload.pricing_type is not None:
        p.pricing_type = payload.pricing_type
    if payload.integration_type is not None:
        p.integration_type = payload.integration_type
    if payload.supported_features is not None:
        p.supported_features = payload.supported_features
    if payload.is_active is not None:
        p.is_active = payload.is_active
    if payload.region_availability is not None:
        p.region_availability = payload.region_availability
    if payload.display_priority is not None:
        p.display_priority = payload.display_priority

    await db.commit()
    await db.refresh(p)

    return ResponseEnvelope(
        success=True,
        message=f"Platform '{p.name}' updated successfully",
        data=PlatformRead(
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
            region_availability=p.region_availability or ["IN", "GLOBAL"],
            display_priority=p.display_priority,
            category_name=p.category.name if p.category else None
        )
    )

@router.delete("/platforms/{platform_id}", response_model=ResponseEnvelope[dict])
async def admin_delete_platform(
    platform_id: str,
    permanent: bool = Query(False, description="If true, permanently remove record; otherwise soft-deactivate"),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate or permanently remove an entertainment platform."""
    stmt = select(Platform).where(Platform.id == platform_id)
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Platform not found")

    platform_name = p.name
    if permanent:
        await db.delete(p)
        action_msg = f"Platform '{platform_name}' permanently deleted"
    else:
        p.is_active = False
        action_msg = f"Platform '{platform_name}' deactivated successfully"

    await db.commit()

    return ResponseEnvelope(
        success=True,
        message=action_msg,
        data={"platform_id": platform_id, "permanent": permanent}
    )

@router.post("/platforms/{platform_id}/health-check", response_model=ResponseEnvelope[PlatformHealthCheckResult])
async def admin_check_platform_health(
    platform_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Probe the platform's official URL to verify availability and response latency."""
    stmt = select(Platform).where(Platform.id == platform_id)
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Platform not found")

    start_time = time.perf_counter()
    status_str = "OPERATIONAL"
    status_code = None
    response_time_ms = None

    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            resp = await client.head(p.official_url, headers={"User-Agent": "NEXPLAY-HealthCheck/1.0"})
            response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            status_code = resp.status_code
            if resp.status_code >= 400:
                status_str = "DEGRADED"
    except Exception:
        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        status_str = "OFFLINE"

    now_str = datetime.utcnow().isoformat()

    # Update or create platform integration record
    int_res = await db.execute(select(PlatformIntegration).where(PlatformIntegration.platform_id == p.id))
    integration = int_res.scalars().first()
    if not integration:
        integration = PlatformIntegration(
            platform_id=p.id,
            api_endpoint=p.official_url,
            auth_type=p.integration_type.value,
            status_health=status_str,
            last_checked_at=now_str
        )
        db.add(integration)
    else:
        integration.status_health = status_str
        integration.last_checked_at = now_str

    await db.commit()

    return ResponseEnvelope(
        success=True,
        message=f"Health probe for '{p.name}' completed with status: {status_str}",
        data=PlatformHealthCheckResult(
            platform_id=p.id,
            platform_name=p.name,
            official_url=p.official_url,
            status=status_str,
            status_code=status_code,
            response_time_ms=response_time_ms,
            last_checked_at=now_str
        )
    )

@router.post("/categories", response_model=ResponseEnvelope[PlatformCategoryRead], status_code=status.HTTP_201_CREATED)
async def admin_create_category(
    payload: PlatformCategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a new platform category."""
    slug = payload.slug or slugify(payload.name)
    existing = await db.scalar(select(PlatformCategory).where(PlatformCategory.slug == slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Category '{slug}' already exists")

    cat = PlatformCategory(
        name=payload.name,
        slug=slug,
        description=payload.description,
        icon=payload.icon,
        display_order=payload.display_order
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)

    return ResponseEnvelope(
        success=True,
        message=f"Category '{cat.name}' created successfully",
        data=PlatformCategoryRead.model_validate(cat)
    )
