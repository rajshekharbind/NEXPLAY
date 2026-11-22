import pytest
from httpx import AsyncClient
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token

@pytest.mark.asyncio
async def test_admin_platform_management_and_rbac(async_client: AsyncClient):
    # 1. Register a regular user
    user_payload = {
        "email": "regular_viewer@nexplay.com",
        "password": "Password123!",
        "full_name": "Regular Viewer",
        "country_code": "IN"
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    user_token = reg_res.json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 2. Regular user blocked from admin stats (403 Forbidden)
    forbidden_stats = await async_client.get("/api/v1/admin/stats", headers=user_headers)
    assert forbidden_stats.status_code == 403

    # 3. Anonymous user blocked from admin stats (401 Unauthorized)
    unauth_stats = await async_client.get("/api/v1/admin/stats")
    assert unauth_stats.status_code == 401

    # 4. Create an Admin user
    admin_payload = {
        "email": "system_admin@nexplay.com",
        "password": "AdminPassword123!",
        "full_name": "Chief Platform Admin",
        "country_code": "IN"
    }
    admin_reg = await async_client.post("/api/v1/auth/register", json=admin_payload)
    assert admin_reg.status_code == 201
    admin_id = admin_reg.json()["data"]["user"]["id"]

    # Elevate role in database directly for test
    from tests.conftest import TestingAsyncSessionLocal
    from sqlalchemy import select
    async with TestingAsyncSessionLocal() as session:
        adm = await session.scalar(select(User).where(User.id == admin_id))
        adm.role = UserRole.ADMIN
        await session.commit()

    # Login to receive Admin claims token
    admin_login = await async_client.post("/api/v1/auth/login", json={
        "email": "system_admin@nexplay.com",
        "password": "AdminPassword123!"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 5. Admin can fetch stats
    stats_res = await async_client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    assert stats["total_platforms"] >= 40
    assert stats["active_platforms"] >= 40
    assert stats["total_categories"] == 6

    # 6. Admin list all platforms
    list_res = await async_client.get("/api/v1/admin/platforms", headers=admin_headers)
    assert list_res.status_code == 200
    platforms = list_res.json()["data"]
    assert len(platforms) >= 40

    # 7. Get category ID for OTT
    cats_res = await async_client.get("/api/v1/platforms/categories")
    assert cats_res.status_code == 200
    ott_cat = next(c for c in cats_res.json()["data"] if c["slug"] == "ott")
    ott_cat_id = ott_cat["id"]

    # 8. Admin Create New Platform: "Mubi Cinema"
    new_platform_payload = {
        "category_id": ott_cat_id,
        "name": "Mubi Cinema",
        "slug": "mubi-cinema",
        "official_url": "https://mubi.com",
        "logo_url": "https://mubi.com/favicon.ico",
        "banner_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
        "description": "A curated streaming service presenting a hand-picked selection of classic and contemporary films.",
        "pricing_type": "SUBSCRIPTION",
        "integration_type": "OFFICIAL_LINK",
        "display_priority": 85,
        "is_active": True
    }
    create_res = await async_client.post("/api/v1/admin/platforms", headers=admin_headers, json=new_platform_payload)
    assert create_res.status_code == 201
    created_plat = create_res.json()["data"]
    assert created_plat["name"] == "Mubi Cinema"
    plat_id = created_plat["id"]

    # 9. Verify duplicate name rejected
    dup_res = await async_client.post("/api/v1/admin/platforms", headers=admin_headers, json=new_platform_payload)
    assert dup_res.status_code == 400

    # 10. Admin Update Platform (Update priority & description)
    update_res = await async_client.put(
        f"/api/v1/admin/platforms/{plat_id}",
        headers=admin_headers,
        json={"display_priority": 99, "description": "Updated curated cinema platform."}
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["display_priority"] == 99
    assert update_res.json()["data"]["description"] == "Updated curated cinema platform."

    # 11. Admin Health Check Probe
    health_probe = await async_client.post(
        f"/api/v1/admin/platforms/{plat_id}/health-check",
        headers=admin_headers
    )
    assert health_probe.status_code == 200
    probe_data = health_probe.json()["data"]
    assert probe_data["platform_id"] == plat_id
    assert "status" in probe_data

    # 12. Public API includes newly added platform
    pub_res = await async_client.get("/api/v1/platforms/?search=Mubi")
    assert pub_res.status_code == 200
    pub_plats = pub_res.json()["data"]
    assert any(p["slug"] == "mubi-cinema" for p in pub_plats)

    # 13. Admin Soft-Deactivate Platform
    deact_res = await async_client.delete(f"/api/v1/admin/platforms/{plat_id}", headers=admin_headers)
    assert deact_res.status_code == 200
    assert "deactivated" in deact_res.json()["message"]

    # 14. Public API now excludes deactivated platform
    pub_res_after = await async_client.get("/api/v1/platforms/?search=Mubi")
    assert pub_res_after.status_code == 200
    assert not any(p["slug"] == "mubi-cinema" for p in pub_res_after.json()["data"])
