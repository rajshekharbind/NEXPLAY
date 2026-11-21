import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_user_registration_and_login(async_client: AsyncClient):
    # 1. Register a new user
    reg_payload = {
        "email": "test_user_vip@nexplay.com",
        "password": "StrongPassword123!",
        "full_name": "Aman Sharma",
        "country_code": "IN",
        "preferred_language": "hi"
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert "access_token" in reg_data["data"]
    assert "refresh_token" in reg_data["data"]
    user_info = reg_data["data"]["user"]
    assert user_info["email"] == "test_user_vip@nexplay.com"
    assert user_info["role"] == "USER"
    assert user_info["wallet"]["balance_credits"] == 100 # 100 free onboarding credits!

    # 2. Reject duplicate registration
    dup_res = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Login with correct password
    login_payload = {
        "email": "test_user_vip@nexplay.com",
        "password": "StrongPassword123!"
    }
    login_res = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    access_token = login_data["data"]["access_token"]
    refresh_token = login_data["data"]["refresh_token"]

    # 4. Login with wrong password returns 401
    bad_login = await async_client.post("/api/v1/auth/login", json={
        "email": "test_user_vip@nexplay.com",
        "password": "WrongPassword999"
    })
    assert bad_login.status_code == 401

    # 5. Get /api/v1/auth/me using Bearer token
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()["data"]
    assert me_data["email"] == "test_user_vip@nexplay.com"
    assert me_data["profile"]["full_name"] == "Aman Sharma"
    assert me_data["wallet"]["balance_credits"] == 100

    # 6. Refresh token rotation
    ref_res = await async_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_res.status_code == 200
    ref_data = ref_res.json()["data"]
    assert "access_token" in ref_data
    assert "refresh_token" in ref_data

    # 7. Update User Profile
    up_res = await async_client.put(
        "/api/v1/users/profile",
        headers=headers,
        json={"full_name": "Aman Sharma (Pro)", "bio": "Sci-Fi and Lo-Fi connoisseur."}
    )
    assert up_res.status_code == 200
    assert up_res.json()["data"]["full_name"] == "Aman Sharma (Pro)"

    # 8. User Preferences
    pref_res = await async_client.get("/api/v1/users/preferences", headers=headers)
    assert pref_res.status_code == 200

    pref_up = await async_client.put(
        "/api/v1/users/preferences",
        headers=headers,
        json={"favorite_genres": ["Sci-Fi", "Anime", "Action"], "mood_tags": ["Late Night", "Focus"]}
    )
    assert pref_up.status_code == 200
    assert "Anime" in pref_up.json()["data"]["favorite_genres"]

    # 9. User Wallet
    wallet_res = await async_client.get("/api/v1/users/wallet", headers=headers)
    assert wallet_res.status_code == 200
    assert wallet_res.json()["data"]["balance_credits"] == 100

    # 10. Public Subscription Plans
    plans_res = await async_client.get("/api/v1/billing/plans")
    assert plans_res.status_code == 200
    plans_data = plans_res.json()["data"]
    assert len(plans_data) >= 4
    plan_slugs = [p["slug"] for p in plans_data]
    assert "free" in plan_slugs
    assert "starter" in plan_slugs
    assert "plus" in plan_slugs
    assert "pro" in plan_slugs

    # 11. Current user active subscription (defaults to FREE)
    sub_res = await async_client.get("/api/v1/billing/subscription", headers=headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["data"]["status"] == "ACTIVE"

    # 12. Upgrade to Pro Tier (₹299/mo, 3000 credits)
    upgrade_res = await async_client.post(
        "/api/v1/billing/subscribe",
        headers=headers,
        json={"plan_slug": "pro"}
    )
    assert upgrade_res.status_code == 200
    up_data = upgrade_res.json()["data"]
    assert up_data["plan"]["slug"] == "pro"
    assert up_data["plan"]["price_inr"] == 299.0

    # Verify user role upgraded to PREMIUM_USER
    me_after_upgrade = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_after_upgrade.status_code == 200
    assert me_after_upgrade.json()["data"]["role"] == "PREMIUM_USER"
    # Wallet balance should be 100 welcome + 2000 pro credits = 2100
    assert me_after_upgrade.json()["data"]["wallet"]["balance_credits"] == 2100

    # 13. Top up additional credits
    topup_res = await async_client.post(
        "/api/v1/billing/add-credits",
        headers=headers,
        json={"credits": 250, "payment_method": "upi"}
    )
    assert topup_res.status_code == 200
    assert topup_res.json()["data"]["balance_credits"] == 2350

    # 14. Transaction history
    txn_res = await async_client.get("/api/v1/billing/transactions", headers=headers)
    assert txn_res.status_code == 200
    txns = txn_res.json()["data"]
    assert len(txns) >= 2 # Pro plan grant + Top-up grant

