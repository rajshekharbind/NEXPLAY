import pytest
from httpx import AsyncClient
from app.models.user import User, UserRole

@pytest.mark.asyncio
async def test_unified_content_catalog_and_search_engine(async_client: AsyncClient):
    # 1. Fetch Genres
    genres_res = await async_client.get("/api/v1/content/genres")
    assert genres_res.status_code == 200
    genres = genres_res.json()["data"]
    assert len(genres) >= 10
    genre_slugs = [g["slug"] for g in genres]
    assert "sci-fi" in genre_slugs
    assert "action" in genre_slugs

    # 2. Fetch Featured Content
    featured_res = await async_client.get("/api/v1/content/featured")
    assert featured_res.status_code == 200
    featured = featured_res.json()["data"]
    assert len(featured) >= 3
    assert all(c["is_featured"] is True for c in featured)

    # 3. Keyword Search: "Interstellar"
    search_q = await async_client.get("/api/v1/content/search?q=Interstellar")
    assert search_q.status_code == 200
    results = search_q.json()["data"]["items"]
    assert len(results) >= 1
    interstellar = results[0]
    assert interstellar["title"] == "Interstellar"
    assert interstellar["rating"] >= 8.5
    streaming_plats = [s["platform_slug"] for s in interstellar["streaming_options"]]
    assert "netflix" in streaming_plats or "prime-video" in streaming_plats

    # 4. Content Type Filter: ANIME
    anime_res = await async_client.get("/api/v1/content/search?content_type=ANIME")
    assert anime_res.status_code == 200
    anime_items = anime_res.json()["data"]["items"]
    assert len(anime_items) >= 2
    titles = [a["title"] for a in anime_items]
    assert any("Attack on Titan" in t for t in titles)
    assert any("Demon Slayer" in t for t in titles)

    # 5. Genre Filter: comedy
    comedy_res = await async_client.get("/api/v1/content/search?genre=comedy")
    assert comedy_res.status_code == 200
    comedy_items = comedy_res.json()["data"]["items"]
    assert len(comedy_items) >= 1
    assert any("Panchayat" in c["title"] for c in comedy_items)

    # 6. Platform Filter: spotify
    spotify_res = await async_client.get("/api/v1/content/search?platform=spotify")
    assert spotify_res.status_code == 200
    spotify_items = spotify_res.json()["data"]["items"]
    assert len(spotify_items) >= 2

    # 7. Free-to-stream Filter: is_free=true
    free_res = await async_client.get("/api/v1/content/search?is_free=true")
    assert free_res.status_code == 200
    free_items = free_res.json()["data"]["items"]
    assert len(free_items) >= 2
    assert all(c["is_free"] is True for c in free_items)

    # 8. Single Content Details endpoint
    detail_res = await async_client.get("/api/v1/content/interstellar")
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]
    assert detail["slug"] == "interstellar"
    assert detail["duration_minutes"] == 169
    assert len(detail["streaming_options"]) >= 2
    # Verify stream URLs are valid HTTP(S) deep links
    assert all(s["stream_url"].startswith("http") for s in detail["streaming_options"])

    # 9. RBAC: Regular user cannot create content (403 Forbidden)
    user_reg = await async_client.post("/api/v1/auth/register", json={
        "email": "content_consumer@nexplay.com",
        "password": "Password123!",
        "full_name": "Consumer",
        "country_code": "IN"
    })
    user_token = user_reg.json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    forbidden_create = await async_client.post(
        "/api/v1/content/",
        headers=user_headers,
        json={"title": "Unauthorized Film", "content_type": "MOVIE"}
    )
    assert forbidden_create.status_code == 403

    # 10. Admin can create new content & map streaming links
    admin_reg = await async_client.post("/api/v1/auth/register", json={
        "email": "catalog_director@nexplay.com",
        "password": "DirectorSecret123!",
        "full_name": "Catalog Director",
        "country_code": "IN"
    })
    admin_id = admin_reg.json()["data"]["user"]["id"]

    from tests.conftest import TestingAsyncSessionLocal
    from sqlalchemy import select
    async with TestingAsyncSessionLocal() as session:
        adm = await session.scalar(select(User).where(User.id == admin_id))
        adm.role = UserRole.ADMIN
        await session.commit()

    admin_login = await async_client.post("/api/v1/auth/login", json={
        "email": "catalog_director@nexplay.com",
        "password": "DirectorSecret123!"
    })
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    new_content_payload = {
        "title": "Dune: Part Two",
        "slug": "dune-part-two",
        "content_type": "MOVIE",
        "description": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop",
        "release_date": "2024-03-01",
        "duration_minutes": 166,
        "rating": 8.6,
        "maturity_rating": "PG-13",
        "original_language": "en",
        "is_featured": True,
        "is_free": False,
        "genre_slugs": ["sci-fi", "action"]
    }
    create_content_res = await async_client.post("/api/v1/content/", headers=admin_headers, json=new_content_payload)
    assert create_content_res.status_code == 201
    created_id = create_content_res.json()["data"]["id"]

    # Map streaming platform to Dune: Part Two
    link_plat_res = await async_client.post(
        f"/api/v1/content/{created_id}/platforms",
        headers=admin_headers,
        json={
            "platform_slug": "prime-video",
            "availability_type": "SUBSCRIPTION",
            "pricing_details": "Included with Prime",
            "stream_url": "https://www.primevideo.com/detail/Dune-Part-Two"
        }
    )
    assert link_plat_res.status_code == 200
    assert len(link_plat_res.json()["data"]["streaming_options"]) == 1
    assert link_plat_res.json()["data"]["streaming_options"][0]["platform_slug"] == "prime-video"
