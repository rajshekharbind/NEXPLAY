from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.v1 import api_router
from app.db.base import Base
from app.db.session import sync_engine, SyncSessionLocal
from app.models.platform import Platform
from app.db.seed_data import seed_database

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for database initialization and seed data loading."""
    logger.info("Initializing NEXPLAY Engine...")
    # Create tables if not present
    Base.metadata.create_all(bind=sync_engine)

    # Check and seed initial 40+ platforms and categories if empty
    with SyncSessionLocal() as session:
        count = session.execute(select(func.count(Platform.id))).scalar() or 0
        if count == 0:
            logger.info("Database is empty. Running initial 40+ entertainment platform seeding...")
            seed_database(session)
        else:
            logger.info(f"Database already contains {count} entertainment platforms.")

    yield
    logger.info("NEXPLAY Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Unified Entertainment Platform API — One account. Every entertainment destination.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "api_documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "platforms_directory": f"{settings.API_V1_STR}/platforms"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected internal server error occurred",
            "detail": str(exc) if settings.DEBUG else None
        }
    )
