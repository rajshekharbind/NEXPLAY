import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app as fastapi_app
from app.db.base import Base
from app.db.session import get_db
from app.db.seed_data import seed_database
from app import models as app_models

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_nexplay.db"
TEST_SYNC_DATABASE_URL = "sqlite:///./test_nexplay.db"

test_async_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingAsyncSessionLocal = async_sessionmaker(
    bind=test_async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

test_sync_engine = create_engine(TEST_SYNC_DATABASE_URL, echo=False)
TestingSyncSessionLocal = sessionmaker(bind=test_sync_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_sync_engine)
    Base.metadata.create_all(bind=test_sync_engine)
    with TestingSyncSessionLocal() as session:
        seed_database(session)
    yield
    Base.metadata.drop_all(bind=test_sync_engine)

@pytest_asyncio.fixture
async def async_client():
    async def override_get_db():
        async with TestingAsyncSessionLocal() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    fastapi_app.dependency_overrides.clear()
