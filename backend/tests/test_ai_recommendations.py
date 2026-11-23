import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ai_moods_endpoint(async_client: AsyncClient):
    """Test retrieving pre-curated AI entertainment mood presets."""
    res = await async_client.get("/api/v1/ai/moods")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    moods = body["data"]
    assert len(moods) >= 5
    mood_ids = [m["id"] for m in moods]
    assert "mind-bending" in mood_ids
    assert "adrenaline" in mood_ids
    assert "chill" in mood_ids
    assert "anime-epic" in mood_ids
    assert "deep-focus" in mood_ids

@pytest.mark.asyncio
async def test_ai_recommendation_unauthenticated(async_client: AsyncClient):
    """Test public natural language recommendation without auth."""
    payload = {
        "query": "Find me a sci-fi thriller under 2 hours",
        "limit": 4
    }
    res = await async_client.post("/api/v1/ai/recommend", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["total_results"] > 0
    recs = data["recommendations"]
    assert len(recs) <= 4

    top_rec = recs[0]
    assert "title" in top_rec
    assert "match_score" in top_rec
    assert top_rec["match_score"] >= 50.0
    assert "reasoning" in top_rec
    assert len(top_rec["reasoning"]) > 10
    assert "streaming_options" in top_rec
    assert isinstance(top_rec["streaming_options"], list)

@pytest.mark.asyncio
async def test_ai_recommendation_mood_and_platform_filtering(async_client: AsyncClient):
    """Test AI recommendations targeting specific mood and platform."""
    # 1. Test chill mood (should surface music/lofi)
    chill_res = await async_client.post(
        "/api/v1/ai/recommend",
        json={"mood": "chill", "limit": 3}
    )
    assert chill_res.status_code == 200
    chill_data = chill_res.json()["data"]
    assert chill_data["detected_mood"] == "chill"
    chill_titles = [r["title"] for r in chill_data["recommendations"]]
    assert any("Lo-Fi" in t or "Acoustic" in t for t in chill_titles)

    # 2. Test Crunchyroll anime filtering
    anime_res = await async_client.post(
        "/api/v1/ai/recommend",
        json={"query": "Demon Slayer shonen anime on Crunchyroll", "limit": 2}
    )
    assert anime_res.status_code == 200
    anime_data = anime_res.json()["data"]
    assert len(anime_data["recommendations"]) > 0
    assert anime_data["recommendations"][0]["title"] == "Demon Slayer: Kimetsu no Yaiba"

@pytest.mark.asyncio
async def test_ai_copilot_chat(async_client: AsyncClient):
    """Test multi-turn interactive conversational Copilot assistant."""
    payload = {
        "messages": [
            {"role": "user", "content": "What is a great sci-fi movie with high ratings?"}
        ],
        "mood": "mind-bending"
    }
    res = await async_client.post("/api/v1/ai/chat", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["role"] == "assistant"
    assert len(data["content"]) > 20
    assert len(data["recommendations"]) > 0
    assert len(data["suggested_followups"]) >= 2

@pytest.mark.asyncio
async def test_ai_recommendation_authenticated_with_credits_and_history(async_client: AsyncClient):
    """Test personalized AI recommendations, credit wallet deduction, and history persistence."""
    # 1. Register test user
    user_payload = {
        "email": "ai_copilot_tester@nexplay.com",
        "password": "AiPassword123!",
        "full_name": "Aarav Sharma"
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Call AI recommend with authentication
    rec_res = await async_client.post(
        "/api/v1/ai/recommend",
        json={"query": "Recommend something inspiring and mind-bending", "limit": 3},
        headers=headers
    )
    assert rec_res.status_code == 200
    rec_data = rec_res.json()["data"]
    assert rec_data["credits_used"] == 1
    assert rec_data["credits_remaining"] is not None
    assert rec_data["credits_remaining"] == 99 # Initial wallet is 100

    # 3. Fetch recommendation audit history
    hist_res = await async_client.get("/api/v1/ai/history", headers=headers)
    assert hist_res.status_code == 200
    hist_body = hist_res.json()
    assert hist_body["success"] is True
    history = hist_body["data"]
    assert len(history) >= 1
    assert "content_title" in history[0]
    assert "score" in history[0]
    assert "reasoning" in history[0]
