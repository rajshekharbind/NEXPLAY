from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.platforms import router as platforms_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.billing import router as billing_router
from app.api.v1.admin import router as admin_router
from app.api.v1.content import router as content_router
from app.api.v1.watchlist import router as watchlist_router
from app.api.v1.ai import router as ai_router
from app.api.v1.mcp import router as mcp_router
from app.api.v1.automation import router as automation_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="", tags=["System Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & Security"])
api_router.include_router(users_router, prefix="/users", tags=["Users & Profiles"])
api_router.include_router(platforms_router, prefix="/platforms", tags=["Entertainment Platforms"])
api_router.include_router(billing_router, prefix="/billing", tags=["Subscriptions & Billing"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin & Platform Management"])
api_router.include_router(content_router, prefix="/content", tags=["Content Catalog & Search Engine"])
api_router.include_router(watchlist_router, prefix="/watchlists", tags=["User Watchlists & Activity"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI Entertainment Copilot & Recommendations"])
api_router.include_router(mcp_router, prefix="/mcp", tags=["Model Context Protocol (MCP) Server"])
api_router.include_router(automation_router, prefix="/automation", tags=["Automation, Background Workers & Link Health"])
