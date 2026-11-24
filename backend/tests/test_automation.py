import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_automation_jobs_listing_and_seeding(async_client: AsyncClient):
    """Test retrieving automation jobs and verifying default seeding."""
    res = await async_client.get("/api/v1/automation/jobs")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    jobs = body["data"]
    assert len(jobs) >= 4

    types = [j["job_type"] for j in jobs]
    assert "HEALTH_CHECK_ALL_PLATFORMS" in types
    assert "PLAYWRIGHT_CHECK" in types
    assert "RENEWAL_REMINDER" in types
    assert "CATALOG_SYNC" in types

@pytest.mark.asyncio
async def test_trigger_automation_job_and_runs(async_client: AsyncClient):
    """Test manually triggering an automation job and verifying run history."""
    # 1. Fetch jobs to get an ID
    res = await async_client.get("/api/v1/automation/jobs")
    jobs = res.json()["data"]
    health_job = next(j for j in jobs if j["job_type"] == "HEALTH_CHECK_ALL_PLATFORMS")
    job_id = health_job["id"]

    # 2. Trigger immediate execution
    run_res = await async_client.post(f"/api/v1/automation/jobs/{job_id}/run")
    assert run_res.status_code == 200
    run_body = run_res.json()
    assert run_body["success"] is True
    assert run_body["data"]["job_id"] == job_id
    assert run_body["data"]["duration_ms"] >= 0

    # 3. List historical runs
    runs_res = await async_client.get("/api/v1/automation/runs")
    assert runs_res.status_code == 200
    runs = runs_res.json()["data"]
    assert len(runs) >= 1
    assert runs[0]["job_id"] == job_id
    assert runs[0]["status"] == "SUCCESS"

@pytest.mark.asyncio
async def test_platform_health_summary_and_details(async_client: AsyncClient):
    """Test ecosystem health summary and granular platform link probing."""
    # 1. Overall health summary
    sum_res = await async_client.get("/api/v1/automation/health-summary")
    assert sum_res.status_code == 200
    summary = sum_res.json()["data"]
    assert summary["total_platforms"] >= 40
    assert summary["healthy_platforms"] >= 35
    assert summary["health_percentage"] >= 80.0
    assert summary["deep_links_checked"] >= 10

    # 2. Granular platform link status report
    det_res = await async_client.get("/api/v1/automation/platforms-health")
    assert det_res.status_code == 200
    platforms = det_res.json()["data"]
    assert len(platforms) >= 40
    p0 = platforms[0]
    assert "platform_name" in p0
    assert "status_code" in p0
    assert "latency_ms" in p0
    assert "is_healthy" in p0

@pytest.mark.asyncio
async def test_user_notifications_flow(async_client: AsyncClient):
    """Test notification retrieval, reading, and unauthenticated protection."""
    # 1. Unauthenticated check must reject 401
    unauth_res = await async_client.get("/api/v1/automation/notifications")
    assert unauth_res.status_code == 401

    # 2. Register user
    reg_res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "auto_notifier@nexplay.com",
            "password": "AutoNotifyPass123!",
            "full_name": "Kavita Reddy"
        }
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["data"]["access_token"]
    user_id = reg_res.json()["data"]["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Upgrade user to Starter plan to enable renewal reminders
    sub_res = await async_client.post(
        "/api/v1/billing/subscribe",
        json={"plan_slug": "starter"},
        headers=headers
    )
    assert sub_res.status_code == 200

    # 4. Trigger renewal reminder job
    jobs_res = await async_client.get("/api/v1/automation/jobs")
    reminder_job = next(j for j in jobs_res.json()["data"] if j["job_type"] == "RENEWAL_REMINDER")
    trigger_res = await async_client.post(f"/api/v1/automation/jobs/{reminder_job['id']}/run")
    assert trigger_res.status_code == 200

    # 5. Fetch user notifications
    notifs_res = await async_client.get("/api/v1/automation/notifications", headers=headers)
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()["data"]
    assert len(notifs) >= 1
    target_notif = notifs[0]
    assert target_notif["is_read"] is False

    # 6. Mark single notification as read
    notif_id = target_notif["id"]
    read_res = await async_client.patch(f"/api/v1/automation/notifications/{notif_id}/read", headers=headers)
    assert read_res.status_code == 200

    # 7. Mark all notifications as read
    read_all_res = await async_client.post("/api/v1/automation/notifications/read-all", headers=headers)
    assert read_all_res.status_code == 200
