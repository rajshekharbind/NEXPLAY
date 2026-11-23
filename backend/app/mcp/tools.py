import json
import uuid
from typing import Optional, List, Dict, Any, Callable, Awaitable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.models.content import Content, ContentType, Genre, ContentGenre, ContentPlatform, AvailabilityType
from app.models.platform import Platform, PlatformCategory
from app.models.watchlist import Watchlist, WatchlistItem, WatchlistStatus
from app.models.billing import SubscriptionPlan, CreditWallet
from app.models.user import User
from app.services.ai_service import PRESET_MOODS, get_ai_recommendations
from app.schemas.ai import AIRecommendRequest
from app.mcp.schemas import MCPToolDefinition, MCPToolResult, MCPContentItem
from app.core.logging import logger

# Registry of all MCP tool definitions and their execution handlers
MCP_TOOLS_REGISTRY: Dict[str, Dict[str, Any]] = {}

def register_mcp_tool(
    name: str,
    description: str,
    input_schema: Dict[str, Any]
):
    """Decorator to register an MCP tool with schema and handler."""
    def decorator(fn: Callable[[Dict[str, Any], Optional[AsyncSession]], Awaitable[MCPToolResult]]):
        MCP_TOOLS_REGISTRY[name] = {
            "definition": MCPToolDefinition(
                name=name,
                description=description,
                inputSchema=input_schema
            ),
            "handler": fn
        }
        return fn
    return decorator

def get_all_tool_definitions() -> List[MCPToolDefinition]:
    """Return all registered MCP tool definitions for tools/list."""
    return [item["definition"] for item in MCP_TOOLS_REGISTRY.values()]

async def execute_mcp_tool(name: str, arguments: Dict[str, Any], db: Optional[AsyncSession] = None) -> MCPToolResult:
    """Execute a registered MCP tool by name."""
    tool_entry = MCP_TOOLS_REGISTRY.get(name)
    if not tool_entry:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"Error: Tool '{name}' is not registered.")],
            isError=True
        )

    handler = tool_entry["handler"]
    if db is not None:
        return await handler(arguments, db)
    else:
        async with AsyncSessionLocal() as session:
            return await handler(arguments, session)

# ==============================================================================
# TOOL 1: nexplay_search_catalog
# ==============================================================================
@register_mcp_tool(
    name="nexplay_search_catalog",
    description="Search across 40+ entertainment platforms for movies, series, songs, anime, podcasts, and videos.",
    input_schema={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search keyword, title, creator or actor name"},
            "content_type": {"type": "string", "enum": ["MOVIE", "SERIES", "SONG", "ALBUM", "PODCAST", "VIDEO", "ANIME"], "description": "Optional category filter"},
            "genre": {"type": "string", "description": "Optional genre slug (e.g. sci-fi, action, lo-fi, thriller)"},
            "platform": {"type": "string", "description": "Platform slug filter (e.g. netflix, prime-video, spotify, crunchyroll)"},
            "is_free_only": {"type": "boolean", "description": "Filter strictly for free or ad-supported content without subscription"},
            "limit": {"type": "integer", "description": "Maximum number of results to return (1-20)", "default": 8}
        },
        "required": ["query"]
    }
)
async def tool_search_catalog(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    query = args.get("query", "").strip()
    content_type_str = args.get("content_type")
    genre_slug = args.get("genre")
    platform_slug = args.get("platform")
    is_free_only = args.get("is_free_only", False)
    limit = min(int(args.get("limit", 8)), 20)

    stmt = (
        select(Content)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
    )

    if query:
        pattern = f"%{query}%"
        stmt = stmt.where(or_(Content.title.ilike(pattern), Content.description.ilike(pattern)))

    if content_type_str:
        try:
            c_type = ContentType(content_type_str.upper())
            stmt = stmt.where(Content.content_type == c_type)
        except ValueError:
            pass

    if is_free_only:
        stmt = stmt.where(Content.is_free == True)

    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    items = res.scalars().all()

    # In-memory filter for genre or platform
    results = []
    for item in items:
        genres = [cg.genre.slug for cg in item.genres if cg.genre]
        streaming = [
            {
                "platform": cp.platform.name,
                "platform_slug": cp.platform.slug,
                "availability": cp.availability_type.value,
                "pricing": cp.pricing_details,
                "stream_url": cp.stream_url
            }
            for cp in item.platforms if cp.platform
        ]
        if genre_slug and genre_slug.lower() not in genres:
            continue
        if platform_slug and platform_slug.lower() not in [s["platform_slug"] for s in streaming]:
            continue

        results.append({
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "type": item.content_type.value,
            "rating": item.rating,
            "duration_minutes": item.duration_minutes,
            "genres": [cg.genre.name for cg in item.genres if cg.genre],
            "streaming_options": streaming,
            "is_free": item.is_free
        })

    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps({"total_matches": len(results), "results": results}, indent=2))],
        metadata={"total": len(results)}
    )

