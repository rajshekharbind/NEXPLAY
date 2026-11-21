import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "NEXPLAY"
    assert data["status"] == "OPERATIONAL"

@pytest.mark.asyncio
async def test_health_check_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["status"] == "ONLINE"
    assert data["database_status"] == "HEALTHY"
    # Over 40 platforms seeded
    assert data["platforms_loaded"] >= 40

@pytest.mark.asyncio
async def test_list_platform_categories(async_client: AsyncClient):
    response = await async_client.get("/api/v1/platforms/categories")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    categories = res["data"]
    assert len(categories) == 6
    category_slugs = [c["slug"] for c in categories]
    assert "ott" in category_slugs
    assert "music" in category_slugs
    assert "video" in category_slugs
    assert "anime" in category_slugs
    assert "podcasts-audio" in category_slugs
    assert "personal-media" in category_slugs

@pytest.mark.asyncio
async def test_list_platforms_and_filter(async_client: AsyncClient):
    # Fetch all
    response = await async_client.get("/api/v1/platforms/")
    assert response.status_code == 200
    platforms = response.json()["data"]
    assert len(platforms) >= 40

    # Filter by category = music
    response_music = await async_client.get("/api/v1/platforms/?category=music")
    assert response_music.status_code == 200
    music_platforms = response_music.json()["data"]
    assert len(music_platforms) >= 8
    names = [p["name"] for p in music_platforms]
    assert "Spotify" in names
    assert "Apple Music" in names

    # Filter by search
    response_search = await async_client.get("/api/v1/platforms/?search=netflix")
    assert response_search.status_code == 200
    search_results = response_search.json()["data"]
    assert len(search_results) == 1
    assert search_results[0]["name"] == "Netflix"
    assert search_results[0]["official_url"] == "https://www.netflix.com"
