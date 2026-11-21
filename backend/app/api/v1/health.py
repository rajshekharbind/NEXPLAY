from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.db.session import get_db
from app.schemas.common import HealthResponse, ResponseEnvelope
from app.models.platform import Platform
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=ResponseEnvelope[HealthResponse])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint validating database connectivity and system status."""
    db_status = "HEALTHY"
    platforms_count = 0
    try:
        # Check basic query
        await db.execute(text("SELECT 1"))
        # Count platforms
        result = await db.execute(select(func.count(Platform.id)))
        platforms_count = result.scalar() or 0
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"

    health_info = HealthResponse(
        status="ONLINE" if "UNHEALTHY" not in db_status else "DEGRADED",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_status=db_status,
        platforms_loaded=platforms_count,
        timestamp=datetime.now(timezone.utc)
    )

    return ResponseEnvelope(
        success=True,
        message="NEXPLAY System Operational",
        data=health_info
    )