# ==============================================================================
# TOOL 2: nexplay_get_content_details
# ==============================================================================
@register_mcp_tool(
    name="nexplay_get_content_details",
    description="Retrieve comprehensive title details, synopsis, duration, genres, ratings, and official verified streaming deep links.",
    input_schema={
        "type": "object",
        "properties": {
            "slug_or_id": {"type": "string", "description": "The title slug (e.g. 'inception', 'demon-slayer') or UUID"}
        },
        "required": ["slug_or_id"]
    }
)
async def tool_get_content_details(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    identifier = args.get("slug_or_id", "").strip()
    stmt = (
        select(Content)
        .where(or_(Content.slug == identifier, Content.id == identifier, Content.title.ilike(identifier)))
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()

    if not item:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"Content title '{identifier}' not found in catalog.")],
            isError=True
        )

    data = {
        "id": item.id,
        "title": item.title,
        "slug": item.slug,
        "content_type": item.content_type.value,
        "description": item.description,
        "rating": item.rating,
        "duration_minutes": item.duration_minutes,
        "release_date": item.release_date,
        "maturity_rating": item.maturity_rating,
        "original_language": item.original_language,
        "is_free": item.is_free,
        "genres": [cg.genre.name for cg in item.genres if cg.genre],
        "streaming_options": [
            {
                "platform_name": cp.platform.name,
                "platform_slug": cp.platform.slug,
                "availability": cp.availability_type.value,
                "pricing": cp.pricing_details,
                "stream_url": cp.stream_url
            }
            for cp in item.platforms if cp.platform
        ]
    }
    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps(data, indent=2))]
    )

# ==============================================================================
# TOOL 3: nexplay_list_platforms
# ==============================================================================
@register_mcp_tool(
    name="nexplay_list_platforms",
    description="List and filter 40+ supported entertainment services across OTT, Music, Video, Anime, Audiobooks, and Personal Media.",
    input_schema={
        "type": "object",
        "properties": {
            "category": {"type": "string", "enum": ["ott", "music", "video", "anime", "podcasts-audio", "personal-media"], "description": "Category slug filter"},
            "pricing_type": {"type": "string", "enum": ["FREE", "PAID", "FREEMIUM", "SUBSCRIPTION"], "description": "Pricing model filter"}
        }
    }
)
async def tool_list_platforms(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    category_slug = args.get("category")
    pricing_type = args.get("pricing_type")

    stmt = select(Platform).options(selectinload(Platform.category)).where(Platform.is_active == True)
    if pricing_type:
        stmt = stmt.where(Platform.pricing_type == pricing_type)

    stmt = stmt.order_by(desc(Platform.display_priority))
    res = await db.execute(stmt)
    platforms = res.scalars().all()

    out = []
    for p in platforms:
        if category_slug and (not p.category or p.category.slug != category_slug):
            continue
        out.append({
            "name": p.name,
            "slug": p.slug,
            "category": p.category.name if p.category else "Other",
            "category_slug": p.category.slug if p.category else "other",
            "pricing_type": p.pricing_type.value,
            "integration_type": p.integration_type.value,
            "official_url": p.official_url,
            "supported_features": p.supported_features
        })

    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps({"total_platforms": len(out), "platforms": out}, indent=2))],
        metadata={"total": len(out)}
    )

