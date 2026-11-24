import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_credit_packs_endpoint(async_client: AsyncClient):
    """Test retrieving standard credit top-up packages."""
    res = await async_client.get("/api/v1/billing/credit-packs")
    assert res.status_code == 200
    packs = res.json()["data"]
    assert len(packs) == 4
    pack_ids = [p["id"] for p in packs]
    assert "starter_pack" in pack_ids
    assert "popular_pack" in pack_ids
    assert "power_pack" in pack_ids
    assert "enterprise_pack" in pack_ids

@pytest.mark.asyncio
async def test_billing_analytics_endpoint(async_client: AsyncClient):
    """Test user billing analytics, burn rate, and usage breakdown."""
    # Register user
    reg_res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "analytics_user@nexplay.com",
            "password": "AnalyticsPass123!",
            "full_name": "Maya Sen"
        }
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch analytics
    ana_res = await async_client.get("/api/v1/billing/analytics", headers=headers)
    assert ana_res.status_code == 200
    data = ana_res.json()["data"]
    assert "balance_credits" in data
    assert data["balance_credits"] >= 100
    assert "plan_tier" in data
    assert "by_feature" in data
    assert len(data["daily_usage_last_7_days"]) == 7

@pytest.mark.asyncio
async def test_tax_invoice_generation(async_client: AsyncClient):
    """Test generating official itemized tax invoice with 18% GST calculation."""
    # Register user
    reg_res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "invoice_tester@nexplay.com",
            "password": "InvoicePass123!",
            "full_name": "Vikram Seth"
        }
    )
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create & verify payment
    order_res = await async_client.post(
        "/api/v1/billing/checkout/order",
        json={"amount": 149.0, "purpose": "SUBSCRIPTION", "plan_slug": "plus"},
        headers=headers
    )
    payment_id = order_res.json()["data"]["payment_id"]

    await async_client.post(
        "/api/v1/billing/checkout/verify",
        json={"payment_id": payment_id, "provider_payment_id": "pay_live_test_123"},
        headers=headers
    )

    # Fetch Tax Invoice
    inv_res = await async_client.get(f"/api/v1/billing/payments/{payment_id}/invoice", headers=headers)
    assert inv_res.status_code == 200
    invoice = inv_res.json()["data"]
    assert "invoice_number" in invoice
    assert invoice["customer_email"] == "invoice_tester@nexplay.com"
    assert invoice["total_inr"] == 149.0
    assert invoice["status"] == "PAID"
    assert invoice["tax_gst_inr"] > 0
    assert round(invoice["subtotal_inr"] + invoice["tax_gst_inr"], 2) == 149.0

@pytest.mark.asyncio
async def test_streaming_spending_tracker_and_summary(async_client: AsyncClient):
    """Test connecting external streaming subscriptions and spending intelligence."""
    # Register user
    reg_res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "spending_tracker@nexplay.com",
            "password": "SpendingPass123!",
            "full_name": "Pooja Hegde"
        }
    )
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add Netflix subscription
    n_res = await async_client.post(
        "/api/v1/billing/connected-services",
        json={
            "platform_slug": "netflix",
            "plan_name": "Premium 4K",
            "cost_inr": 649.0,
            "billing_cycle": "MONTHLY"
        },
        headers=headers
    )
    assert n_res.status_code == 200
    n_data = n_res.json()["data"]
    service_id = n_data["id"]
    assert n_data["platform_name"] == "Netflix"
    assert n_data["cost_inr"] == 649.0

    # 2. Add Spotify subscription
    s_res = await async_client.post(
        "/api/v1/billing/connected-services",
        json={
            "platform_slug": "spotify",
            "plan_name": "Premium Individual",
            "cost_inr": 119.0,
            "billing_cycle": "MONTHLY"
        },
        headers=headers
    )
    assert s_res.status_code == 200

    # 3. List connected services
    list_res = await async_client.get("/api/v1/billing/connected-services", headers=headers)
    assert list_res.status_code == 200
    services = list_res.json()["data"]
    assert len(services) == 2

    # 4. Get Spending Summary & Intelligence
    sum_res = await async_client.get("/api/v1/billing/spending-summary", headers=headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()["data"]
    assert summary["services_count"] == 2
    assert summary["total_monthly_spend_inr"] == 768.0 # 649 + 119
    assert summary["combined_entertainment_budget"] >= 768.0
    assert len(summary["savings_recommendations"]) >= 1

    # 5. Delete service
    del_res = await async_client.delete(f"/api/v1/billing/connected-services/{service_id}", headers=headers)
    assert del_res.status_code == 200
