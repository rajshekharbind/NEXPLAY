import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_user_watchlist_system(async_client: AsyncClient):
    # 1. Unauthenticated request to /api/v1/watchlists must return 401
    unauth_res = await async_client.get("/api/v1/watchlists")
    assert unauth_res.status_code == 401

    # 2. Register & Login test user
    user_payload = {
        "email": "watchlist_tester@nexplay.com",
        "password": "WatchlistPassword123!",
        "full_name": "Rohan Verma"
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. List watchlists: automatically initializes default 'My Watchlist'
    wl_list_res = await async_client.get("/api/v1/watchlists", headers=headers)
    assert wl_list_res.status_code == 200
    watchlists = wl_list_res.json()["data"]
    assert len(watchlists) >= 1
    default_wl = next((w for w in watchlists if w["is_default"]), None)
    assert default_wl is not None
    assert default_wl["name"] == "My Watchlist"
    assert default_wl["items_count"] == 0
    default_wl_id = default_wl["id"]

    # 4. Create a custom watchlist
    custom_res = await async_client.post(
        "/api/v1/watchlists",
        json={"name": "Weekend Anime Binge", "is_public": False},
        headers=headers
    )
    assert custom_res.status_code == 201
    custom_wl = custom_res.json()["data"]
    assert custom_wl["name"] == "Weekend Anime Binge"
    assert custom_wl["is_default"] is False
    custom_wl_id = custom_wl["id"]

    # 5. Retrieve content item to add (e.g. search 'Interstellar')
    search_res = await async_client.get("/api/v1/content/search?q=Interstellar")
    assert search_res.status_code == 200
    items = search_res.json()["data"]["items"]
    assert len(items) > 0
    content_id = items[0]["id"]
    content_title = items[0]["title"]

    # 6. Add content item to custom watchlist
    add_res = await async_client.post(
        f"/api/v1/watchlists/{custom_wl_id}/items",
        json={
            "content_id": content_id,
            "status": "PLANNED",
            "personal_rating": 9.2,
            "notes": "Rewatch with headphones"
        },
        headers=headers
    )
    assert add_res.status_code == 201
    added_item = add_res.json()["data"]
    assert added_item["content_id"] == content_id
    assert added_item["status"] == "PLANNED"
    assert added_item["personal_rating"] == 9.2
    assert added_item["content"]["title"] == content_title
    item_id = added_item["id"]

    # 7. Check content status endpoint
    check_res = await async_client.get(f"/api/v1/watchlists/check/{content_id}", headers=headers)
    assert check_res.status_code == 200
    check_data = check_res.json()["data"]
    assert check_data["in_watchlist"] is True
    assert check_data["item_id"] == item_id

    # 8. Update item progress status (PLANNED -> WATCHING)
    update_res = await async_client.patch(
        f"/api/v1/watchlists/items/{item_id}",
        json={"status": "WATCHING", "personal_rating": 9.5},
        headers=headers
    )
    assert update_res.status_code == 200
    updated_item = update_res.json()["data"]
    assert updated_item["status"] == "WATCHING"
    assert updated_item["personal_rating"] == 9.5

    # 9. Get custom watchlist detail with filter
    detail_res = await async_client.get(f"/api/v1/watchlists/{custom_wl_id}?status_filter=WATCHING", headers=headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()["data"]
    assert detail_data["items_count"] == 1
    assert detail_data["items"][0]["status"] == "WATCHING"

    # 10. Quick 1-Click Toggle Bookmark (Default Watchlist)
    # First toggle: should ADD to default watchlist
    toggle1_res = await async_client.post(
        "/api/v1/watchlists/toggle",
        json={"content_id": content_id, "status": "PLANNED"},
        headers=headers
    )
    assert toggle1_res.status_code == 200
    t1_data = toggle1_res.json()["data"]
    assert t1_data["action"] == "added"
    assert t1_data["watchlist_id"] == default_wl_id

    # Second toggle: should REMOVE from default watchlist
    toggle2_res = await async_client.post(
        "/api/v1/watchlists/toggle",
        json={"content_id": content_id},
        headers=headers
    )
    assert toggle2_res.status_code == 200
    t2_data = toggle2_res.json()["data"]
    assert t2_data["action"] == "removed"

    # 11. Remove item from custom watchlist
    del_item_res = await async_client.delete(f"/api/v1/watchlists/items/{item_id}", headers=headers)
    assert del_item_res.status_code == 200
    assert del_item_res.json()["data"]["deleted_item_id"] == item_id

    # 12. Delete custom watchlist
    del_wl_res = await async_client.delete(f"/api/v1/watchlists/{custom_wl_id}", headers=headers)
    assert del_wl_res.status_code == 200
    assert del_wl_res.json()["data"]["deleted_id"] == custom_wl_id

    # 13. Attempt to delete default watchlist should be rejected (400)
    del_default_res = await async_client.delete(f"/api/v1/watchlists/{default_wl_id}", headers=headers)
    assert del_default_res.status_code == 400