# ==============================================================================
# TOOL 4: nexplay_get_platform_details
# ==============================================================================
@register_mcp_tool(
    name="nexplay_get_platform_details",
    description="Get specific streaming platform metadata, integration tier, active status, and number of catalog titles hosted.",
    input_schema={
        "type": "object",
        "properties": {
            "platform_slug": {"type": "string", "description": "Platform slug (e.g. 'netflix', 'prime-video', 'spotify', 'crunchyroll')"}
        },
        "required": ["platform_slug"]
    }
)
async def tool_get_platform_details(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    slug = args.get("platform_slug", "").strip().lower()
    stmt = (
        select(Platform)
        .where(Platform.slug == slug)
        .options(selectinload(Platform.category), selectinload(Platform.content_links))
    )
    res = await db.execute(stmt)
    platform = res.scalar_one_or_none()

    if not platform:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"Platform '{slug}' not found.")],
            isError=True
        )

    data = {
        "name": platform.name,
        "slug": platform.slug,
        "category": platform.category.name if platform.category else None,
        "description": platform.description,
        "official_url": platform.official_url,
        "pricing_type": platform.pricing_type.value,
        "integration_type": platform.integration_type.value,
        "supported_features": platform.supported_features,
        "is_active": platform.is_active,
        "total_catalog_links": len(platform.content_links)
    }
    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps(data, indent=2))]
    )

# ==============================================================================
# TOOL 5: nexplay_ai_recommend
# ==============================================================================
@register_mcp_tool(
    name="nexplay_ai_recommend",
    description="Generate personalized entertainment recommendations using natural language prompt, mood, runtime, and platform criteria.",
    input_schema={
        "type": "object",
        "properties": {
            "prompt": {"type": "string", "description": "Natural language query (e.g. 'high-stakes sci-fi under 2 hours', 'chill lo-fi beats')"},
            "mood": {"type": "string", "enum": ["mind-bending", "adrenaline", "chill", "anime-epic", "deep-focus", "binge-worthy"], "description": "Optional preset mood"},
            "max_runtime_minutes": {"type": "integer", "description": "Maximum allowed runtime in minutes"},
            "preferred_platform": {"type": "string", "description": "Target platform slug (e.g. 'netflix', 'prime-video', 'spotify')"},
            "limit": {"type": "integer", "description": "Number of recommendations to return (1-10)", "default": 4}
        },
        "required": ["prompt"]
    }
)
async def tool_ai_recommend(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    prompt = args.get("prompt", "")
    mood = args.get("mood")
    max_runtime = args.get("max_runtime_minutes")
    preferred_platform = args.get("preferred_platform")
    limit = min(int(args.get("limit", 4)), 10)

    req = AIRecommendRequest(
        query=prompt,
        mood=mood,
        max_runtime=max_runtime,
        platform_slug=preferred_platform,
        limit=limit
    )
    rec_res = await get_ai_recommendations(db, req, user=None)

    picks = []
    for r in rec_res.recommendations:
        picks.append({
            "title": r.title,
            "type": r.content_type,
            "match_score": f"{r.match_score}%",
            "rating": r.rating,
            "duration_minutes": r.duration_minutes,
            "genres": r.genres,
            "reasoning": r.reasoning,
            "streaming_options": [
                {"platform": opt.platform_name, "url": opt.stream_url, "pricing": opt.pricing_details}
                for opt in r.streaming_options
            ]
        })

    out = {
        "query": prompt,
        "detected_mood": rec_res.detected_mood,
        "total_picks": len(picks),
        "recommendations": picks
    }
    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps(out, indent=2))]
    )

# ==============================================================================
# TOOL 6: nexplay_get_mood_presets
# ==============================================================================
@register_mcp_tool(
    name="nexplay_get_mood_presets",
    description="List all available entertainment vibe and mood presets with description and sample prompts.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
async def tool_get_mood_presets(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    moods = [
        {
            "id": m.id,
            "name": m.name,
            "description": m.description,
            "sample_prompt": m.sample_prompt,
            "suggested_genres": m.suggested_genres
        }
        for m in PRESET_MOODS
    ]
    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps({"mood_presets": moods}, indent=2))]
    )

# ==============================================================================
# TOOL 7: nexplay_get_featured_spotlight
# ==============================================================================
@register_mcp_tool(
    name="nexplay_get_featured_spotlight",
    description="Fetch the spotlight hero content titles currently featured across all 6 entertainment categories.",
    input_schema={
        "type": "object",
        "properties": {
            "limit": {"type": "integer", "description": "Number of featured titles to return (1-10)", "default": 5}
        }
    }
)
async def tool_get_featured_spotlight(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    limit = min(int(args.get("limit", 5)), 10)
    stmt = (
        select(Content)
        .where(Content.is_featured == True)
        .options(
            selectinload(Content.genres).selectinload(ContentGenre.genre),
            selectinload(Content.platforms).selectinload(ContentPlatform.platform)
        )
        .order_by(desc(Content.rating))
        .limit(limit)
    )
    res = await db.execute(stmt)
    items = res.scalars().all()

    featured = []
    for c in items:
        featured.append({
            "title": c.title,
            "type": c.content_type.value,
            "rating": c.rating,
            "duration_minutes": c.duration_minutes,
            "description": c.description,
            "genres": [cg.genre.name for cg in c.genres if cg.genre],
            "streaming_on": [cp.platform.name for cp in c.platforms if cp.platform]
        })

    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps({"featured_spotlight": featured}, indent=2))]
    )

# ==============================================================================
# TOOL 8: nexplay_manage_watchlist
# ==============================================================================
@register_mcp_tool(
    name="nexplay_manage_watchlist",
    description="Manage private watchlists: view saved queue, add title, remove title, or update watch status.",
    input_schema={
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["list", "add", "remove", "update_status"], "description": "Watchlist action"},
            "user_email": {"type": "string", "description": "User email identifier (default: current user / admin)"},
            "content_slug_or_id": {"type": "string", "description": "Content title slug or ID (required for add/remove/update)"},
            "status": {"type": "string", "enum": ["PLANNED", "WATCHING", "COMPLETED", "DROPPED"], "description": "Watch status"},
            "notes": {"type": "string", "description": "Personal note"}
        },
        "required": ["action"]
    }
)
async def tool_manage_watchlist(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    action = args.get("action", "list").lower()
    user_email = args.get("user_email") or "admin@nexplay.com"
    content_slug = args.get("content_slug_or_id")

    user_stmt = select(User).where(User.email == user_email)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if not user:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"User '{user_email}' not found.")],
            isError=True
        )

    # Get user default watchlist
    wl_stmt = (
        select(Watchlist)
        .where(and_(Watchlist.user_id == user.id, Watchlist.is_default == True))
        .options(
            selectinload(Watchlist.items).selectinload(WatchlistItem.content)
        )
    )
    wl_res = await db.execute(wl_stmt)
    watchlist = wl_res.scalar_one_or_none()

    if not watchlist:
        watchlist = Watchlist(id=str(uuid.uuid4()), user_id=user.id, name="My Watchlist", is_default=True)
        db.add(watchlist)
        await db.commit()
        await db.refresh(watchlist)

    if action == "list":
        items = [
            {
                "item_id": it.id,
                "title": it.content.title if it.content else "Unknown",
                "content_type": it.content.content_type.value if it.content else "MOVIE",
                "status": it.status.value,
                "rating": it.personal_rating,
                "notes": it.notes
            }
            for it in (watchlist.items or [])
        ]
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=json.dumps({"watchlist": watchlist.name, "total_items": len(items), "items": items}, indent=2))]
        )

    # For add/remove/update, resolve content
    if not content_slug:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text="Error: 'content_slug_or_id' is required for action: " + action)],
            isError=True
        )

    c_stmt = select(Content).where(or_(Content.slug == content_slug, Content.id == content_slug, Content.title.ilike(content_slug)))
    c_res = await db.execute(c_stmt)
    content = c_res.scalar_one_or_none()
    if not content:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"Content '{content_slug}' not found in catalog.")],
            isError=True
        )

    existing_item = next((it for it in (watchlist.items or []) if it.content_id == content.id), None)

    if action == "add":
        if existing_item:
            return MCPToolResult(
                content=[MCPContentItem(type="text", text=f"'{content.title}' is already in watchlist with status: {existing_item.status.value}.")]
            )
        new_item = WatchlistItem(
            id=str(uuid.uuid4()),
            watchlist_id=watchlist.id,
            content_id=content.id,
            status=WatchlistStatus.PLANNED,
            notes=args.get("notes")
        )
        db.add(new_item)
        await db.commit()
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"Successfully added '{content.title}' to watchlist.")]
        )

    elif action == "remove":
        if not existing_item:
            return MCPToolResult(
                content=[MCPContentItem(type="text", text=f"'{content.title}' was not found in watchlist.")]
            )
        await db.delete(existing_item)
        await db.commit()
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"Successfully removed '{content.title}' from watchlist.")]
        )

    elif action == "update_status":
        if not existing_item:
            return MCPToolResult(
                content=[MCPContentItem(type="text", text=f"'{content.title}' is not in watchlist. Add it first.")],
                isError=True
            )
        new_status = args.get("status", "COMPLETED").upper()
        try:
            existing_item.status = WatchlistStatus(new_status)
            if args.get("notes"):
                existing_item.notes = args.get("notes")
            await db.commit()
            return MCPToolResult(
                content=[MCPContentItem(type="text", text=f"Updated status of '{content.title}' to {new_status}.")]
            )
        except ValueError:
            return MCPToolResult(
                content=[MCPContentItem(type="text", text=f"Invalid status '{new_status}'. Use PLANNED, WATCHING, COMPLETED, or DROPPED.")],
                isError=True
            )

    return MCPToolResult(content=[MCPContentItem(type="text", text="Unsupported action")], isError=True)

# ==============================================================================
# TOOL 9: nexplay_check_availability
# ==============================================================================
@register_mcp_tool(
    name="nexplay_check_availability",
    description="Fast platform check: discover where a title is streaming, pricing (Free, Subscription, Rent), and official deep links.",
    input_schema={
        "type": "object",
        "properties": {
            "title_or_slug": {"type": "string", "description": "Title name or slug (e.g. 'Inception', 'Demon Slayer', 'Interstellar')"}
        },
        "required": ["title_or_slug"]
    }
)
async def tool_check_availability(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    query = args.get("title_or_slug", "").strip()
    stmt = (
        select(Content)
        .where(or_(Content.slug == query.lower(), Content.title.ilike(f"%{query}%")))
        .options(selectinload(Content.platforms).selectinload(ContentPlatform.platform))
    )
    res = await db.execute(stmt)
    content = res.scalar_one_or_none()

    if not content:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"No title matching '{query}' found.")],
            isError=True
        )

    availability = [
        {
            "platform": cp.platform.name,
            "slug": cp.platform.slug,
            "type": cp.availability_type.value,
            "pricing": cp.pricing_details,
            "direct_stream_url": cp.stream_url
        }
        for cp in content.platforms if cp.platform
    ]

    out = {
        "title": content.title,
        "content_type": content.content_type.value,
        "is_free": content.is_free,
        "available_platforms_count": len(availability),
        "streaming_destinations": availability
    }
    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps(out, indent=2))]
    )

# ==============================================================================
# TOOL 10: nexplay_get_subscription_plans
# ==============================================================================
@register_mcp_tool(
    name="nexplay_get_subscription_plans",
    description="Retrieve all NEXPLAY membership plans, monthly prices in INR, AI credit allowances, and feature matrices.",
    input_schema={
        "type": "object",
        "properties": {}
    }
)
async def tool_get_subscription_plans(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    stmt = select(SubscriptionPlan).where(SubscriptionPlan.is_active == True).order_by(SubscriptionPlan.price_inr)
    res = await db.execute(stmt)
    plans = res.scalars().all()

    plan_list = [
        {
            "name": p.name,
            "slug": p.slug,
            "price_inr": f"₹{int(p.price_inr)}/mo",
            "credit_allowance": p.credit_allowance,
            "features": p.features
        }
        for p in plans
    ]
    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps({"plans": plan_list}, indent=2))]
    )

# ==============================================================================
# TOOL 11: nexplay_check_wallet_balance
# ==============================================================================
@register_mcp_tool(
    name="nexplay_check_wallet_balance",
    description="Check user's active AI credit balance, lifetime usage, and remaining allowance.",
    input_schema={
        "type": "object",
        "properties": {
            "user_email": {"type": "string", "description": "User email address (defaults to admin user)"}
        }
    }
)
async def tool_check_wallet_balance(args: Dict[str, Any], db: AsyncSession) -> MCPToolResult:
    email = args.get("user_email") or "admin@nexplay.com"
    stmt = select(User).where(User.email == email).options(selectinload(User.wallet))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        return MCPToolResult(
            content=[MCPContentItem(type="text", text=f"User with email '{email}' not found.")],
            isError=True
        )

    wallet = user.wallet
    data = {
        "user_email": user.email,
        "balance_credits": wallet.balance_credits if wallet else 100,
        "lifetime_earned": wallet.lifetime_earned if wallet else 100,
        "lifetime_spent": wallet.lifetime_spent if wallet else 0,
        "status": "HEALTHY"
    }
    return MCPToolResult(
        content=[MCPContentItem(type="text", text=json.dumps(data, indent=2))]
    )
